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
  { label: "Pembelian Kembali Saham", value: "pembelian_kembali_saham" as const },
];
export type TipePemindahbukuan = (typeof tipePemindahbukuanOptions)[number]["value"];
export function getPemindahbukuanOptions(canBuyback: boolean) {
  return tipePemindahbukuanOptions.filter(
    (option) => canBuyback || option.value !== "pembelian_kembali_saham",
  );
}
export const tipePemindahbukuanLabels = Object.fromEntries(
  tipePemindahbukuanOptions.map((item) => [item.value, item.label]),
);

function positiveIntegerSchema(message: string) {
  return z
    .number()
    .optional()
    .pipe(
      z
        .number(message)
        .int("Harus berupa bilangan bulat")
        .min(1, "Nilai minimal 1")
        .max(maxPemindahbukuanAmount, "Nilai maksimal 2.147.483.647"),
    );
}
const commonFields = {
  idUserSumber: positiveIntegerSchema("Pilih anggota sumber"),
  idUserTujuan: positiveIntegerSchema("Pilih anggota tujuan"),
  keterangan: z.string().trim(),
};
export const pemindahbukuanSchema = z.discriminatedUnion("tipePemindahbukuan", [
  z.object({
    ...commonFields,
    tipePemindahbukuan: z.literal("tabungan_ke_tabungan"),
    nominal: positiveIntegerSchema("Nominal wajib diisi"),
  }),
  z.object({
    ...commonFields,
    tipePemindahbukuan: z.literal("saham_ke_saham"),
    jumlahSaham: positiveIntegerSchema("Jumlah saham wajib diisi"),
  }),
  z.object({
    ...commonFields,
    tipePemindahbukuan: z.literal("tabungan_ke_saham"),
    jumlahSaham: positiveIntegerSchema("Jumlah saham wajib diisi"),
  }),
  z.object({
    idUserSumber: commonFields.idUserSumber,
    tipePemindahbukuan: z.literal("pembelian_kembali_saham"),
    jumlahSaham: z
      .number()
      .optional()
      .pipe(
        z
          .number("Jumlah saham wajib diisi")
          .min(0.5, "Jumlah saham minimal 0,5 lembar")
          .multipleOf(0.5, "Jumlah saham harus kelipatan 0,5 lembar")
          .max(maxPemindahbukuanAmount, "Jumlah saham melebihi batas transaksi"),
      ),
    keterangan: commonFields.keterangan,
  }),
]);
export type PengajuanPemindahbukuan = z.output<typeof pemindahbukuanSchema>;
export const rejectPemindahbukuanSchema = z.object({
  alasanPenolakan: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});
export type RejectPemindahbukuan = z.output<typeof rejectPemindahbukuanSchema>;

export function getPemindahbukuanLimit(
  tipe: TipePemindahbukuan,
  balance?: SaldoSimpanan | null,
  price?: HargaSaham | null,
) {
  if (!balance) return 0;
  if (tipe === "tabungan_ke_tabungan")
    return Math.max(0, Math.min(balance.saldoEfektif, maxPemindahbukuanAmount));
  const nominalLimit = Math.floor(maxPemindahbukuanAmount / hargaNominalSaham);
  if (tipe === "saham_ke_saham")
    return Math.max(0, Math.min(Math.floor(balance.jumlahSahamEfektif), nominalLimit));
  if (!price || price.hargaJual <= 0) return 0;
  if (tipe === "pembelian_kembali_saham") {
    const maxUnitValue = Math.max(
      hargaNominalSaham,
      price.hargaJual,
      Math.abs(price.hargaJual - hargaNominalSaham),
    );
    return Math.max(
      0,
      Math.floor(Math.min(balance.jumlahSahamEfektif, maxPemindahbukuanAmount / maxUnitValue) * 2) /
        2,
    );
  }
  return Math.max(
    0,
    Math.min(
      nominalLimit,
      Math.floor(Math.min(balance.saldoEfektif, maxPemindahbukuanAmount) / price.hargaJual),
    ),
  );
}

