import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";
import { formatRupiah } from "~/utils/format";

export const maxJurnalAmount = 2147483647;
const amountSchema = z
  .number("Nominal wajib diisi")
  .int("Nominal harus berupa bilangan bulat")
  .min(0, "Nominal tidak boleh negatif")
  .max(maxJurnalAmount, "Nominal maksimal Rp2.147.483.647 per baris");

export function getJurnalTotals(details: { debit?: number; kredit?: number }[]) {
  return details.reduce<{ debit: number; kredit: number }>(
    (total, detail) => ({
      debit: total.debit + (Number.isFinite(detail.debit) ? detail.debit! : 0),
      kredit: total.kredit + (Number.isFinite(detail.kredit) ? detail.kredit! : 0),
    }),
    { debit: 0, kredit: 0 },
  );
}

const tanggalTransaksiSchema = z.iso
  .date("Tanggal transaksi tidak valid")
  .refine((value) => !value.startsWith("0000-"), "Tanggal transaksi tidak valid");

export const jurnalSchema = z
  .object({
    tanggalTransaksi: tanggalTransaksiSchema,
    keterangan: z.string().trim(),
    details: z
      .array(
        z.object({
          akunId: z.number().optional().pipe(z.number("Pilih akun").int().positive("Pilih akun")),
          debit: z.number().optional().pipe(amountSchema),
          kredit: z.number().optional().pipe(amountSchema),
        }),
      )
      .min(2, "Minimal dua baris akun diperlukan"),
  })
  .superRefine((data, ctx) => {
    const total = getJurnalTotals(data.details);
    if (total.debit <= 0 || total.kredit <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["details"],
        message: "Total debit dan kredit harus lebih dari nol",
      });
    } else if (total.debit !== total.kredit) {
      ctx.addIssue({
        code: "custom",
        path: ["details"],
        message: "Total debit dan kredit harus sama",
      });
    }
  });

export type JurnalSchema = z.output<typeof jurnalSchema>;

export const jurnalTemplateSchema = z.object({
  masterInputTransaksiId: z
    .number()
    .optional()
    .pipe(z.number("Pilih transaksi").int().positive("Pilih transaksi")),
  tanggalTransaksi: tanggalTransaksiSchema,
  nominal: z
    .number()
    .optional()
    .pipe(
      z
        .number("Nominal wajib diisi")
        .int("Nominal harus berupa bilangan bulat")
        .min(1, "Nominal harus lebih dari nol")
        .max(maxJurnalAmount, "Nominal maksimal Rp2.147.483.647"),
    ),
  keterangan: z.string().trim(),
});

export type JurnalTemplateSchema = z.output<typeof jurnalTemplateSchema>;

export interface JurnalHeader {
  id: number;
  kodeTransaksi: string;
  tanggalTransaksi: string;
  keterangan: string | null;
}

export interface JurnalDetail {
  kodeAkun: string;
  namaAkun: string;
  userId: number;
  userName: string;
  debit: number;
  kredit: number;
}

export type Jurnal = JurnalHeader & { details: JurnalDetail[] };
export type JurnalSummary = Jurnal & {
  users: Pick<JurnalDetail, "userId" | "userName">[];
  totalDebit: number;
  totalKredit: number;
};

export interface JurnalResponse {
  total: number;
  data: Jurnal[];
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

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function initJurnalTemplateFormdata(): z.input<typeof jurnalTemplateSchema> {
  return {
    masterInputTransaksiId: undefined,
    tanggalTransaksi: getTodayDate(),
    nominal: 0,
    keterangan: "",
  };
}

export function initJurnalFormdata() {
  return {
    tanggalTransaksi: getTodayDate(),
    keterangan: "",
    details: [
      { key: 0, akunId: undefined, debit: 0, kredit: 0 },
      { key: 1, akunId: undefined, debit: 0, kredit: 0 },
    ] as JurnalFormRow[],
  };
}

export function getJurnalSummaries(journals: Jurnal[]): JurnalSummary[] {
  return journals.map((journal) => {
    const users = new Map<number, Pick<JurnalDetail, "userId" | "userName">>();
    for (const detail of journal.details) {
      users.set(detail.userId, { userId: detail.userId, userName: detail.userName });
    }
    const totals = getJurnalTotals(journal.details);
    return {
      ...journal,
      users: [...users.values()],
      totalDebit: totals.debit,
      totalKredit: totals.kredit,
    };
  });
}

export function formatJurnalDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export const jurnalColumns: TableColumn<JurnalSummary>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  {
    accessorKey: "tanggalTransaksi",
    header: "Tanggal",
    cell: ({ row }) => formatJurnalDate(row.original.tanggalTransaksi),
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => row.original.keterangan || "—",
  },
  {
    accessorKey: "totalDebit",
    header: "Debit",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.totalDebit),
  },
  {
    accessorKey: "totalKredit",
    header: "Kredit",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.totalKredit),
  },
  {
    accessorKey: "users",
    header: "Pengguna",
    cell: ({ row }) => row.original.users.map((user) => user.userName).join(", ") || "—",
  },
];

export const jurnalDetailColumns: TableColumn<JurnalDetail>[] = [
  { accessorKey: "kodeAkun", header: "Kode Akun" },
  { accessorKey: "namaAkun", header: "Nama Akun" },
  { accessorKey: "userName", header: "Pengguna", cell: ({ row }) => row.original.userName || "—" },
  {
    accessorKey: "debit",
    header: "Debit",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.debit),
  },
  {
    accessorKey: "kredit",
    header: "Kredit",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatRupiah(row.original.kredit),
  },
];
