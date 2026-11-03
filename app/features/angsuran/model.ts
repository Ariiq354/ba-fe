import type { TableColumn } from "@nuxt/ui";
import type { StatusMutasi } from "~/features/simpanan/model";
import { z } from "zod";
import { formatSimpananDate, paymentMethods } from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";

export const maxAngsuranAmount = 2_147_483_647;

export function getAngsuranSchema(sisaTagihan: number) {
  return z.object({
    pembiayaanId: z.number("Pilih pembiayaan").int().min(1, "Pilih pembiayaan"),
    jumlahPembayaran: z
      .number("Nominal wajib diisi")
      .int("Harus berupa bilangan bulat")
      .min(1, "Nominal minimal Rp1")
      .max(
        Math.min(sisaTagihan, maxAngsuranAmount),
        "Nominal melebihi sisa tagihan atau batas transaksi",
      ),
    metodePembayaran: z.enum(paymentMethods, "Pilih metode pembayaran"),
    keterangan: z.string().trim().optional(),
  });
}

export const rejectAngsuranSchema = z.object({
  alasanPenolakan: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});
export type PengajuanAngsuran = z.output<ReturnType<typeof getAngsuranSchema>>;
export type RejectAngsuran = z.output<typeof rejectAngsuranSchema>;
export type AngsuranAction = "approve" | "reject" | "cancel";

export interface Angsuran {
  id: number;
  pembiayaanId: number;
  kodePembiayaan: string;
  userId: number;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  jumlahPembayaran: number;
  metodePembayaran: (typeof paymentMethods)[number];
  statusApproved: StatusMutasi;
  alasanPenolakan: string | null;
  keterangan: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberName: string;
  creatorName: string;
  approverName: string | null;
}

export interface AngsuranResponse {
  total: number;
  data: Angsuran[];
}

// Only use rows from the backend's access-scoped angsuran list.
export function canCancelAngsuran(
  item: Pick<Angsuran, "statusApproved" | "userId" | "createdBy">,
  actorId: number,
) {
  return (
    item.statusApproved === "pending" && (item.userId === actorId || item.createdBy === actorId)
  );
}

export const angsuranColumns: TableColumn<Angsuran>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "kodePembiayaan", header: "Pembiayaan" },
  {
    accessorKey: "tanggalTransaksi",
    header: "Tanggal",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalTransaksi),
  },
  { accessorKey: "memberName", header: "Anggota" },
  {
    accessorKey: "jumlahPembayaran",
    header: "Nominal",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahPembayaran),
  },
  { accessorKey: "metodePembayaran", header: "Metode" },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "creatorName", header: "Diajukan Oleh" },
  {
    accessorKey: "approverName",
    header: "Diproses Oleh",
    cell: ({ row }) => row.original.approverName || "—",
  },
];
