<script setup lang="ts">
import type { Pengguna, VerifikasiPenggunaResponse } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { getPenggunaStatus } from "../model";

const props = defineProps<{
  pengguna: Pengguna;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "pengguna", "manage"));
const isLoading = ref(false);

async function onConfirm() {
  if (isLoading.value || !canManage.value || getPenggunaStatus(props.pengguna) !== "pending")
    return;
  isLoading.value = true;

  let result: VerifikasiPenggunaResponse;
  try {
    result = await $fetch<VerifikasiPenggunaResponse>(`/api/v1/pengguna/${props.pengguna.id}/verifikasi`, {
      baseURL: API_URL,
      method: "PATCH",
      credentials: "include",
    });
  }
  catch (error) {
    useToastError("Gagal Memverifikasi Pengguna", extractErrorMessage(error, "Pengguna gagal diverifikasi. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }

  useToastSuccess("Pengguna Berhasil Diverifikasi", `${props.pengguna.name} · Nomor anggota: ${result.noAnggota}`);
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Verifikasi Pengguna"
    description="Konfirmasi verifikasi pengguna untuk mengaktifkan akun dan menerbitkan nomor anggota."
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
              Username
            </dt>
            <dd>{{ pengguna.username || '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Kelompok
            </dt>
            <dd>{{ pengguna.kodeKelompok }} · {{ pengguna.namaKelompok }}</dd>
          </div>
        </dl>
        <p class="text-sm text-muted">
          Setelah diverifikasi, pengguna dapat masuk ke aplikasi. Nomor anggota akan dibuat otomatis berdasarkan kelompoknya.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton icon="i-tabler-user-check" :loading="isLoading" :disabled="!canManage" @click="onConfirm">
          Verifikasi
        </UButton>
      </div>
    </template>
  </UModal>
</template>
