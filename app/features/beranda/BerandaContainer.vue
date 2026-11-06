<script setup lang="ts">
import type { DashboardResponse } from "./model";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";

const { data, status, error, refresh } = useApi<DashboardResponse>("/api/v1/dashboard");
const loading = computed(() => !data.value && status.value === "pending");

const percentFormatter = new Intl.NumberFormat("id-ID", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const grafikPembiayaan = computed(() =>
  (data.value?.grafikPembiayaanTahunan.data ?? []).map((row) => ({
    tahun: String(row.tahun),
    total: row.total,
  })),
);
const grafikLaba = computed(() =>
  (data.value?.grafikLabaTahunan ?? []).map((row) => ({
    tahun: String(row.tahun),
    laba: row.laba,
  })),
);
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
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-label="Memuat ringkasan koperasi">
        <UCard v-for="item in 3" :key="item">
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
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

        <UCard class="min-w-0">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-medium text-muted">
              Pembiayaan Berjalan · {{ data.pembiayaanBerjalan.periodeMulai.slice(0, 4) }}
            </h2>
            <UIcon name="i-tabler-cash" class="size-5 shrink-0 text-primary" />
          </div>
          <p
            class="mt-3 text-2xl font-semibold break-words text-highlighted tabular-nums sm:text-3xl"
          >
            {{ formatRupiah(data.pembiayaanBerjalan.total) }}
          </p>
        </UCard>

        <UCard class="min-w-0">
          <div class="flex items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-sm font-medium text-muted">Nilai Saham Saat Ini</h2>
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
      </div>

      <UCard class="min-w-0">
        <h2 class="font-semibold text-highlighted">Laba Tahunan</h2>
        <p class="mt-1 text-sm text-muted">
          {{ data.grafikPembiayaanTahunan.periodeMulai.slice(0, 4) }} -
          {{ data.grafikPembiayaanTahunan.periodeSelesai.slice(0, 4) }}
        </p>
        <div v-if="grafikLaba.length" class="mt-6 overflow-x-auto">
          <UChart
            type="bar"
            class="min-w-160"
            :data="grafikLaba"
            index="tahun"
            :categories="[{ key: 'laba', label: 'Laba / rugi', color: 'primary' }]"
            :format="formatRupiah"
            :height="300"
            aria-label="Laba atau rugi koperasi per tahun, bukan kumulatif"
          />
        </div>
        <div v-else class="flex h-75 items-center justify-center text-sm text-muted">
          Belum ada data laba tahunan
        </div>
      </UCard>

      <UCard class="min-w-0">
        <h2 class="font-semibold text-highlighted">Pembiayaan Tahunan</h2>
        <p class="mt-1 text-sm text-muted">
          {{ data.grafikPembiayaanTahunan.periodeMulai.slice(0, 4) }} -
          {{ data.grafikPembiayaanTahunan.periodeSelesai.slice(0, 4) }}
        </p>
        <div v-if="grafikPembiayaan.length" class="mt-6 overflow-x-auto">
          <UChart
            type="bar"
            class="min-w-160"
            :data="grafikPembiayaan"
            index="tahun"
            :categories="[{ key: 'total', label: 'Pembiayaan', color: 'primary' }]"
            :format="formatRupiah"
            :height="300"
            aria-label="Total pembiayaan approved per tahun, pokok dan margin, bukan kumulatif"
          />
        </div>
        <div v-else class="flex h-75 items-center justify-center text-sm text-muted">
          Belum ada data pembiayaan tahunan
        </div>
      </UCard>
    </template>
  </div>
</template>
