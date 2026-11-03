<script setup lang="ts">
import type { Angsuran } from "../model";
import AlasanPenolakan from "~/components/modal/AlasanPenolakan.vue";
import {
  formatSimpananDate,
  formatSimpananTimestamp,
  statusMutasiLabels,
} from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";

const props = defineProps<{ angsuran: Angsuran }>();
const emit = defineEmits<{ close: [] }>();
const details = computed(() => {
  const item = props.angsuran;
  return [
    { label: "Anggota", value: item.memberName },
    { label: "Pembiayaan", value: item.kodePembiayaan },
    { label: "Tanggal", value: formatSimpananDate(item.tanggalTransaksi) },
    { label: "Status", value: statusMutasiLabels[item.statusApproved].label },
    { label: "Nominal Pembayaran", value: formatRupiah(item.jumlahPembayaran) },
    { label: "Metode Pembayaran", value: item.metodePembayaran },
    { label: "Diajukan Oleh", value: item.creatorName },
    { label: "Waktu Pengajuan", value: formatSimpananTimestamp(item.createdAt) },
    { label: "Diproses Oleh", value: item.approverName || "—" },
    {
      label: "Waktu Diproses",
      value: item.approvedAt ? formatSimpananTimestamp(item.approvedAt) : "—",
    },
  ];
});
</script>

<template>
  <UModal
    title="Detail Angsuran"
    :description="angsuran.kodeTransaksi"
    :ui="{ content: 'sm:max-w-2xl' }"
    :close="{ onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-5">
        <dl class="grid gap-4 sm:grid-cols-2">
          <div v-for="detail in details" :key="detail.label">
            <dt class="text-sm text-muted">{{ detail.label }}</dt>
            <dd class="font-medium">{{ detail.value }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-sm text-muted">Keterangan</dt>
            <dd class="whitespace-pre-wrap wrap-break-word">{{ angsuran.keterangan || "—" }}</dd>
          </div>
        </dl>
        <AlasanPenolakan
          v-if="angsuran.statusApproved === 'rejected'"
          :reason="angsuran.alasanPenolakan || '—'"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="ghost" @click="emit('close')">Tutup</UButton>
      </div>
    </template>
  </UModal>
</template>
