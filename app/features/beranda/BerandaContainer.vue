<script setup lang="ts">
import type { DashboardResponse } from "./model";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";

const { data, status, error, refresh } = useApi<DashboardResponse>("/api/v1/dashboard");
const loading = computed(() => !data.value && status.value === "pending");

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  timeZone: "Asia/Jakarta",
});
const monthYearFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const percentFormatter = new Intl.NumberFormat("id-ID", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

function formatBulan(value: string) {
  return monthFormatter.format(new Date(`${value}-01T00:00:00+07:00`));
}

function formatBulanTahun(value: string) {
  return monthYearFormatter.format(new Date(value));
}

const grafikSaham = computed(() =>
  (data.value?.grafikHargaSaham.data ?? []).map((row) => ({
    bulan: formatBulan(row.bulan),
    hargaJual: row.hargaJual,
  })),
);
const grafikLaba = computed(() =>
  (data.value?.grafikLabaBulanan ?? []).map((row) => ({
    bulan: formatBulan(row.bulan),
    laba: row.laba,
  })),
);
const adaHargaSaham = computed(() => grafikSaham.value.some((row) => row.hargaJual !== null));
const perubahan = computed(() => {
  const saham = data.value?.hargaSaham;
  if (saham?.perubahanNominal == null) return undefined;

  return {
    color:
      saham.perubahanNominal > 0
        ? ("success" as const)
        : saham.perubahanNominal < 0
          ? ("error" as const)
          : ("neutral" as const),
    icon:
      saham.perubahanNominal > 0
        ? "i-tabler-trending-up"
        : saham.perubahanNominal < 0
          ? "i-tabler-trending-down"
          : "i-tabler-minus",
    nominal: `${saham.perubahanNominal > 0 ? "+" : saham.perubahanNominal < 0 ? "−" : ""}${formatRupiah(Math.abs(saham.perubahanNominal))}`,
    persen:
      saham.perubahanPersen !== null
        ? percentFormatter.format(saham.perubahanPersen / 100)
        : undefined,
  };
});
</script>

<template>
  <div class="min-w-0 space-y-6" :aria-busy="status === 'pending'">
    <UAlert
      v-if="error"
      title="Gagal Memuat Beranda"
      description="Data koperasi belum dapat dimuat."
      color="error"
      variant="subtle"
      icon="i-tabler-alert-circle"
      :actions="[
        { label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() },
      ]"
    />

    <template v-else-if="loading">
      <div class="grid gap-6 sm:grid-cols-2" aria-label="Memuat ringkasan koperasi">
        <UCard v-for="item in 2" :key="item">
          <USkeleton class="h-4 w-36" />
          <USkeleton class="mt-4 h-9 w-48 max-w-full" />
        </UCard>
      </div>
      <UCard v-for="item in 2" :key="item">
        <USkeleton class="h-5 w-48" />
        <USkeleton class="mt-2 h-4 w-40" />
        <USkeleton class="mt-6 h-72 w-full" />
      </UCard>
    </template>

    <template v-else-if="data">
      <div class="grid gap-6 sm:grid-cols-2">
        <UCard class="min-w-0">
          <div class="flex items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-sm font-medium text-muted">Harga Jual Saham</h2>
              <UBadge
                v-if="perubahan"
                :color="perubahan.color"
                :icon="perubahan.icon"
                variant="subtle"
              >
                {{ perubahan.nominal
                }}<template v-if="perubahan.persen"> ({{ perubahan.persen }})</template>
              </UBadge>
            </div>
            <UIcon name="i-tabler-coins" class="size-5 shrink-0 text-primary" />
          </div>
          <p
            class="mt-3 text-2xl font-semibold break-words text-highlighted tabular-nums sm:text-3xl"
          >
            {{ data.hargaSaham.hargaJual !== null ? formatRupiah(data.hargaSaham.hargaJual) : "—" }}
          </p>
        </UCard>

        <UCard class="min-w-0">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-medium text-muted">
              Laba Berjalan · {{ data.labaBerjalan.periodeMulai.slice(0, 4) }}
            </h2>
            <UIcon name="i-tabler-chart-histogram" class="size-5 shrink-0 text-primary" />
          </div>
          <p
            class="mt-3 text-2xl font-semibold break-words tabular-nums sm:text-3xl"
            :class="data.labaBerjalan.total < 0 ? 'text-error' : 'text-highlighted'"
          >
            {{ formatRupiah(data.labaBerjalan.total) }}
          </p>
        </UCard>
      </div>

      <UCard class="min-w-0">
        <h2 class="font-semibold text-highlighted">Perkembangan Harga Saham</h2>
        <p class="mt-1 text-sm text-muted">
          {{ formatBulanTahun(data.grafikHargaSaham.periodeMulai) }} -
          {{ formatBulanTahun(data.grafikHargaSaham.periodeSelesai) }}
        </p>
        <div v-if="adaHargaSaham" class="mt-6 overflow-x-auto">
          <UChart
            class="min-w-160"
            :data="grafikSaham"
            index="bulan"
            :categories="[{ key: 'hargaJual', label: 'Harga jual saham', color: 'primary' }]"
            :format="formatRupiah"
            :height="300"
            points
            aria-label="Harga jual resmi saham per bulan selama 12 bulan terakhir"
          />
        </div>
        <div v-else class="flex h-75 items-center justify-center text-sm text-muted">
          Belum ada riwayat harga saham
        </div>
      </UCard>

      <UCard class="min-w-0">
        <h2 class="font-semibold text-highlighted">Laba Bulanan</h2>
        <p class="mt-1 text-sm text-muted">
          Tahun {{ data.labaBerjalan.periodeMulai.slice(0, 4) }}
        </p>
        <div v-if="grafikLaba.length" class="mt-6 overflow-x-auto">
          <UChart
            type="bar"
            class="min-w-160"
            :data="grafikLaba"
            index="bulan"
            :categories="[{ key: 'laba', label: 'Laba / rugi', color: 'primary' }]"
            :format="formatRupiah"
            :height="300"
            aria-label="Laba atau rugi koperasi per bulan pada tahun berjalan, bukan kumulatif"
          />
        </div>
        <div v-else class="flex h-75 items-center justify-center text-sm text-muted">
          Belum ada data laba bulanan
        </div>
      </UCard>
    </template>
  </div>
</template>
