<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SahamSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { initSahamFormdata, sahamSchema } from "../model";
import HargaSahamRealtime from "./HargaSahamRealtime.vue";

const props = defineProps<{
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const state = reactive({ ...initSahamFormdata });
const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<SahamSchema>) {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    await $fetch("/api/v1/master-saham", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Menyimpan Harga Saham",
      extractErrorMessage(error, "Harga saham gagal disimpan. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }

  useToastSuccess("Harga Saham Berhasil Ditambahkan", "Harga terbaru siap digunakan.");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Tambah Harga Saham"
    description="Harga terbaru yang berlaku dan tercatat dalam riwayat."
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <HargaSahamRealtime class="mb-4 rounded-lg border border-default p-4" />
      <UForm
        id="form-saham"
        :schema="sahamSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Harga Jual per Saham (Rp)" name="hargaJual" required>
          <UInputNumber
            v-model="state.hargaJual"
            :min="1"
            :step="1"
            :increment="false"
            :decrement="false"
            :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
            locale="id-ID"
            placeholder="Rp 0"
            disable-wheel-change
            class="w-full"
          />
        </UFormField>
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
