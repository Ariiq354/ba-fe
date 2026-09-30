<script setup lang="ts">
import type { MutasiSimpanan } from "./model";
import { openModal } from "~/composables/modal";
import ModalDetailJurnal from "~/features/jurnal/ModalDetailJurnal.vue";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { formatSimpananDate, formatSimpananTimestamp, statusMutasiLabels } from "./model";

const props = defineProps<{ mutasi: MutasiSimpanan }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const canViewJurnal = computed(() => can(session.value.data?.user.role, "jurnal", "view"));

function viewJurnal() {
  if (!canViewJurnal.value || !props.mutasi.jurnalId)
    return;
  openModal(ModalDetailJurnal, { id: props.mutasi.jurnalId });
}
</script>

<template>
  <UModal title="Detail Mutasi Simpanan" :description="mutasi.kodeTransaksi" :ui="{ content: 'sm:max-w-2xl' }" :close="{ onClick: () => emit('close') }">
    <template #body>
      <div class="space-y-5">
        <UBadge :color="statusMutasiLabels[mutasi.statusApproved].color" variant="subtle">
          {{ statusMutasiLabels[mutasi.statusApproved].label }}
        </UBadge>
        <dl class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-muted">
              Anggota
            </dt><dd class="font-medium">
              {{ mutasi.memberName }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Tanggal Transaksi
            </dt><dd>{{ formatSimpananDate(mutasi.tanggalTransaksi) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Jenis Transaksi
            </dt><dd class="capitalize">
              {{ mutasi.jenisTransaksi }} {{ mutasi.jenisSimpanan }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Kas / Bank
            </dt><dd>{{ mutasi.accountName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Nominal
            </dt><dd class="font-semibold">
              {{ formatRupiah(mutasi.nilaiTransaksi) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Diinput Oleh
            </dt><dd>{{ mutasi.creatorName }}</dd>
          </div>
          <template v-if="mutasi.jenisSimpanan === 'saham'">
            <div>
              <dt class="text-sm text-muted">
                Jumlah Saham
              </dt><dd>{{ mutasi.jumlahSaham.toLocaleString('id-ID') }} lembar</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Harga per Saham
              </dt><dd>{{ formatRupiah(mutasi.hargaPerSaham) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Harga Nominal per Saham
              </dt><dd>{{ formatRupiah(mutasi.hargaNominalPerSaham) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Agio Saham
              </dt><dd>{{ formatRupiah(mutasi.agioSaham) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Jumlah Saham Setelah Transaksi
              </dt><dd>{{ mutasi.jumlahSahamSetelahTransaksi === null ? '—' : `${mutasi.jumlahSahamSetelahTransaksi.toLocaleString('id-ID')} lembar` }}</dd>
            </div>
          </template>
          <div v-else>
            <dt class="text-sm text-muted">
              Saldo Setelah Transaksi
            </dt><dd>{{ mutasi.saldoSetelahTransaksi === null ? '—' : formatRupiah(mutasi.saldoSetelahTransaksi) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Diproses Oleh
            </dt><dd>{{ mutasi.approverName || '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Waktu Pengajuan
            </dt><dd>{{ formatSimpananTimestamp(mutasi.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Waktu Diproses
            </dt><dd>{{ mutasi.approvedAt ? formatSimpananTimestamp(mutasi.approvedAt) : '—' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-sm text-muted">
              Keterangan
            </dt><dd class="whitespace-pre-wrap wrap-break-word">
              {{ mutasi.keterangan || '—' }}
            </dd>
          </div>
        </dl>
        <UAlert v-if="mutasi.statusApproved === 'rejected'" title="Alasan Penolakan" :description="mutasi.alasanPenolakan || '—'" color="error" variant="subtle" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton v-if="canViewJurnal && mutasi.jurnalId" icon="i-tabler-receipt-2" color="neutral" variant="outline" @click="viewJurnal">
          Lihat Jurnal
        </UButton>
        <UButton color="neutral" variant="ghost" @click="emit('close')">
          Tutup
        </UButton>
      </div>
    </template>
  </UModal>
</template>
