import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatSimpananDate } from "~/features/simpanan/model";
import { getJakartaDate } from "~/utils/date";
import { formatRupiah } from "~/utils/format";

export const maxExternalAmount = 2_147_483_647;
export const pembiayaanEksternalSchema = z.object({
  tanggalPembiayaan: z.iso
    .date("Tanggal tidak valid")
    .refine((date) => date >= "0001-01-01" && date <= getJakartaDate(), {
      message: "Tanggal harus valid dan tidak boleh di masa depan",
    }),
  jumlahPokok: z
    .number()
    .optional()
    .pipe(
      z
        .number("Jumlah pokok wajib diisi")
        .int("Harus berupa bilangan bulat")
        .min(1, "Jumlah pokok minimal Rp1")
        .max(maxExternalAmount, "Nominal terlalu besar"),
    ),
  jumlahMargin: z
    .number("Jumlah margin wajib diisi")
    .int("Harus berupa bilangan bulat")
    .min(0, "Margin tidak boleh negatif")
    .max(maxExternalAmount, "Nominal terlalu besar"),
  jangkaWaktuBulan: z
    .number()
    .optional()
    .pipe(
      z
        .number("Jangka waktu wajib diisi")
        .int("Harus berupa bilangan bulat")
        .min(1, "Jangka waktu minimal 1 bulan")
        .max(1200, "Jangka waktu maksimal 1.200 bulan"),
    ),
  tujuan: z.string().trim().min(1, "Tujuan pembiayaan wajib diisi"),
});
export type TambahPembiayaanEksternal = z.output<typeof pembiayaanEksternalSchema>;
export type StatusPelunasan = "belum_lunas" | "lunas";

export interface PembiayaanEksternal {
  id: number;
  kodeTransaksi: string;
  jumlahPokok: number;
  jumlahMargin: number;
  totalPembiayaan: number;
  akunId: number;
  namaAkun: string;
  tanggalPembiayaan: string;
  tanggalAkhirAngsuran: string;
  jangkaWaktuBulan: number;
  tujuan: string;
  totalPembayaran: number;
  totalMarginDibayar: number;
  sisaPokok: number;
  sisaMargin: number;
  sisaPembiayaan: number;
  statusPelunasan: StatusPelunasan;
  createdBy: number;
  creatorName: string;
  createdAt: string;
}
export interface PembiayaanEksternalResponse {
  total: number;
  data: PembiayaanEksternal[];
}
export type PembiayaanEksternalOption = Pick<
  PembiayaanEksternal,
  "id" | "kodeTransaksi" | "tujuan" | "sisaPokok" | "sisaMargin" | "sisaPembiayaan"
>;
export interface PembiayaanEksternalOptionsResponse {
  data: PembiayaanEksternalOption[];
}

export const statusPelunasanLabels = {
  belum_lunas: { label: "Belum Lunas", color: "warning" },
  lunas: { label: "Lunas", color: "success" },
} as const;
export const statusPelunasanOptions = [
  { label: "Semua status", value: "all" },
  { label: "Belum Lunas", value: "belum_lunas" },
  { label: "Lunas", value: "lunas" },
];

export const pembiayaanEksternalColumns: TableColumn<PembiayaanEksternal>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  {
    accessorKey: "tanggalPembiayaan",
    header: "Tanggal",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalPembiayaan),
  },
  { accessorKey: "tujuan", header: "Tujuan" },
  ...(
    [
      ["jumlahPokok", "Pokok"],
      ["jumlahMargin", "Margin"],
      ["sisaPembiayaan", "Sisa Pembiayaan"],
    ] as const
  ).map(([accessorKey, header]): TableColumn<PembiayaanEksternal> => ({
    accessorKey,
    header,
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original[accessorKey]),
  })),
  {
    accessorKey: "jangkaWaktuBulan",
    header: "Tenor",
    cell: ({ row }) => `${row.original.jangkaWaktuBulan} bulan`,
  },
  {
    accessorKey: "tanggalAkhirAngsuran",
    header: "Akhir Angsuran",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalAkhirAngsuran),
  },
  { accessorKey: "statusPelunasan", header: "Status" },
  { accessorKey: "creatorName", header: "Dicatat Oleh" },
];
