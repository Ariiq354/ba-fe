<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type {
  MasterInputTransaksi,
  MasterInputTransaksiResponse,
} from "~/features/master-input-transaksi/model";
import type { JurnalTemplateSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { initJurnalTemplateFormdata, jurnalTemplateSchema, maxJurnalAmount } from "../model";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const state = reactive(initJurnalTemplateFormdata());
const isLoading = ref(false);

const {
  data: templates,
  status: templateStatus,
  error: templateError,
  refresh: refreshTemplates,
} = useAsyncData("jurnal-template-options", async () => {
  const results: MasterInputTransaksi[] = [];
  const limit = 100;
  let page = 1;
  let total = 0;
  do {
    const response = await $fetch<MasterInputTransaksiResponse>("/api/v1/master-input-transaksi", {
      baseURL: API_URL,
      credentials: "include",
      query: { page, limit, search: "", isActive: true },
    });
    results.push(...response.data);
    total = response.total;
    page++;
    if (!response.data.length) break;
  } while (results.length < total);
  return results.filter((template) => template.isActive);
});

const templateOptions = computed(() =>
  (templates.value ?? []).map((template) => ({ label: template.nama, value: template.id })),
);
const templatesReady = computed(
  () => templateStatus.value === "success" && !!templates.value?.length,
);
const selectedTemplate = computed(() =>
  templates.value?.find((template) => template.id === state.masterInputTransaksiId),
);

async function onSubmit(event: FormSubmitEvent<JurnalTemplateSchema>) {
  if (isLoading.value || !templatesReady.value || !selectedTemplate.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/jurnal/template", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Menyimpan Jurnal",
      extractErrorMessage(error, "Jurnal gagal disimpan. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess("Jurnal Berhasil Ditambahkan", "Pencatatan debit dan kredit telah disimpan.");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Tambah Transaksi"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-jurnal-template"
        :schema="jurnalTemplateSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          v-if="templateError"
          title="Gagal Memuat Transaksi"
          description="Silakan coba lagi."
          color="error"
          variant="subtle"
          :actions="[
            {
              label: 'Coba lagi',
              color: 'error',
              variant: 'outline',
              onClick: () => refreshTemplates(),
            },
          ]"
        />
        <UAlert
          v-else-if="templateStatus === 'success' && !templates?.length"
          title="Belum Ada Transaksi Aktif"
          description="Tambahkan atau aktifkan template di Master Input."
          color="info"
          variant="subtle"
        />
        <UFormField label="Transaksi" name="masterInputTransaksiId" required>
          <USelectMenu
            v-model="state.masterInputTransaksiId"
            :items="templateOptions"
            value-key="value"
            placeholder="Pilih transaksi"
            :search-input="{ placeholder: 'Cari transaksi...' }"
            :loading="templateStatus === 'pending'"
            :disabled="!templatesReady || isLoading"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Tanggal Transaksi" name="tanggalTransaksi" required>
          <UInput v-model="state.tanggalTransaksi" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Nominal (Rp)" name="nominal" required>
          <UInputNumber
            v-model="state.nominal"
            :min="1"
            :max="maxJurnalAmount"
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
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea
            v-model="state.keterangan"
            placeholder="Tambahkan keterangan (opsional)"
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
        <UButton
          type="submit"
          form="form-jurnal-template"
          icon="i-tabler-check"
          :loading="isLoading"
          :disabled="!templatesReady || !selectedTemplate"
        >
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
