<script setup lang="ts">
import type { ReferensiShu } from "~/features/shu/model";
import type { MonitoringShu } from "./model";
import SelectKelompok from "~/components/select/SelectKelompok.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import ModalGenerateShu from "~/features/shu/components/ModalGenerateShu.vue";
import ModalPengalihanShu from "~/features/shu/components/ModalPengalihanShu.vue";
import { monitoringShuColumns } from "./model";

const tahun = ref(new Date().getFullYear());
const idKelompok = ref<number>();
const { data, status, error, refresh } = useApi<{ data: MonitoringShu[] }>(
  "/api/v1/shu/monitoring",
  {
    query: { tahun, idKelompok },
  },
);
const {
  data: referensi,
  status: referensiStatus,
  error: referensiError,
  refresh: refreshReferensi,
} = useApi<ReferensiShu>("/api/v1/shu/referensi", {
  query: { tahun },
});
const currentReferensi = computed(() =>
  referensiStatus.value === "success" && referensi.value?.tahun === tahun.value
    ? referensi.value
    : undefined,
);
const canGenerate = computed(
  () =>
    !!currentReferensi.value &&
    !currentReferensi.value.sudahDibagikan &&
    currentReferensi.value.batasShu > 0,
);
const canTransfer = computed(
  () => !!currentReferensi.value?.sudahDibagikan && !currentReferensi.value.sudahDialihkan,
);

function updateTahun(value: number) {
  if (Number.isInteger(value) && value >= 1 && value <= 9999) tahun.value = value;
}

async function refreshAfterChange() {
  await Promise.all([refresh(), refreshReferensi()]);
}

function generateShu() {
  if (!canGenerate.value || !currentReferensi.value) return;
  openModal(ModalGenerateShu, { referensi: currentReferensi.value, refresh: refreshAfterChange });
}

function transferShu() {
  if (!canTransfer.value || !currentReferensi.value) return;
  openModal(ModalPengalihanShu, { referensi: currentReferensi.value, refresh: refreshAfterChange });
}
</script>

<template>
  <div class="min-w-0 space-y-6">
    <h1 class="text-2xl font-semibold text-highlighted">Monitoring SHU</h1>
    <div class="flex flex-wrap items-end gap-3">
      <UFormField label="Tahun">
        <UInputNumber
          :model-value="tahun"
          :min="1"
          :max="9999"
          :step="1"
          :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
          aria-label="Filter tahun monitoring SHU"
          class="w-40"
          @update:model-value="updateTahun"
        />
      </UFormField>
      <UFormField label="Kelompok" class="w-full sm:max-w-xs">
        <SelectKelompok v-model="idKelompok" aria-label="Filter kelompok SHU" class="w-full" />
      </UFormField>
      <UButton
        v-if="idKelompok !== undefined"
        color="neutral"
        variant="outline"
        icon="i-tabler-x"
        @click="idKelompok = undefined"
      >
        Semua Kelompok
      </UButton>
    </div>
    <div class="flex flex-wrap gap-3">
      <UButton icon="i-tabler-calculator" :disabled="!canGenerate" @click="generateShu">
        Generate SHU
      </UButton>
      <UButton icon="i-tabler-wallet" :disabled="!canTransfer" @click="transferShu">
        Alihkan ke Tabungan
      </UButton>
    </div>
    <UAlert
      v-if="referensiError"
      title="Gagal Memuat Referensi SHU"
      color="error"
      variant="subtle"
      :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshReferensi() }]"
    />
    <UCard class="min-w-0">
      <UAlert
        v-if="error"
        title="Gagal Memuat Monitoring SHU"
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refresh() }]"
      />
      <DataTable
        v-else
        :data="status === 'success' ? (data?.data ?? []) : []"
        :columns="monitoringShuColumns"
        :loading="status === 'pending'"
        enumerate
      >
        <template #empty>
          <p class="py-8 text-center text-muted">Belum ada data SHU.</p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
