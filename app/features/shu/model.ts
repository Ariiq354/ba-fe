import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatRupiah } from "~/utils/format";

export interface Shu {
  id: number;
  tahun: number;
  idUser: number;
  nama: string;
  noAnggota: string | null;
  jumlahShuSaham: number;
  jumlahShuTabungan: number;
  totalShu: number;
  dialihkanAt: string | null;
}

export interface ShuResponse {
  data: Shu[];
}

export interface ReferensiShu {
  tahun: number;
  laba: number;
  batasShu: number;
  sudahDibagikan: boolean;
  sudahDialihkan: boolean;
}

export function generateShuSchema(batasShu: number) {
  return z.object({
    totalShu: z
      .number("Total SHU wajib diisi")
      .int("Harus berupa rupiah bulat")
      .min(1, "Total SHU minimal Rp 1")
      .max(Math.min(batasShu, Number.MAX_SAFE_INTEGER), "Total SHU melebihi batas pembagian"),
  });
}

export type GenerateShu = z.output<ReturnType<typeof generateShuSchema>>;

export const shuColumns: TableColumn<Shu>[] = [
  { accessorKey: "tahun", header: "Tahun" },
  {
    accessorKey: "jumlahShuSaham",
    header: "SHU Saham",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahShuSaham),
  },
  {
    accessorKey: "jumlahShuTabungan",
    header: "SHU Tabungan",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.jumlahShuTabungan),
  },
  {
    accessorKey: "totalShu",
    header: "Total SHU",
    meta: { class: { th: "text-right", td: "text-right tabular-nums font-semibold" } },
    cell: ({ row }) => formatRupiah(row.original.totalShu),
  },
];
