import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatRupiah } from "~/utils/format";

export const maxJurnalAmount = 2147483647;
const amountSchema = z.number("Nominal wajib diisi")
  .int("Nominal harus berupa bilangan bulat")
  .min(0, "Nominal tidak boleh negatif")
  .max(maxJurnalAmount, "Nominal maksimal Rp2.147.483.647 per baris");

export function getJurnalTotals(details: { debit?: number; kredit?: number }[]) {
  return details.reduce<{ debit: number; kredit: number }>((total, detail) => ({
    debit: total.debit + (Number.isFinite(detail.debit) ? detail.debit! : 0),
    kredit: total.kredit + (Number.isFinite(detail.kredit) ? detail.kredit! : 0),
  }), { debit: 0, kredit: 0 });
}

export const jurnalSchema = z.object({
  tanggalTransaksi: z.iso.date("Tanggal transaksi tidak valid").refine(value => !value.startsWith("0000-"), "Tanggal transaksi tidak valid"),
  keterangan: z.string().trim(),
  details: z.array(z.object({
    akunId: z.number().optional().pipe(z.number("Pilih akun").int().positive("Pilih akun")),
    debit: z.number().optional().pipe(amountSchema),
    kredit: z.number().optional().pipe(amountSchema),
  })).min(2, "Minimal dua baris akun diperlukan"),
}).superRefine((data, ctx) => {
  const total = getJurnalTotals(data.details);
  if (total.debit <= 0 || total.kredit <= 0) {
    ctx.addIssue({ code: "custom", path: ["details"], message: "Total debit dan kredit harus lebih dari nol" });
  }
  else if (total.debit !== total.kredit) {
    ctx.addIssue({ code: "custom", path: ["details"], message: "Total debit dan kredit harus sama" });
  }
});

export type JurnalSchema = z.output<typeof jurnalSchema>;

export interface JurnalHeader {
  id: number;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  keterangan: string | null;
  userId: number;
  userName: string | null;
  createdAt: string;
}

export interface JurnalDetail {
  id: number;
  jurnalId: number;
  akunId: number;
  kodeAkun: string;
  namaAkun: string;
  debit: number;
  kredit: number;
}

export type JurnalRow = Omit<JurnalHeader, "id"> & JurnalDetail;
export type Jurnal = JurnalHeader & { details: JurnalDetail[] };
export type JurnalSummary = JurnalHeader & { totalDebit: number; totalKredit: number };

export interface JurnalResponse {
  total: number;
  data: JurnalRow[];
}

export interface JurnalAkun {
  id: number;
  kodeAkun: string;
  namaAkun: string;
  isActive: boolean;
}

export interface JurnalAkunResponse {
  total: number;
  data: JurnalAkun[];
}

export interface JurnalFormRow {
  key: number;
  akunId?: number;
  debit?: number;
  kredit?: number;
}

export function initJurnalFormdata() {
  const now = new Date();
  const tanggalTransaksi = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    tanggalTransaksi,
    keterangan: "",
    details: [
      { key: 0, akunId: undefined, debit: 0, kredit: 0 },
      { key: 1, akunId: undefined, debit: 0, kredit: 0 },
    ] as JurnalFormRow[],
  };
}

// Pagination and DELETE operate on journal headers, not the flat detail IDs.
export function groupJurnalRows(rows: JurnalRow[]): JurnalSummary[] {
  const journals = new Map<number, JurnalSummary>();
  for (const row of rows) {
    let journal = journals.get(row.jurnalId);
    if (!journal) {
      journal = {
        id: row.jurnalId,
        kodeTransaksi: row.kodeTransaksi,
        tanggalTransaksi: row.tanggalTransaksi,
        keterangan: row.keterangan,
        userId: row.userId,
        userName: row.userName,
        createdAt: row.createdAt,
        totalDebit: 0,
        totalKredit: 0,
      };
      journals.set(row.jurnalId, journal);
    }
    journal.totalDebit += row.debit;
    journal.totalKredit += row.kredit;
  }
  return [...journals.values()];
}

export function formatJurnalDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export const jurnalColumns: TableColumn<JurnalSummary>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "tanggalTransaksi", header: "Tanggal", cell: ({ row }) => formatJurnalDate(row.original.tanggalTransaksi) },
  { accessorKey: "keterangan", header: "Keterangan", cell: ({ row }) => row.original.keterangan || "—" },
  { accessorKey: "totalDebit", header: "Total Debit", cell: ({ row }) => formatRupiah(row.original.totalDebit) },
  { accessorKey: "totalKredit", header: "Total Kredit", cell: ({ row }) => formatRupiah(row.original.totalKredit) },
  { accessorKey: "userName", header: "Dicatat Oleh", cell: ({ row }) => row.original.userName || "—" },
];

export const jurnalDetailColumns: TableColumn<JurnalDetail>[] = [
  { accessorKey: "kodeAkun", header: "Kode Akun" },
  { accessorKey: "namaAkun", header: "Nama Akun" },
  { accessorKey: "debit", header: "Debit", cell: ({ row }) => formatRupiah(row.original.debit) },
  { accessorKey: "kredit", header: "Kredit", cell: ({ row }) => formatRupiah(row.original.kredit) },
];
