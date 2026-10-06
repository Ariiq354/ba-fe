<script setup lang="ts">
import type { Pemindahbukuan } from "../model";
import { openModal } from "~/composables/modal";
import ModalDetailJurnal from "~/features/jurnal/components/ModalDetailJurnal.vue";
import { formatSimpananDate, formatSimpananTimestamp, statusMutasiLabels } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { formatPemindahbukuanValue, tipePemindahbukuanLabels } from "../model";

const props = defineProps<{ transfer: Pemindahbukuan }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const canViewJurnal = computed(() => can(session.value.data?.user.role, "jurnal", "view"));
function viewJurnal() {
  if (canViewJurnal.value && props.transfer.jurnalId)
    openModal(ModalDetailJurnal, { id: props.transfer.jurnalId });
}
</script>

<template>
  <UModal title="Detail Pemindahbukuan" :description="transfer.kodeTransaksi" :ui="{ content: 'sm:max-w-2xl' }" :close="{ onClick: () => emit('close') }">
    <template #body>
      <div class="space-y-5">
        <UBadge :color="statusMutasiLabels[transfer.statusApproved].color" variant="subtle">
          {{ statusMutasiLabels[transfer.statusApproved].label }}
        </UBadge>
        <dl class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-muted">
              Anggota Sumber
            </dt><dd class="font-medium">
              {{ transfer.sourceMemberName }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Anggota Tujuan
            </dt><dd class="font-medium">
              {{ transfer.destinationMemberName }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Akun Sumber
            </dt><dd>{{ transfer.sourceAccountName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Akun Tujuan
            </dt><dd>{{ transfer.destinationAccountName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Jenis Pemindahbukuan
            </dt><dd>{{ tipePemindahbukuanLabels[transfer.tipePemindahbukuan] }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Tanggal Transaksi
            </dt><dd>{{ formatSimpananDate(transfer.tanggalTransaksi) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Nilai
            </dt><dd class="font-semibold">
              {{ formatPemindahbukuanValue(transfer) }}
            </dd>
          </div>
          <div v-if="transfer.tipePemindahbukuan !== 'tabungan_ke_tabungan'">
            <dt class="text-sm text-muted">
              {{ transfer.tipePemindahbukuan === 'saham_ke_saham' ? 'Nilai Referensi Saham' : 'Tabungan Digunakan' }}
            </dt><dd>{{ formatRupiah(transfer.nominal) }}</dd>
          </div>
          <template v-if="transfer.tipePemindahbukuan === 'tabungan_ke_saham'">
            <div>
              <dt class="text-sm text-muted">
                Harga Jual per Lembar saat Pengajuan
              </dt><dd>{{ formatRupiah(transfer.hargaPerSaham) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Harga Nominal per Lembar
              </dt><dd>{{ formatRupiah(transfer.hargaNominalPerSaham) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Agio Saham
              </dt><dd>{{ formatRupiah(transfer.agioSaham) }}</dd>
            </div>
          </template>
          <div>
            <dt class="text-sm text-muted">
              Diajukan Oleh
            </dt><dd>{{ transfer.creatorName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Diproses Oleh
            </dt><dd>{{ transfer.approverName || '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Waktu Pengajuan
            </dt><dd>{{ formatSimpananTimestamp(transfer.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Waktu Diproses
            </dt><dd>{{ transfer.approvedAt ? formatSimpananTimestamp(transfer.approvedAt) : '—' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-sm text-muted">
              Keterangan
            </dt><dd class="whitespace-pre-wrap wrap-break-word">
              {{ transfer.keterangan || '—' }}
            </dd>
          </div>
        </dl>
        <UAlert v-if="transfer.statusApproved === 'rejected'" title="Alasan Penolakan" :description="transfer.alasanPenolakan || '—'" color="error" variant="subtle" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton v-if="canViewJurnal && transfer.jurnalId" icon="i-tabler-receipt-2" color="neutral" variant="outline" @click="viewJurnal">
          Lihat Jurnal
        </UButton>
        <UButton color="neutral" variant="ghost" @click="emit('close')">
          Tutup
        </UButton>
      </div>
    </template>
  </UModal>
</template>
