<script setup lang="ts">
import type { Pembiayaan } from "../model";
import AlasanPenolakan from "~/components/modal/AlasanPenolakan.vue";
import { formatSimpananDate, formatSimpananTimestamp } from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";

const props = defineProps<{ pembiayaan: Pembiayaan }>();
const emit = defineEmits<{ close: [] }>();
const details = computed(() => {
  const item = props.pembiayaan;
  return [
    { label: "Anggota", value: item.memberName },
    { label: "Tanggal Pembiayaan", value: formatSimpananDate(item.tanggalPembiayaan) },
    { label: "Jumlah Pokok", value: formatRupiah(item.jumlahPokok) },
    { label: "Jangka Waktu", value: `${item.jangkaWaktuBulan} bulan` },
    {
      label: "Margin per Tahun",
      value: `${item.persenMarginTahun.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`,
    },
    { label: "Jumlah Margin", value: formatRupiah(item.jumlahMargin) },
    { label: "Total Pokok + Margin", value: formatRupiah(item.totalPembiayaan) },
    { label: "Biaya Akad (Terpisah)", value: formatRupiah(item.biayaAkad) },
    { label: "Metode Pencairan", value: item.metodePembayaran },
    { label: "Diajukan Oleh", value: item.creatorName },
    { label: "Diproses Oleh", value: item.approverName || "—" },
    { label: "Waktu Pengajuan", value: formatSimpananTimestamp(item.createdAt) },
    {
      label: "Waktu Diproses",
      value: item.approvedAt ? formatSimpananTimestamp(item.approvedAt) : "—",
    },
  ];
});
</script>

<template>
  <UModal
    title="Detail Pembiayaan"
    :description="pembiayaan.kodeTransaksi"
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
            <dt class="text-sm text-muted">Tujuan Pembiayaan</dt>
            <dd class="whitespace-pre-wrap wrap-break-word">{{ pembiayaan.tujuan }}</dd>
          </div>
        </dl>
        <AlasanPenolakan
          v-if="pembiayaan.statusApproved === 'rejected'"
          :reason="pembiayaan.alasanPenolakan || '—'"
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
