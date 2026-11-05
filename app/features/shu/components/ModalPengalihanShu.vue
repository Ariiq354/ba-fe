<script setup lang="ts">
import type { ReferensiShu } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient } from "~/utils/auth";

const props = defineProps<{ referensi: ReferensiShu; refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const nuxtApp = useNuxtApp();
const isLoading = ref(false);
const canTransfer = computed(
  () =>
    session.value.data?.user.role === "admin" &&
    props.referensi.sudahDibagikan &&
    !props.referensi.sudahDialihkan,
);

async function onConfirm() {
  if (isLoading.value || !canTransfer.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/shu/pengalihan", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: { tahun: props.referensi.tahun },
    });
  } catch (error) {
    useToastError(
      "Gagal Mengalihkan SHU",
      extractErrorMessage(error, "SHU gagal dialihkan. Silakan coba lagi."),
    );
    emit("close");
    await props.refresh();
    return;
  }
  useToastSuccess(
    "SHU Berhasil Dialihkan",
    `SHU ${props.referensi.tahun} telah masuk ke tabungan anggota.`,
  );
  emit("close");
  const saldoKeys = Object.keys(nuxtApp.payload.data).filter((key) =>
    key.startsWith("simpanan-saldo-"),
  );
  await Promise.all([props.refresh(), ...(saldoKeys.length ? [refreshNuxtData(saldoKeys)] : [])]);
}
</script>

<template>
  <UModal
    title="Alihkan SHU ke Tabungan"
    :description="`Tahun ${referensi.tahun}`"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <p>Alihkan SHU {{ referensi.tahun }} seluruh anggota ke tabungan?</p>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton color="neutral" variant="outline" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton :loading="isLoading" :disabled="!canTransfer" @click="onConfirm">
          Alihkan ke Tabungan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
