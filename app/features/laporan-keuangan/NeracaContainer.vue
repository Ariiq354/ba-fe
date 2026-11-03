<script setup lang="ts">
import type { BagianLaporan, NeracaResponse } from "./model";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";
import TabelLaporanKeuangan from "./components/TabelLaporanKeuangan.vue";
import { bulanLaporan } from "./model";

const tahun = ref(new Date().getFullYear());
const { data, status, error, refresh } = useApi<NeracaResponse>("/api/v1/jurnal/neraca", {
  query: { tahun },
});
const bulanTidakBalance = computed(() => {
  if (!data.value || status.value !== "success") return [];
  const { aktivaBulanan, pasivaBulanan } = data.value.ringkasan;
  return bulanLaporan
    .map((bulan, index) => ({
      bulan,
      selisih: (aktivaBulanan[index] ?? 0) - (pasivaBulanan[index] ?? 0),
    }))
    .filter((item) => item.selisih !== 0);
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
      <template v-else>
        <UAlert
          v-if="bulanTidakBalance.length"
          title="Neraca Tidak Balance"
          color="warning"
          variant="subtle"
          icon="i-tabler-alert-triangle"
          class="mb-4"
        >
          <template #description>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="item in bulanTidakBalance" :key="item.bulan">
                Ada tidak balance di bulan {{ item.bulan }} {{ tahun }} dengan jumlah
                {{ formatRupiah(item.selisih) }}.
              </li>
            </ul>
          </template>
        </UAlert>
        <TabelLaporanKeuangan
          title="Neraca"
          :tahun="tahun"
          :bagian="bagian"
          :loading="status === 'pending'"
        />
      </template>
    </UCard>
  </div>
</template>
