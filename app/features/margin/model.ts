import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatRupiah } from "~/utils/format";

export const marginSchema = z.object({
  minNominal: z.number("Nominal minimum wajib diisi").int("Harus berupa bilangan bulat").min(0, "Nominal tidak boleh negatif"),
  maxNominal: z.number("Nominal maksimum wajib diisi").int("Harus berupa bilangan bulat").min(0, "Nominal tidak boleh negatif"),
  persenMarginTahun: z.number("Margin tahunan wajib diisi").int("Harus berupa bilangan bulat").min(0, "Margin tidak boleh negatif"),
  jaminan: z.enum(["TIDAK_ADA", "ADA"]),
  biayaAkad: z.number("Biaya akad wajib diisi").int("Harus berupa bilangan bulat").min(0, "Biaya akad tidak boleh negatif"),
}).refine(data => data.maxNominal >= data.minNominal, {
  message: "Nominal maksimum harus lebih besar atau sama dengan nominal minimum",
  path: ["maxNominal"],
});

export type MarginSchema = z.output<typeof marginSchema>;
export type Margin = MarginSchema & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export interface MarginResponse {
  total: number;
  data: Margin[];
}

export const initMarginFormdata: Partial<MarginSchema> = {
  minNominal: undefined,
  maxNominal: undefined,
  persenMarginTahun: undefined,
  jaminan: "TIDAK_ADA",
  biayaAkad: 0,
};

export const jaminanOptions = [
  { label: "Tidak ada", value: "TIDAK_ADA" },
  { label: "Ada", value: "ADA" },
];

export const marginColumns: TableColumn<Margin>[] = [
  { accessorKey: "minNominal", header: "Nominal Minimum", cell: ({ row }) => formatRupiah(row.original.minNominal) },
  { accessorKey: "maxNominal", header: "Nominal Maksimum", cell: ({ row }) => formatRupiah(row.original.maxNominal) },
  { accessorKey: "persenMarginTahun", header: "Margin / Tahun", cell: ({ row }) => `${row.original.persenMarginTahun}%` },
  { accessorKey: "jaminan", header: "Jaminan", cell: ({ row }) => row.original.jaminan === "ADA" ? "Ada" : "Tidak ada" },
  { accessorKey: "biayaAkad", header: "Biaya Akad", cell: ({ row }) => formatRupiah(row.original.biayaAkad) },
];
