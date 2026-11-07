import type { TableColumn } from "@nuxt/ui";
import type { PembiayaanEksternalOption } from "~/features/pembiayaan-eksternal/model";
import { z } from "zod";
import { maxExternalAmount } from "~/features/pembiayaan-eksternal/model";
import { formatSimpananDate } from "~/features/simpanan/model";
import { getJakartaDate } from "~/utils/date";
import { formatRupiah } from "~/utils/format";

const angsuranEksternalSchema = z.object({
  pembiayaanEksternalId: z
    .number()
    .optional()
    .pipe(z.number("Pilih pembiayaan").int().min(1, "Pilih pembiayaan")),
  tanggalTransaksi: z.iso
    .date("Tanggal tidak valid")
    .refine((date) => date >= "0001-01-01" && date <= getJakartaDate(), {
      message: "Tanggal harus valid dan tidak boleh di masa depan",
    }),
  jumlahPembayaran: z
    .number()
    .optional()
    .pipe(
      z
        .number("Total pembayaran wajib diisi")
        .int("Harus berupa bilangan bulat")
        .min(1, "Pembayaran minimal Rp1")
        .max(maxExternalAmount, "Nominal terlalu besar"),
    ),
  keterangan: z.string().trim(),
});
export type TambahAngsuranEksternal = z.output<typeof angsuranEksternalSchema>;

export function getAngsuranEksternalSchema(pembiayaan: PembiayaanEksternalOption | undefined) {
  return angsuranEksternalSchema.superRefine((data, ctx) => {
    if (!pembiayaan || data.pembiayaanEksternalId !== pembiayaan.id) {
      ctx.addIssue({
        code: "custom",
        path: ["pembiayaanEksternalId"],
        message: "Pilih pembiayaan yang belum lunas",
      });
      return;
    }
    if (data.jumlahPembayaran > pembiayaan.sisaPembiayaan) {
      ctx.addIssue({
        code: "custom",
        path: ["jumlahPembayaran"],
        message: "Pembayaran melebihi sisa pembiayaan",
      });
    }
  });
}

export interface AngsuranEksternal {
  id: number;
  pembiayaanEksternalId: number;
  kodePembiayaan: string;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  jumlahPembayaran: number;
  jumlahPokok: number;
  jumlahMargin: number;
  keterangan: string | null;
  createdBy: number;
  creatorName: string;
  createdAt: string;
}
export interface AngsuranEksternalResponse {
  total: number;
  data: AngsuranEksternal[];
}

export const angsuranEksternalColumns: TableColumn<AngsuranEksternal>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "kodePembiayaan", header: "Kode Pembiayaan" },
  {
    accessorKey: "tanggalTransaksi",
    header: "Tanggal",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalTransaksi),
  },
  ...(
    [
      ["jumlahPokok", "Pokok"],
      ["jumlahMargin", "Margin"],
      ["jumlahPembayaran", "Total Pembayaran"],
    ] as const
  ).map(([accessorKey, header]): TableColumn<AngsuranEksternal> => ({
    accessorKey,
    header,
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original[accessorKey]),
  })),
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => row.original.keterangan || "—",
  },
  { accessorKey: "creatorName", header: "Dicatat Oleh" },
];
