<script setup lang="ts">
import type { Jurnal } from "../model";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";
import { formatJurnalDate, getJurnalTotals, jurnalDetailColumns } from "../model";

const props = defineProps<{ id: number }>();
const emit = defineEmits<{ close: [] }>();
const { data, status, error, refresh } = useApi<Jurnal>(() => `/api/v1/jurnal/${props.id}`);
const totals = computed(() => getJurnalTotals(data.value?.details ?? []));
</script>

<template>
  <UModal title="Detail Jurnal" description="Informasi transaksi dan rincian pencatatan debit–kredit." :ui="{ content: 'sm:max-w-4xl' }" :close="{ onClick: () => emit('close') }">
    <template #body>
      <UAlert
        v-if="error"
        title="Gagal Memuat Detail Jurnal"
        description="Jurnal tidak ditemukan atau belum dapat dimuat. Silakan coba lagi."
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />
      <div v-else class="space-y-5">
        <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted" role="status">
          <UIcon name="i-tabler-loader-2" class="animate-spin" /> Memuat detail jurnal...
        </div>
        <template v-else-if="data">
          <dl class="grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">
                Kode Transaksi
              </dt><dd class="font-mono font-medium">
                {{ data.kodeTransaksi }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Tanggal Transaksi
              </dt><dd>{{ formatJurnalDate(data.tanggalTransaksi) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Keterangan
              </dt><dd class="whitespace-pre-wrap wrap-break-word">
                {{ data.keterangan || '—' }}
              </dd>
            </div>
          </dl>
          <DataTable :data="data.details" :columns="jurnalDetailColumns" />
          <div class="grid gap-3 rounded-lg bg-elevated p-4 sm:grid-cols-2">
            <p><span class="text-sm text-muted">Total Debit</span><br><strong>{{ formatRupiah(totals.debit) }}</strong></p>
            <p><span class="text-sm text-muted">Total Kredit</span><br><strong>{{ formatRupiah(totals.kredit) }}</strong></p>
          </div>
        </template>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="outline" @click="emit('close')">
          Tutup
        </UButton>
      </div>
    </template>
  </UModal>
</template>