export function getPemindahbukuanSchema(balance?: SaldoSimpanan | null, price?: HargaSaham | null) {
  return pemindahbukuanSchema.superRefine((data, ctx) => {
    const conversion = data.tipePemindahbukuan === "tabungan_ke_saham";
    const buyback = data.tipePemindahbukuan === "pembelian_kembali_saham";
    if (
      data.tipePemindahbukuan !== "pembelian_kembali_saham" &&
      (data.idUserSumber === data.idUserTujuan) !== conversion
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["idUserTujuan"],
        message: conversion
          ? "Konversi harus untuk anggota yang sama"
          : "Tujuan harus berbeda dari sumber",
      });
    }
    const field = data.tipePemindahbukuan === "tabungan_ke_tabungan" ? "nominal" : "jumlahSaham";
    const amount =
      data.tipePemindahbukuan === "tabungan_ke_tabungan" ? data.nominal : data.jumlahSaham;
    if (!balance || ((conversion || buyback) && !price)) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: "Saldo atau harga saham belum tersedia",
      });
    } else if (amount > getPemindahbukuanLimit(data.tipePemindahbukuan, balance, price)) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: "Nilai melebihi saldo/saham tersedia atau batas transaksi",
      });
    }
    if (buyback && price) {
      const amounts = [
        data.jumlahSaham * price.hargaJual,
        data.jumlahSaham * hargaNominalSaham,
        data.jumlahSaham * Math.abs(price.hargaJual - hargaNominalSaham),
      ];
      if (amounts.some((amount) => !Number.isSafeInteger(amount))) {
        ctx.addIssue({
          code: "custom",
          path: ["jumlahSaham"],
          message:
            "Nilai pembayaran harus berupa rupiah bulat. Gunakan jumlah saham bulat untuk harga ini.",
        });
      }
    }
  });
}

export interface Pemindahbukuan {
  id: number;
  kodeTransaksi: string;
  idUserSumber: number;
  idUserTujuan: number | null;
  nominal: number;
  jumlahSaham: number;
  hargaPerSaham: number;
  hargaNominalPerSaham: number;
  agioSaham: number;
  tipePemindahbukuan: TipePemindahbukuan;
  tanggalTransaksi: string;
  statusApproved: StatusMutasi;
  alasanPenolakan: string | null;
  keterangan: string | null;
  createdBy: number;
  approvedAt: string | null;
  createdAt: string;
  sourceMemberName: string;
  destinationMemberName: string | null;
  sourceAccountName: string;
  destinationAccountName: string;
  creatorName: string;
  approverName: string | null;
}
export interface PemindahbukuanResponse {
  total: number;
  data: Pemindahbukuan[];
}

// Recipient-visible rows do not necessarily grant access to their source.
export function canCancelPemindahbukuan(
  transfer: Pick<
    Pemindahbukuan,
    "statusApproved" | "idUserSumber" | "createdBy" | "tipePemindahbukuan"
  >,
  actorId: number,
  accessibleSourceIds: number[],
  canBuyback: boolean,
) {
  if (transfer.tipePemindahbukuan === "pembelian_kembali_saham") {
    return (
      transfer.statusApproved === "pending" &&
      canBuyback &&
      accessibleSourceIds.includes(transfer.idUserSumber)
    );
  }
  return (
    transfer.statusApproved === "pending" &&
    (transfer.idUserSumber === actorId || transfer.createdBy === actorId) &&
    accessibleSourceIds.includes(transfer.idUserSumber)
  );
}

export function getPemindahbukuanDestination(
  transfer: Pick<Pemindahbukuan, "destinationMemberName" | "destinationAccountName">,
) {
  return transfer.destinationMemberName ?? transfer.destinationAccountName;
}

export function getPemindahbukuanNominalLabel(tipe: TipePemindahbukuan) {
  if (tipe === "saham_ke_saham") return "Nilai Referensi Saham";
  if (tipe === "pembelian_kembali_saham") return "Total Pembayaran";
  return "Tabungan Digunakan";
}

export function formatPemindahbukuanValue(
  transfer: Pick<Pemindahbukuan, "tipePemindahbukuan" | "nominal" | "jumlahSaham">,
) {
  return transfer.tipePemindahbukuan === "tabungan_ke_tabungan"
    ? formatRupiah(transfer.nominal)
    : `${transfer.jumlahSaham.toLocaleString("id-ID")} lembar`;
}

export const pemindahbukuanColumns: TableColumn<Pemindahbukuan>[] = [
  { accessorKey: "kodeTransaksi", header: "Kode Transaksi" },
  {
    accessorKey: "tanggalTransaksi",
    header: "Tanggal",
    cell: ({ row }) => formatSimpananDate(row.original.tanggalTransaksi),
  },
  {
    accessorKey: "tipePemindahbukuan",
    header: "Jenis",
    cell: ({ row }) => tipePemindahbukuanLabels[row.original.tipePemindahbukuan],
  },
  {
    id: "members",
    header: "Sumber → Tujuan",
    cell: ({ row }) =>
      `${row.original.sourceMemberName} → ${getPemindahbukuanDestination(row.original)}`,
  },
  {
    accessorKey: "nominal",
    header: "Nilai",
    meta: { class: { th: "text-right", td: "text-right tabular-nums" } },
    cell: ({ row }) => formatPemindahbukuanValue(row.original),
  },
  { accessorKey: "statusApproved", header: "Status" },
  { accessorKey: "creatorName", header: "Diajukan Oleh" },
  {
    accessorKey: "approverName",
    header: "Diproses Oleh",
    cell: ({ row }) => row.original.approverName || "—",
  },
];
