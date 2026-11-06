import type { TableColumn } from "@nuxt/ui";
import { formatSimpananDate } from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";

export interface MonitoringSimpanan {
  nama: string;
  noAnggota: string | null;
  namaKelompok: string;
  saldoTabungan: number;
  jumlahSaham: number;
  persentaseKepemilikanSaham: number;
}

export interface MonitoringPembiayaan {
  kodeTransaksi: string;
  memberName: string;
  jumlahPokok: number;
  jumlahMargin: number;
  biayaAkad: number;
  totalPembiayaan: number;
  tujuan: string;
  jangkaWaktuBulan: number;
  sisaPembiayaan: number;
  tanggalAkhirAngsuran: string | null;
}

export interface MonitoringShu {
  nama: string;
  noAnggota: string | null;
  jumlahShuSaham: number;
  jumlahShuTabungan: number;
  totalShu: number;
}

const numberFormatter = new Intl.NumberFormat("id-ID");
const percentFormatter = new Intl.NumberFormat("id-ID", {
  style: "percent",
  maximumFractionDigits: 2,
});

function totalFooter<T>(format: (value: number) => string): TableColumn<T>["footer"] {
  return ({ table, column }) =>
    format(
      table
        .getFilteredRowModel()
        .rows.reduce((total, row) => total + row.getValue<number>(column.id), 0),
    );
}

export const monitoringSimpananColumns: TableColumn<MonitoringSimpanan>[] = [
  {
    accessorKey: "noAnggota",
    header: "No. Anggota",
    cell: ({ row }) => row.original.noAnggota || "—",
    footer: "Total",
  },
  { accessorKey: "nama", header: "Anggota" },
  { accessorKey: "namaKelompok", header: "Kelompok" },
  {
    accessorKey: "saldoTabungan",
    header: "Saldo Tabungan",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.saldoTabungan),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "jumlahSaham",
    header: "Jumlah Saham",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => numberFormatter.format(row.original.jumlahSaham),
    footer: totalFooter((value) => numberFormatter.format(value)),
  },
  {
    accessorKey: "persentaseKepemilikanSaham",
    header: "Kepemilikan Saham",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => percentFormatter.format(row.original.persentaseKepemilikanSaham / 100),
    footer: totalFooter((value) => percentFormatter.format(value / 100)),
  },
];

export const monitoringPembiayaanColumns: TableColumn<MonitoringPembiayaan>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi", footer: "Total" },
  { accessorKey: "memberName", header: "Anggota" },
  { accessorKey: "tujuan", header: "Tujuan" },
  {
    accessorKey: "jumlahPokok",
    header: "Pokok",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahPokok),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "jumlahMargin",
    header: "Margin",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahMargin),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "biayaAkad",
    header: "Biaya Akad",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.biayaAkad),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "totalPembiayaan",
    header: "Total Pokok + Margin",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.totalPembiayaan),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "sisaPembiayaan",
    header: "Sisa Pembiayaan",
    meta: { class: { th: "text-right", td: "text-right tabular-nums font-semibold" } },
    cell: ({ row }) => formatRupiah(row.original.sisaPembiayaan),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "jangkaWaktuBulan",
    header: "Tempo",
    cell: ({ row }) => `${row.original.jangkaWaktuBulan} bulan`,
  },
  {
    accessorKey: "tanggalAkhirAngsuran",
    header: "Akhir Angsuran",
    cell: ({ row }) =>
      row.original.tanggalAkhirAngsuran
        ? formatSimpananDate(row.original.tanggalAkhirAngsuran)
        : "—",
  },
];

export const monitoringShuColumns: TableColumn<MonitoringShu>[] = [
  {
    accessorKey: "noAnggota",
    header: "No. Anggota",
    cell: ({ row }) => row.original.noAnggota || "—",
    footer: "Total",
  },
  { accessorKey: "nama", header: "Anggota" },
  {
    accessorKey: "jumlahShuSaham",
    header: "SHU Saham",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahShuSaham),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "jumlahShuTabungan",
    header: "SHU Tabungan",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahShuTabungan),
    footer: totalFooter(formatRupiah),
  },
  {
    accessorKey: "totalShu",
    header: "Total SHU",
    meta: { class: { th: "text-right", td: "text-right tabular-nums font-semibold" } },
    cell: ({ row }) => formatRupiah(row.original.totalShu),
    footer: totalFooter(formatRupiah),
  },
];
