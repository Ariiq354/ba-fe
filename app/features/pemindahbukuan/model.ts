import type { TableColumn } from "@nuxt/ui";
import type { HargaSaham, SaldoSimpanan, StatusMutasi } from "~/features/simpanan/model";
import { z } from "zod";
import { formatSimpananDate } from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";

export const maxPemindahbukuanAmount = 2_147_483_647;
export const hargaNominalSaham = 50_000;
export const tipePemindahbukuanOptions = [
  { label: "Transfer Tabungan", value: "tabungan_ke_tabungan" as const },
  { label: "Transfer Saham", value: "saham_ke_saham" as const },
  { label: "Tabungan ke Saham", value: "tabungan_ke_saham" as const },
];
export type TipePemindahbukuan = typeof tipePemindahbukuanOptions[number]["value"];
export const tipePemindahbukuanLabels = Object.fromEntries(tipePemindahbukuanOptions.map(item => [item.value, item.label]));

function positiveIntegerSchema(message: string) {
  return z.number().optional().pipe(z.number(message).int("Harus berupa bilangan bulat").min(1, "Nilai minimal 1").max(maxPemindahbukuanAmount, "Nilai maksimal 2.147.483.647"));
}
const commonFields = {
  idUserSumber: positiveIntegerSchema("Pilih anggota sumber"),
  idUserTujuan: positiveIntegerSchema("Pilih anggota tujuan"),
  keterangan: z.string().trim(),
};
export const pemindahbukuanSchema = z.discriminatedUnion("tipePemindahbukuan", [
  z.object({ ...commonFields, tipePemindahbukuan: z.literal("tabungan_ke_tabungan"), nominal: positiveIntegerSchema("Nominal wajib diisi") }),
  z.object({ ...commonFields, tipePemindahbukuan: z.literal("saham_ke_saham"), jumlahSaham: positiveIntegerSchema("Jumlah saham wajib diisi") }),
  z.object({ ...commonFields, tipePemindahbukuan: z.literal("tabungan_ke_saham"), jumlahSaham: positiveIntegerSchema("Jumlah saham wajib diisi") }),
]);
export type PengajuanPemindahbukuan = z.output<typeof pemindahbukuanSchema>;
export const rejectPemindahbukuanSchema = z.object({ alasanPenolakan: z.string().trim().min(1, "Alasan penolakan wajib diisi") });
export type RejectPemindahbukuan = z.output<typeof rejectPemindahbukuanSchema>;

export function getPemindahbukuanLimit(tipe: TipePemindahbukuan, balance?: SaldoSimpanan | null, price?: HargaSaham | null) {
  if (!balance)
    return 0;
  if (tipe === "tabungan_ke_tabungan")
    return Math.max(0, Math.min(balance.saldoEfektif, maxPemindahbukuanAmount));
  const nominalLimit = Math.floor(maxPemindahbukuanAmount / hargaNominalSaham);
  if (tipe === "saham_ke_saham")
    return Math.max(0, Math.min(balance.jumlahSahamEfektif, nominalLimit));
  if (!price || price.hargaJual <= 0)
    return 0;
  return Math.max(0, Math.min(nominalLimit, Math.floor(Math.min(balance.saldoEfektif, maxPemindahbukuanAmount) / price.hargaJual)));
}

export function getPemindahbukuanSchema(balance?: SaldoSimpanan | null, price?: HargaSaham | null) {
  return pemindahbukuanSchema.superRefine((data, ctx) => {
    const conversion = data.tipePemindahbukuan === "tabungan_ke_saham";
    if ((data.idUserSumber === data.idUserTujuan) !== conversion) {
      ctx.addIssue({ code: "custom", path: ["idUserTujuan"], message: conversion ? "Konversi harus untuk anggota yang sama" : "Tujuan harus berbeda dari sumber" });
    }
    const field = data.tipePemindahbukuan === "tabungan_ke_tabungan" ? "nominal" : "jumlahSaham";
    const amount = data.tipePemindahbukuan === "tabungan_ke_tabungan" ? data.nominal : data.jumlahSaham;
    if (!balance || (conversion && !price)) {
      ctx.addIssue({ code: "custom", path: [field], message: "Saldo atau harga saham belum tersedia" });
    }
    else if (amount > getPemindahbukuanLimit(data.tipePemindahbukuan, balance, price)) {
      ctx.addIssue({ code: "custom", path: [field], message: "Nilai melebihi saldo/saham tersedia atau batas transaksi" });
    }
  });
}

export interface Pemindahbukuan {
  id: number;
  kodeTransaksi: string;
  idUserSumber: number;
  akunIdSumber: number;
  idUserTujuan: number;
  akunIdTujuan: number;
  nominal: number;
  jumlahSaham: number;
  hargaPerSaham: number;
  hargaNominalPerSaham: number;
  agioSaham: number;
  jurnalId: number | null;
  tipePemindahbukuan: TipePemindahbukuan;
  tanggalTransaksi: string;
  statusApproved: StatusMutasi;
  alasanPenolakan: string | null;
  keterangan: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceMemberName: string;
  destinationMemberName: string;
  sourceAccountName: string;
  destinationAccountName: string;
  creatorName: string;
  approverName: string | null;
}
export interface PemindahbukuanResponse { total: number; data: Pemindahbukuan[] }

// Recipient-visible rows do not necessarily grant access to their source.
export function canCancelPemindahbukuan(transfer: Pick<Pemindahbukuan, "statusApproved" | "idUserSumber" | "createdBy">, actorId: number, accessibleSourceIds: number[]) {
  return transfer.statusApproved === "pending"
    && (transfer.idUserSumber === actorId || transfer.createdBy === actorId)
    && accessibleSourceIds.includes(transfer.idUserSumber);
}

export function formatPemindahbukuanValue(transfer: Pick<Pemindahbukuan, "tipePemindahbukuan" | "nominal" | "jumlahSaham">) {
  return transfer.tipePemindahbukuan === "tabungan_ke_tabungan" ? formatRupiah(transfer.nominal) : `${transfer.jumlahSaham.toLocaleString("id-ID")} lembar`;
}

export const pemindahbukuanColumns: TableColumn<Pemindahbukuan>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  { accessorKey: "tanggalTransaksi", header: "Tanggal", cell: ({ row }) => formatSimpananDate(row.original.tanggalTransaksi) },
  { accessorKey: "tipePemindahbukuan", header: "Jenis", cell: ({ row }) => tipePemindahbukuanLabels[row.original.tipePemindahbukuan] },
  { id: "members", header: "Sumber → Tujuan", cell: ({ row }) => `${row.original.sourceMemberName} → ${row.original.destinationMemberName}` },
  { accessorKey: "nominal", header: "Nilai", cell: ({ row }) => formatPemindahbukuanValue(row.original) },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "creatorName", header: "Diajukan Oleh" },
  { accessorKey: "approverName", header: "Diproses Oleh", cell: ({ row }) => row.original.approverName || "—" },
];
