<script setup lang="ts">
import type { BagianLaporan, RingkasanLaporan } from "../model";
import { formatRupiah } from "~/utils/format";
import { bulanLaporan } from "../model";

const { bagian, ringkasan } = defineProps<{
  title: string;
  tahun: number;
  bagian: BagianLaporan[];
  ringkasan?: RingkasanLaporan;
  loading?: boolean;
}>();
const hasAccounts = computed(() => bagian.some((item) => item.akun.length > 0));
const summaryColor = computed(() =>
  ringkasan && ringkasan.jumlah < 0
    ? "bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100"
    : "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100",
);
const columnCount = bulanLaporan.length + 2;
</script>

<template>
  <div
    class="overflow-x-auto rounded-lg border border-accented"
    role="region"
    :aria-label="`Tabel ${title} tahun ${tahun}`"
    tabindex="0"
  >
    <table class="w-full text-sm" :aria-busy="loading">
      <caption class="sr-only">
        {{
          title
        }}
        tahun
        {{
          tahun
        }}. Nominal dalam rupiah. Angka bulanan merupakan mutasi bersih, bukan saldo kumulatif.
      </caption>
      <thead>
        <tr class="border-b border-accented">
          <th
            scope="col"
            class="sticky left-0 z-10 min-w-56 bg-default px-4 py-3 text-left font-medium text-muted"
          >
            Nama Akun
          </th>
          <th
            v-for="bulan in bulanLaporan"
            :key="bulan"
            scope="col"
            class="min-w-36 px-4 py-3 text-right font-medium text-muted"
          >
            {{ bulan }}
          </th>
          <th scope="col" class="min-w-40 px-4 py-3 text-right font-semibold text-highlighted">
            Total
          </th>
        </tr>
      </thead>
      <tbody v-if="loading">
        <tr>
          <td :colspan="columnCount" class="px-4 py-10 text-muted" role="status">
            <span class="sticky left-4 inline-flex items-center gap-2">
              <UIcon name="i-tabler-loader-2" class="size-4 animate-spin" />
              Memuat laporan...
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="!hasAccounts">
        <tr>
          <td :colspan="columnCount" class="px-4 py-10 text-muted">
            <span class="sticky left-4 inline-block">
              Belum ada data {{ title.toLowerCase() }} untuk tahun {{ tahun }}.
            </span>
          </td>
        </tr>
      </tbody>
      <template v-else>
        <tbody v-for="item in bagian" :key="item.label" class="border-b border-accented">
          <tr class="bg-elevated">
            <th
              scope="rowgroup"
              class="sticky left-0 z-10 bg-elevated px-4 py-3 text-left font-semibold text-highlighted"
            >
              {{ item.label }}
            </th>
            <td :colspan="columnCount - 1" />
          </tr>
          <tr v-for="akun in item.akun" :key="akun.id" class="border-b border-muted">
            <th
              scope="row"
              class="sticky left-0 z-10 bg-default px-4 py-3 text-left font-normal text-highlighted"
            >
              {{ akun.namaAkun }}
            </th>
            <td
              v-for="(_, index) in bulanLaporan"
              :key="index"
              class="whitespace-nowrap px-4 py-3 text-right tabular-nums text-highlighted"
            >
              {{ formatRupiah(akun.jumlahBulanan[index] ?? 0) }}
            </td>
            <td
              class="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-highlighted"
            >
              {{ formatRupiah(akun.jumlah) }}
            </td>
          </tr>
          <tr class="bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <th
              scope="row"
              class="sticky left-0 z-10 bg-blue-50 px-4 py-3 text-left dark:bg-blue-950"
            >
              Total {{ item.label }}
            </th>
            <td
              v-for="(_, index) in bulanLaporan"
              :key="index"
              class="whitespace-nowrap px-4 py-3 text-right tabular-nums"
            >
              {{ formatRupiah(item.jumlahBulanan[index] ?? 0) }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
              {{ formatRupiah(item.jumlah) }}
            </td>
          </tr>
        </tbody>
      </template>
      <tfoot v-if="!loading && hasAccounts && ringkasan">
        <tr class="font-bold" :class="summaryColor">
          <th scope="row" class="sticky left-0 z-10 px-4 py-3 text-left" :class="summaryColor">
            {{ ringkasan.label }}
          </th>
          <td
            v-for="(_, index) in bulanLaporan"
            :key="index"
            class="whitespace-nowrap px-4 py-3 text-right tabular-nums"
          >
            {{ formatRupiah(ringkasan.jumlahBulanan[index] ?? 0) }}
          </td>
          <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
            {{ formatRupiah(ringkasan.jumlah) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
