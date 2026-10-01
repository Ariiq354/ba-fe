<script setup lang="ts">
import type { SaldoSimpanan } from "./model";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";
import { getSaldoSimpananKey } from "./keys";

const props = defineProps<{ userId: number }>();
const { data, status, error, refresh } = useApi<SaldoSimpanan>("/api/v1/simpanan/saldo", {
  key: computed(() => getSaldoSimpananKey(props.userId)),
  query: computed(() => ({ userId: props.userId })),
});
defineExpose({ refresh });
</script>

<template>
  <UAlert
    v-if="error"
    title="Saldo Belum Dapat Dimuat"
    description="Pastikan pengguna sudah menjadi anggota, lalu coba muat kembali."
    color="error"
    variant="subtle"
    :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
  />
  <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <UCard
      v-for="item in [
        { label: 'Saldo Tabungan', value: data ? formatRupiah(data.saldoTabungan) : '—', icon: 'i-tabler-wallet' },
        { label: 'Saldo Efektif', value: data ? formatRupiah(data.saldoEfektif) : '—', icon: 'i-tabler-cash-banknote' },
        { label: 'Tabungan Dicadangkan', value: data ? formatRupiah(data.totalPenarikanPending + data.totalPemindahbukuanPending) : '—', icon: 'i-tabler-clock' },
        { label: 'Jumlah Saham', value: data ? `${data.jumlahSaham.toLocaleString('id-ID')} lembar` : '—', icon: 'i-tabler-chart-candle' },
        { label: 'Saham Tersedia', value: data ? `${data.jumlahSahamEfektif.toLocaleString('id-ID')} lembar` : '—', icon: 'i-tabler-chart-pie' },
        { label: 'Saham Dicadangkan', value: data ? `${data.totalSahamPending.toLocaleString('id-ID')} lembar` : '—', icon: 'i-tabler-clock' },
      ]" :key="item.label"
    >
      <div class="flex items-center gap-2 text-muted">
        <UIcon :name="item.icon" class="size-5" />
        <p class="text-sm">
          {{ item.label }}
        </p>
      </div>
      <USkeleton v-if="status === 'pending'" class="mt-3 h-7 w-32" />
      <p v-else class="mt-3 text-xl font-semibold text-highlighted">
        {{ item.value }}
      </p>
    </UCard>
  </div>
</template>
