<script setup lang="ts">
import type { BagianLaporan, LabaRugiResponse, RingkasanLaporan } from "./model";
import { useApi } from "~/composables/fetch";
import TabelLaporanKeuangan from "./components/TabelLaporanKeuangan.vue";

const tahun = ref(new Date().getFullYear());
const { data, status, error, refresh } = useApi<LabaRugiResponse>("/api/v1/jurnal/laba-rugi", {
  query: { tahun },
});
const bagian = computed<BagianLaporan[]>(() => {
  if (!data.value) return [];
  const { data: akun, ringkasan } = data.value;
  return [
    {
      label: "Pendapatan",
      akun: akun.filter((item) => item.kategori === "pendapatan"),
      jumlahBulanan: ringkasan.pendapatanBulanan,
      jumlah: ringkasan.totalPendapatan,
    },
    {
      label: "Biaya",
      akun: akun.filter((item) => item.kategori === "biaya"),
      jumlahBulanan: ringkasan.biayaBulanan,
      jumlah: ringkasan.totalBiaya,
    },
  ];
});
const labaRugi = computed<RingkasanLaporan | undefined>(() => {
  if (!data.value) return undefined;
  const { ringkasan } = data.value;
  return {
    label: "Laba / Rugi",
    jumlahBulanan: ringkasan.labaRugiBulanan,
    jumlah: ringkasan.totalLabaRugi,
  };
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
        aria-label="Tahun laporan Laba Rugi"
        class="w-40"
        @update:model-value="updateTahun"
      />
    </UFormField>
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat Laba Rugi"
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
        title="Laba Rugi"
        :tahun="tahun"
        :bagian="bagian"
        :ringkasan="labaRugi"
        :loading="status === 'pending'"
      />
    </UCard>
  </div>
</template>
