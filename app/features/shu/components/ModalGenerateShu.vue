<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { GenerateShu, ReferensiShu } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { formatRupiah } from "~/utils/format";
import { generateShuSchema } from "../model";

const props = defineProps<{ referensi: ReferensiShu; refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const isLoading = ref(false);
const state = reactive({ totalShu: undefined as number | undefined });
const schema = computed(() => generateShuSchema(props.referensi.batasShu));
const canGenerate = computed(() => !props.referensi.sudahDibagikan && props.referensi.batasShu > 0);

async function onSubmit(event: FormSubmitEvent<GenerateShu>) {
  if (isLoading.value || !canGenerate.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/shu", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: { tahun: props.referensi.tahun, totalShu: event.data.totalShu },
    });
  } catch (error) {
    useToastError(
      "Gagal Generate SHU",
      extractErrorMessage(error, "SHU gagal dibuat. Silakan coba lagi."),
    );
    emit("close");
    await props.refresh();
    return;
  }
  useToastSuccess("SHU Berhasil Dibuat", `Pembagian SHU ${props.referensi.tahun} telah disimpan.`);
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Generate SHU"
    :description="`SHU ${referensi.tahun} · Seluruh anggota`"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-5">
        <dl class="grid grid-cols-2 gap-4">
          <div>
            <dt class="text-sm text-muted">Laba Tahun {{ referensi.tahun }}</dt>
            <dd class="font-medium">{{ formatRupiah(referensi.laba) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">Batas SHU</dt>
            <dd class="font-medium">{{ formatRupiah(referensi.batasShu) }}</dd>
          </div>
        </dl>
        <UForm
          id="form-generate-shu"
          :schema="schema"
          :state="state"
          :disabled="isLoading"
          @submit="onSubmit"
        >
          <UFormField label="Total SHU" name="totalShu" required>
            <UInputNumber
              v-model="state.totalShu"
              :min="1"
              :max="referensi.batasShu"
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
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton color="neutral" variant="outline" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton
          type="submit"
          form="form-generate-shu"
          :loading="isLoading"
          :disabled="!canGenerate"
        >
          Generate SHU
        </UButton>
      </div>
    </template>
  </UModal>
</template>
