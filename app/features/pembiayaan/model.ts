import type { TableColumn } from "@nuxt/ui";
import type { StatusMutasi } from "~/features/simpanan/model";
import { z } from "zod";
import { formatSimpananDate, paymentMethods } from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";

export const maxPembiayaanAmount = 2_147_483_647;
function positiveInteger(message: string) {
  return z
    .number()
    .optional()
    .pipe(
      z
        .number(message)
        .int("Harus berupa bilangan bulat")
        .min(1, "Nilai minimal 1")
        .max(maxPembiayaanAmount, "Nilai maksimal 2.147.483.647"),
    );
}
export const pembiayaanSchema = z.object({
  userId: positiveInteger("Pilih anggota"),
  jumlahPokok: positiveInteger("Jumlah pokok wajib diisi"),
  jangkaWaktuBulan: positiveInteger("Jangka waktu wajib diisi"),
  tujuan: z.string().trim().min(1, "Tujuan pembiayaan wajib diisi"),
  metodePembayaran: z.enum(paymentMethods, "Pilih metode pencairan"),
  persenMarginTahun: z
    .number()
    .int("Margin harus berupa bilangan bulat")
    .min(0, "Margin tidak boleh negatif")
    .max(99_999, "Margin maksimal 99.999% per tahun")
    .optional(),
});
export type PengajuanPembiayaan = z.output<typeof pembiayaanSchema>;
export interface SimulasiMarginResponse {
  persenMarginTahun?: number;
  jumlahMargin?: number;
}

export const rejectPembiayaanSchema = z.object({
  alasanPenolakan: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});
export type RejectPembiayaan = z.output<typeof rejectPembiayaanSchema>;

export type StatusTransfer = "belum_transfer" | "sudah_transfer";
export type PembiayaanAction = "transfer" | "approve" | "reject" | "cancel";
export const statusTransferLabels = {
  belum_transfer: { label: "Belum Transfer", color: "warning" },
  sudah_transfer: { label: "Sudah Transfer", color: "success" },
} as const;

export interface Pembiayaan {
  id: number;
  kodeTransaksi: string;
  userId: number;
  metodePembayaran: (typeof paymentMethods)[number];
  jumlahPokok: number;
  persenMarginTahun: number;
  jumlahMargin: number;
  biayaAkad: number;
  totalPembiayaan: number;
  jangkaWaktuBulan: number;
  tujuan: string;
  tanggalPengajuan: string;
  tanggalTransfer: string | null;
  tanggalPembiayaan: string | null;
  statusTransfer: StatusTransfer;
  transferredBy: number | null;
  transferredAt: string | null;
  statusApproved: StatusMutasi;
  alasanPenolakan: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberName: string;
  creatorName: string;
  approverName: string | null;
}
export interface PembiayaanResponse {
  total: number;
  data: Pembiayaan[];
}

export function canProcessPembiayaan(
  item: Pick<Pembiayaan, "statusApproved" | "statusTransfer">,
  action: PembiayaanAction,
) {
  return (
    item.statusApproved === "pending" &&
    item.statusTransfer === (action === "approve" ? "sudah_transfer" : "belum_transfer")
  );
}

// Rows must come from the backend's access-scoped pembiayaan list.
export function canCancelPembiayaan(
  item: Pick<Pembiayaan, "statusApproved" | "statusTransfer" | "userId" | "createdBy">,
  actorId: number,
) {
  return (
    canProcessPembiayaan(item, "cancel") && (item.userId === actorId || item.createdBy === actorId)
  );
}

export const pembiayaanColumns: TableColumn<Pembiayaan>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  {
    accessorKey: "tanggalPengajuan",
    header: "Tanggal Pengajuan",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalPengajuan),
  },
  { accessorKey: "memberName", header: "Anggota" },
  {
    accessorKey: "jumlahPokok",
    header: "Pokok",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahPokok),
  },
  {
    accessorKey: "totalPembiayaan",
    header: "Total Pokok + Margin",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.totalPembiayaan),
  },
  {
    accessorKey: "jangkaWaktuBulan",
    header: "Jangka Waktu",
    cell: ({ row }) => `${row.original.jangkaWaktuBulan} bulan`,
  },
  { accessorKey: "metodePembayaran", header: "Pencairan" },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "creatorName", header: "Diajukan Oleh" },
  {
    accessorKey: "approverName",
    header: "Diproses Oleh",
    cell: ({ row }) => row.original.approverName || "—",
  },
];
