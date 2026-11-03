import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatRupiah } from "~/utils/format";

export const sahamSchema = z.object({
  hargaJual: z
    .number("Harga jual wajib diisi")
    .int("Harga jual harus berupa bilangan bulat")
    .min(1, "Harga jual minimal Rp1"),
});

export type SahamSchema = z.output<typeof sahamSchema>;
export type Saham = SahamSchema & {
  id: number;
  hargaNominal: number;
  updatedByName: string;
  createdAt: string;
};

export interface SahamResponse {
  total: number;
  data: Saham[];
}

export const initSahamFormdata: Partial<SahamSchema> = {
  hargaJual: undefined,
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const sahamColumns: TableColumn<Saham>[] = [
  {
    accessorKey: "createdAt",
    header: "Tanggal Penetapan",
    cell: ({ row }) => dateFormatter.format(new Date(row.original.createdAt)),
  },
  {
    accessorKey: "hargaNominal",
    header: "Harga Nominal",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.hargaNominal),
  },
  {
    accessorKey: "hargaJual",
    header: "Harga Jual",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.hargaJual),
  },
  {
    accessorKey: "updatedByName",
    header: "Ditetapkan Oleh",
    cell: ({ row }) => row.original.updatedByName || "—",
  },
];
