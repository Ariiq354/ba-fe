<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SahamSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { initSahamFormdata, sahamSchema } from "../model";

const props = defineProps<{
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const state = reactive({ ...initSahamFormdata });
const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<SahamSchema>) {
  if (isLoading.value)
    return;
  isLoading.value = true;

  try {
    await $fetch("/api/v1/master-saham", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  }
  catch (error) {
    useToastError("Gagal Menyimpan Harga Saham", extractErrorMessage(error, "Harga saham gagal disimpan. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }

  useToastSuccess("Harga Saham Berhasil Ditambahkan");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Tambah Harga Saham"
    description="Harga jual baru akan berlaku sebagai harga terbaru dan tercatat dalam riwayat."
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm id="form-saham" :schema="sahamSchema" :state="state" :disabled="isLoading" class="space-y-4" @submit="onSubmit">
        <UFormField label="Harga Jual per Saham (Rp)" name="hargaJual" required>
          <UInputNumber v-model="state.hargaJual" :min="1" :step="1" placeholder="Masukkan harga jual" class="w-full" />
        </UFormField>
        <p class="text-sm text-muted">
          Harga nominal saham ditentukan otomatis oleh sistem.
        </p>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton type="submit" form="form-saham" icon="i-tabler-check" :loading="isLoading">
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
