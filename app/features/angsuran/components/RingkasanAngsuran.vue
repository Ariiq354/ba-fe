<script setup lang="ts">
import type { PembiayaanOption } from "~/features/pembiayaan/model";
import { formatRupiah } from "~/utils/format";

const props = defineProps<{ ringkasan: PembiayaanOption }>();
const details = computed(() => [
  { label: "Total Tagihan", value: props.ringkasan.totalTagihan },
  { label: "Sisa Tagihan", value: props.ringkasan.sisaTagihan },
  { label: "Angsuran Bulanan", value: props.ringkasan.angsuranBulanan },
  { label: "Tunggakan Angsuran", value: props.ringkasan.sisaPembayaranBulanIni },
]);
</script>

<template>
  <div class="space-y-4 rounded-lg border border-default p-4">
    <h2 class="font-medium text-highlighted">Ringkasan Tagihan</h2>
    <dl class="grid gap-4 sm:grid-cols-2">
      <div v-for="detail in details" :key="detail.label">
        <dt class="text-sm text-muted">{{ detail.label }}</dt>
        <dd class="font-semibold tabular-nums">{{ formatRupiah(detail.value) }}</dd>
      </div>
    </dl>
  </div>
</template>
