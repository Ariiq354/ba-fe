<script setup lang="ts">
import type { SaldoSimpanan } from "../model";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";
import { getSaldoSimpananKey } from "../data";

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
    :actions="[
      { label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() },
    ]"
  />
  <dl
    v-else
    class="grid divide-y divide-default rounded-lg border border-default bg-default sm:grid-cols-2 sm:divide-x sm:divide-y-0"
    aria-label="Ringkasan simpanan"
  >
    <div class="p-5">
      <dt class="text-sm text-muted">Saldo tabungan</dt>
      <dd class="mt-2">
        <USkeleton v-if="status === 'pending'" class="h-8 w-44" />
        <span v-else class="text-2xl font-semibold tracking-tight text-highlighted tabular-nums">
          {{ data ? formatRupiah(data.saldoTabungan) : "—" }}
        </span>
      </dd>
    </div>
    <div class="p-5">
      <dt class="text-sm text-muted">Kepemilikan saham</dt>
      <dd class="mt-2">
        <USkeleton v-if="status === 'pending'" class="h-8 w-32" />
        <template v-else>
          <span class="text-2xl font-semibold tracking-tight text-highlighted tabular-nums">
            {{ data ? data.jumlahSaham.toLocaleString("id-ID") : "—" }}
          </span>
          <span class="ml-1.5 text-sm text-muted">lembar</span>
        </template>
      </dd>
    </div>
  </dl>
</template>
