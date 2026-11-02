<script setup lang="ts">
import type { BagianLaporan, NeracaResponse } from "./model";
import { useApi } from "~/composables/fetch";
import TabelLaporanKeuangan from "./components/TabelLaporanKeuangan.vue";

const tahun = ref(new Date().getFullYear());
const { data, status, error, refresh } = useApi<NeracaResponse>("/api/v1/jurnal/neraca", {
  query: { tahun },
});
const bagian = computed<BagianLaporan[]>(() => {
  if (!data.value) return [];
  const { data: akun, ringkasan } = data.value;
  return [
    {
      label: "Aktiva",
      akun: akun.filter((item) => item.kategori === "aktiva"),
      jumlahBulanan: ringkasan.aktivaBulanan,
      jumlah: ringkasan.totalAktiva,
    },
    {
      label: "Pasiva",
      akun: akun.filter((item) => item.kategori === "pasiva"),
      jumlahBulanan: ringkasan.pasivaBulanan,
      jumlah: ringkasan.totalPasiva,
    },
  ];
});

function updateTahun(value: number) {
  if (Number.isInteger(value) && value >= 1 && value <= 9999) tahun.value = value;
}
</script>

<template>
  <div class="min-w-0 space-y-6">
    <UFormField label="Tahun">
      <UInputNumber
        :model-value="tahun"
        :min="1"
        :max="9999"
        :step="1"
        :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
        aria-label="Tahun laporan Neraca"
        class="w-40"
        @update:model-value="updateTahun"
      />
    </UFormField>
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat Neraca"
        description="Data laporan belum dapat dimuat. Silakan coba lagi."
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        :actions="[
          { label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() },
        ]"
      />
      <TabelLaporanKeuangan
        v-else
        title="Neraca"
        :tahun="tahun"
        :bagian="bagian"
        :loading="status === 'pending'"
      />
    </UCard>
  </div>
</template>
