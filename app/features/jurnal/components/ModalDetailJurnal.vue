<script setup lang="ts">
import type { Jurnal } from "../model";
import DataTable from "~/components/table/DataTable.vue";
import { formatRupiah } from "~/utils/format";
import { formatJurnalDate, getJurnalTotals, jurnalDetailColumns } from "../model";

const props = defineProps<{ jurnal: Jurnal }>();
const emit = defineEmits<{ close: [] }>();
const totals = computed(() => getJurnalTotals(props.jurnal.details));
const isBalanced = computed(() => totals.value.debit === totals.value.kredit);
const difference = computed(() => Math.abs(totals.value.debit - totals.value.kredit));
</script>

<template>
  <UModal
    title="Detail Jurnal"
    description="Informasi transaksi dan rincian pencatatan debit–kredit."
    :ui="{ content: 'sm:max-w-4xl', body: 'p-0 sm:p-0' }"
    :close="{ onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-6 p-4 sm:p-6">
        <section
          class="overflow-hidden rounded-xl border border-default"
          aria-label="Informasi transaksi"
        >
          <div
            class="flex flex-col gap-4 bg-muted/40 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5"
          >
            <div class="min-w-0">
              <p class="text-xs font-medium tracking-wider text-muted uppercase">Bukti jurnal</p>
              <p
                class="mt-1.5 font-mono text-lg font-semibold break-all text-highlighted sm:text-xl"
              >
                {{ jurnal.kodeTransaksi }}
              </p>
            </div>
            <div class="flex items-center gap-2 text-sm text-toned sm:pt-1">
              <UIcon name="i-tabler-calendar" class="size-4 shrink-0 text-muted" />
              <time :datetime="jurnal.tanggalTransaksi">{{
                formatJurnalDate(jurnal.tanggalTransaksi)
              }}</time>
            </div>
          </div>
          <div class="border-t border-default px-4 py-4 sm:px-5">
            <p class="text-xs font-medium text-muted">Keterangan</p>
            <p
              class="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-toned"
            >
              {{ jurnal.keterangan || "Tidak ada keterangan." }}
            </p>
          </div>
        </section>

        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div class="border-l-2 border-primary pl-4">
            <dt class="text-sm text-muted">Total Debit</dt>
            <dd class="mt-1 text-2xl font-semibold tracking-tight text-highlighted tabular-nums">
              {{ formatRupiah(totals.debit) }}
            </dd>
          </div>
          <div class="border-l-2 border-accented pl-4">
            <dt class="text-sm text-muted">Total Kredit</dt>
            <dd class="mt-1 text-2xl font-semibold tracking-tight text-highlighted tabular-nums">
              {{ formatRupiah(totals.kredit) }}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="jurnal-detail-heading" class="space-y-3">
          <h3 id="jurnal-detail-heading" class="text-sm font-semibold text-highlighted">
            Rincian Pencatatan
          </h3>
          <DataTable :data="jurnal.details" :columns="jurnalDetailColumns">
            <template #kodeAkun-cell="{ row }">
              <span class="rounded-md bg-muted px-2 py-1 font-mono text-xs text-toned">{{
                row.original.kodeAkun
              }}</span>
            </template>
            <template #namaAkun-cell="{ row }">
              <span class="font-medium">{{ row.original.namaAkun }}</span>
            </template>
            <template #userName-cell="{ row }">
              <span class="text-muted">{{ row.original.userName || "—" }}</span>
            </template>
            <template #debit-header><span class="block text-right">Debit</span></template>
            <template #kredit-header><span class="block text-right">Kredit</span></template>
            <template #debit-cell="{ row }">
              <span
                class="block text-right tabular-nums"
                :class="row.original.debit ? 'font-medium' : 'text-dimmed'"
              >
                {{ row.original.debit ? formatRupiah(row.original.debit) : "—" }}
              </span>
            </template>
            <template #kredit-cell="{ row }">
              <span
                class="block text-right tabular-nums"
                :class="row.original.kredit ? 'font-medium' : 'text-dimmed'"
              >
                {{ row.original.kredit ? formatRupiah(row.original.kredit) : "—" }}
              </span>
            </template>
          </DataTable>
          <p v-if="!isBalanced" class="text-right text-sm text-warning">
            Selisih debit dan kredit:
            <span class="font-medium tabular-nums">{{ formatRupiah(difference) }}</span>
          </p>
        </section>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="outline" @click="emit('close')"> Tutup </UButton>
      </div>
    </template>
  </UModal>
</template>
