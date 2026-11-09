<script setup lang="ts">
import type { AnggotaOptionsResponse } from "~/features/simpanan/model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError } from "~/composables/toast";
import { authClient } from "~/utils/auth";

const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isLoading = ref(false);
const selectedId = ref<number>();
const { data, status, error, refresh } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options");
const options = computed(() =>
  (data.value?.data ?? [])
    .filter((user) => String(user.id) !== String(session.value.data?.user.id))
    .map((user) => ({
      value: user.id,
      label: user.name,
      description: [user.noAnggota, user.namaKelompok].filter(Boolean).join(" · "),
    })),
);

async function onSubmit() {
  if (isLoading.value || !selectedId.value || status.value !== "success") return;
  isLoading.value = true;
  try {
    const { error } = await authClient.admin.impersonateUser({ userId: String(selectedId.value) });
    if (error) throw new Error(error.message || "Gagal melakukan impersonate.");
    await navigateTo("/dashboard", { external: true, replace: true });
  } catch (error) {
    useToastError("Impersonate Gagal", extractErrorMessage(error, "Silakan coba lagi."));
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Masuk sebagai pengguna"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <form id="form-impersonate" class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Pengguna" required>
          <USelectMenu
            v-model="selectedId"
            :items="options"
            value-key="value"
            :filter-fields="['label', 'description']"
            :search-input="{ placeholder: 'Cari nama atau nomor anggota...' }"
            :loading="status === 'pending'"
            :disabled="isLoading || status !== 'success'"
            placeholder="Pilih pengguna"
            aria-label="Pilih pengguna untuk impersonate"
            virtualize
            class="w-full"
          >
            <template #empty>Tidak ada pengguna yang sesuai.</template>
          </USelectMenu>
        </UFormField>
        <UAlert
          v-if="error"
          title="Gagal Memuat Pengguna"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refresh() }]"
        />
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton color="neutral" variant="outline" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton
          type="submit"
          form="form-impersonate"
          icon="i-tabler-user-share"
          :loading="isLoading"
          :disabled="!selectedId || status !== 'success'"
        >
          Masuk
        </UButton>
      </div>
    </template>
  </UModal>
</template>
