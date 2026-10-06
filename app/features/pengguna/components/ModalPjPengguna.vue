<script setup lang="ts">
import type { Pengguna, SetPenggunaPjSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { canSetPenggunaPj, isPenggunaPj } from "../model";

const props = defineProps<{
  pengguna: Pengguna;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "pengguna", "manage"));
const isLoading = ref(false);
const isPj = !isPenggunaPj(props.pengguna);

async function onConfirm() {
  if (isLoading.value || !canManage.value || !canSetPenggunaPj(props.pengguna))
    return;
  isLoading.value = true;
  const body: SetPenggunaPjSchema = { isPj };

  try {
    await $fetch(`/api/v1/pengguna/${props.pengguna.id}/pj`, {
      baseURL: API_URL,
      method: "PATCH",
      credentials: "include",
      body,
    });
  }
  catch (error) {
    useToastError("Gagal Mengubah PJ Kelompok", extractErrorMessage(error, "Status PJ kelompok gagal diubah. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }

  useToastSuccess(
    isPj ? "PJ Kelompok Berhasil Ditambahkan" : "PJ Kelompok Berhasil Dilepas",
    isPj ? `${props.pengguna.name} menjadi PJ ${props.pengguna.namaKelompok}.` : `${props.pengguna.name} kembali menjadi anggota biasa.`,
  );
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    :title="isPj ? 'Jadikan PJ Kelompok' : 'Lepas PJ Kelompok'"
    description="Konfirmasi perubahan penanggung jawab kelompok pengguna."
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-5">
        <dl class="space-y-3 rounded-lg bg-elevated p-4">
          <div>
            <dt class="text-sm text-muted">
              Nama Pengguna
            </dt>
            <dd class="font-medium">
              {{ pengguna.name }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Nomor Anggota
            </dt>
            <dd class="font-mono">
              {{ pengguna.noAnggota }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Kelompok
            </dt>
            <dd>{{ pengguna.kodeKelompok }} · {{ pengguna.namaKelompok }}</dd>
          </div>
        </dl>
        <p class="text-sm text-muted">
          {{ isPj ? 'Pengguna akan menjadi penanggung jawab untuk kelompoknya.' : 'Pengguna akan kembali menjadi anggota biasa dan tidak lagi menjadi penanggung jawab kelompoknya.' }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton
          :icon="isPj ? 'i-tabler-users-group' : 'i-tabler-user-minus'"
          :color="isPj ? 'primary' : 'warning'"
          :loading="isLoading"
          :disabled="!canManage"
          @click="onConfirm"
        >
          {{ isPj ? 'Jadikan PJ' : 'Lepas PJ' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
