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
export const rejectPembiayaanSchema = z.object({
  alasanPenolakan: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});
export type RejectPembiayaan = z.output<typeof rejectPembiayaanSchema>;

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
  tanggalPembiayaan: string;
  jurnalId: number | null;
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

// Rows must come from the backend's access-scoped pembiayaan list.
export function canCancelPembiayaan(
  item: Pick<Pembiayaan, "statusApproved" | "userId" | "createdBy">,
  actorId: number,
) {
  return (
    item.statusApproved === "pending" && (item.userId === actorId || item.createdBy === actorId)
  );
}

export const pembiayaanColumns: TableColumn<Pembiayaan>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  {
    accessorKey: "tanggalPembiayaan",
    header: "Tanggal",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalPembiayaan),
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
