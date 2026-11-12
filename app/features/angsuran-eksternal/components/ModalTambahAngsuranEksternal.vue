<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { TambahAngsuranEksternal } from "../model";
import type { PembiayaanEksternalOptionsResponse } from "~/features/pembiayaan-eksternal/model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { PEMBIAYAAN_EKSTERNAL_OPTIONS_KEY } from "~/features/pembiayaan-eksternal/data";
import { maxExternalAmount } from "~/features/pembiayaan-eksternal/model";
import { getJakartaDate } from "~/utils/date";
import { formatRupiah } from "~/utils/format";
import { getAngsuranEksternalSchema } from "../model";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const isLoading = ref(false);
const today = getJakartaDate();
const state = reactive({
  pembiayaanEksternalId: undefined as number | undefined,
  tanggalTransaksi: today,
  jumlahPembayaran: undefined as number | undefined,
  keterangan: "",
});
const {
  data,
  status,
  error,
  refresh: refreshOptions,
} = useApi<PembiayaanEksternalOptionsResponse>("/api/v1/pembiayaan-eksternal/options", {
  key: PEMBIAYAAN_EKSTERNAL_OPTIONS_KEY,
});
const options = computed(() =>
  (data.value?.data ?? []).map((item) => ({
    label: `${item.kodeTransaksi} · ${item.tujuan}`,
    value: item.id,
  })),
);
const selectedPembiayaan = computed(() =>
  data.value?.data.find((item) => item.id === state.pembiayaanEksternalId),
);
const schema = computed(() => getAngsuranEksternalSchema(selectedPembiayaan.value));
const ready = computed(() => status.value === "success" && !!selectedPembiayaan.value);
const maxPayment = computed(() =>
  Math.min(selectedPembiayaan.value?.sisaPembiayaan ?? 0, maxExternalAmount),
);
watch(
  () => state.pembiayaanEksternalId,
  () => {
    state.jumlahPembayaran = undefined;
  },
  { flush: "sync" },
);
watch(
  [selectedPembiayaan, status],
  () => {
    if (status.value === "success" && !selectedPembiayaan.value)
      state.pembiayaanEksternalId = undefined;
  },
  { flush: "sync" },
);

async function onSubmit(event: FormSubmitEvent<TambahAngsuranEksternal>) {
  if (isLoading.value || !ready.value || !schema.value.safeParse(event.data).success) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/angsuran-eksternal", {
      baseURL: API_URL,
      credentials: "include",
      method: "POST",
      retry: 0,
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Menyimpan Angsuran",
      extractErrorMessage(error, "Angsuran gagal disimpan."),
    );
    await Promise.allSettled([refreshOptions()]);
    isLoading.value = false;
    return;
  }
  useToastSuccess("Angsuran Berhasil Dibukukan", "Pembayaran dan jurnal telah dicatat.");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Tambah Angsuran Eksternal"
    description="Langsung dibukukan dan tidak dapat diubah."
    :ui="{ content: 'sm:max-w-2xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-angsuran-eksternal"
        :schema="schema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Pembiayaan" name="pembiayaanEksternalId" required>
          <USelectMenu
            v-model="state.pembiayaanEksternalId"
            :items="options"
            value-key="value"
            placeholder="Pilih pembiayaan"
            :loading="status === 'pending'"
            :disabled="status !== 'success' || isLoading"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="error"
          title="Gagal Memuat Pembiayaan"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshOptions() }]"
        />
        <p v-else-if="status === 'success' && !options.length" class="text-sm text-muted">
          Tidak ada pembiayaan yang belum lunas.
        </p>
        <dl v-if="selectedPembiayaan" class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted">Sisa Pokok</dt>
            <dd class="mt-1 font-medium tabular-nums">
              {{ formatRupiah(selectedPembiayaan.sisaPokok) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">Sisa Margin</dt>
            <dd class="mt-1 font-medium tabular-nums">
              {{ formatRupiah(selectedPembiayaan.sisaMargin) }}
            </dd>
          </div>
        </dl>
        <UFormField label="Tanggal Pembayaran" name="tanggalTransaksi" required>
          <UInput
            v-model="state.tanggalTransaksi"
            type="date"
            min="0001-01-01"
            :max="today"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Total Pembayaran" name="jumlahPembayaran" required>
          <UInputNumber
            v-model="state.jumlahPembayaran"
            :min="1"
            :max="maxPayment"
            :step="1"
            :increment="false"
            :decrement="false"
            :disabled="!ready || isLoading"
            :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
            locale="id-ID"
            placeholder="Rp0"
            disable-wheel-change
            class="w-full"
          />
        </UFormField>
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea v-model="state.keterangan" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton color="neutral" variant="outline" :disabled="isLoading" @click="emit('close')"
          >Batal</UButton
        >
        <UButton
          type="submit"
          form="form-angsuran-eksternal"
          :loading="isLoading"
          :disabled="!ready || isLoading"
          >Simpan</UButton
        >
      </div>
    </template>
  </UModal>
</template>
