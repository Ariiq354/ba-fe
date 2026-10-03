import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatRupiah } from "~/utils/format";

export const maxSimpananAmount = 2147483647;
function positiveIntegerSchema(message: string) {
  return z.number(message).int("Harus berupa bilangan bulat").min(1, "Nilai minimal 1").max(maxSimpananAmount, "Nilai maksimal 2.147.483.647");
}
const positiveInteger = positiveIntegerSchema("Pilih anggota");
const paymentAccountSchema = z.number().optional().pipe(positiveIntegerSchema("Pilih kas atau bank"));
const amountSchema = z.number().optional().pipe(positiveIntegerSchema("Nominal wajib diisi"));
const commonFields = {
  userId: positiveInteger,
  akunId: paymentAccountSchema,
  keterangan: z.string().trim(),
};

export const setoranTabunganSchema = z.object({
  ...commonFields,
  jenisSimpanan: z.literal("tabungan"),
  nilaiTransaksi: amountSchema,
});
export const setoranSahamSchema = z.object({
  ...commonFields,
  jenisSimpanan: z.literal("saham"),
  jumlahSaham: amountSchema,
});
export const penarikanSchema = z.object({ ...commonFields, nilaiTransaksi: amountSchema });
export const rejectMutasiSchema = z.object({
  alasanPenolakan: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});

export type PengajuanSimpanan = z.output<typeof setoranTabunganSchema> | z.output<typeof setoranSahamSchema> | z.output<typeof penarikanSchema>;
export type RejectMutasiSchema = z.output<typeof rejectMutasiSchema>;
export type JenisPengajuan = "tabungan" | "saham" | "penarikan";
export type StatusMutasi = "pending" | "approved" | "rejected";
export type MutasiScope = "personal" | "members";

export interface SaldoSimpanan {
  saldoTabungan: number;
  jumlahSaham: number;
  totalPenarikanPending: number;
  totalPemindahbukuanPending: number;
  totalSahamPending: number;
  saldoEfektif: number;
  jumlahSahamEfektif: number;
}

export interface AnggotaSimpanan {
  id: number;
  name: string;
  noAnggota: string | null;
  idKelompok: number;
  namaKelompok: string;
}
export interface AnggotaOptionsResponse { data: AnggotaSimpanan[] }
export interface PaymentAccountsResponse { data: { id: number; kodeAkun: string; namaAkun: string }[] }
export interface HargaSaham { hargaJual: number; hargaNominal: number }

export function getPengajuanSchema(jenis: JenisPengajuan, price?: HargaSaham | null, balance?: SaldoSimpanan | null) {
  if (jenis === "saham") {
    return setoranSahamSchema.refine(data => !!price
      && data.jumlahSaham * price.hargaJual <= maxSimpananAmount
      && data.jumlahSaham * price.hargaNominal <= maxSimpananAmount, {
      path: ["jumlahSaham"],
      message: "Total transaksi saham melebihi batas yang diizinkan atau harga belum tersedia",
    });
  }
  if (jenis === "penarikan") {
    return penarikanSchema.refine(data => !!balance && data.nilaiTransaksi <= balance.saldoEfektif, {
      path: ["nilaiTransaksi"],
      message: "Nominal melebihi saldo efektif atau saldo belum tersedia",
    });
  }
  return setoranTabunganSchema;
}

export interface MutasiSimpanan {
  id: number;
  kodeTransaksi: string;
  userId: number;
  akunId: number;
  jenisSimpanan: "tabungan" | "saham";
  jenisTransaksi: "setoran" | "penarikan";
  nilaiTransaksi: number;
  jumlahSaham: number;
  hargaPerSaham: number;
  hargaNominalPerSaham: number;
  agioSaham: number;
  saldoSetelahTransaksi: number | null;
  jumlahSahamSetelahTransaksi: number | null;
  jurnalId: number | null;
  tanggalTransaksi: string;
  statusApproved: StatusMutasi;
  alasanPenolakan: string | null;
  keterangan: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberName: string;
  accountName: string;
  creatorName: string;
  approverName: string | null;
}
export interface MutasiResponse { total: number; data: MutasiSimpanan[] }

export const statusMutasiLabels = {
  pending: { label: "Menunggu", color: "warning" },
  approved: { label: "Disetujui", color: "success" },
  rejected: { label: "Ditolak", color: "error" },
} as const;

export const statusMutasiOptions = [
  { label: "Semua status", value: "all" },
  ...Object.entries(statusMutasiLabels).map(([value, item]) => ({ label: item.label, value })),
];
export const jenisTransaksiOptions = [
  { label: "Semua transaksi", value: "all" },
  { label: "Setoran", value: "setoran" },
  { label: "Penarikan", value: "penarikan" },
];
export const jenisSimpananOptions = [
  { label: "Semua simpanan", value: "all" },
  { label: "Tabungan", value: "tabungan" },
  { label: "Saham", value: "saham" },
];
export const pengajuanLabels = {
  tabungan: { title: "Setor Tabungan", icon: "i-tabler-wallet", description: "Ajukan setoran tabungan untuk anggota pilihan." },
  saham: { title: "Beli Saham", icon: "i-tabler-chart-candle", description: "Ajukan pembelian saham menggunakan harga terbaru." },
  penarikan: { title: "Tarik Tabungan", icon: "i-tabler-cash-banknote", description: "Ajukan penarikan berdasarkan saldo efektif anggota." },
} as const;

export function getAnggotaOptions(anggota: AnggotaSimpanan[]) {
  return anggota.map(item => ({
    label: `${item.name} · ${item.noAnggota || "Belum menjadi anggota"} · ${item.namaKelompok}`,
    value: item.id,
    disabled: !item.noAnggota?.trim(),
  }));
}

// Rows must come from the backend's access-scoped mutasi list.
export function canCancelMutasi(mutasi: Pick<MutasiSimpanan, "statusApproved" | "userId" | "createdBy">, actorId: number) {
  return mutasi.statusApproved === "pending" && (mutasi.userId === actorId || mutasi.createdBy === actorId);
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const timestampFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
export function formatSimpananDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}
export function formatSimpananTimestamp(value: string) {
  return timestampFormatter.format(new Date(value));
}

export const mutasiColumns: TableColumn<MutasiSimpanan>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "tanggalTransaksi", header: "Tanggal", cell: ({ row }) => formatSimpananDate(row.original.tanggalTransaksi) },
  { accessorKey: "memberName", header: "Anggota" },
  { accessorKey: "jenisTransaksi", header: "Transaksi", cell: ({ row }) => row.original.jenisTransaksi === "setoran" ? "Setoran" : "Penarikan" },
  { accessorKey: "jenisSimpanan", header: "Simpanan", cell: ({ row }) => row.original.jenisSimpanan === "tabungan" ? "Tabungan" : "Saham" },
  { accessorKey: "nilaiTransaksi", header: "Nominal", cell: ({ row }) => formatRupiah(row.original.nilaiTransaksi) },
  { accessorKey: "accountName", header: "Kas / Bank" },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "creatorName", header: "Diinput Oleh" },
  { accessorKey: "approverName", header: "Diproses Oleh", cell: ({ row }) => row.original.approverName || "—" },
];
