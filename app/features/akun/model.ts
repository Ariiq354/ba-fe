import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";

export const akunSchema = z.object({
  kodeAkun: z.string("Kode akun wajib diisi").trim().min(1, "Kode akun wajib diisi"),
  namaAkun: z.string("Nama akun wajib diisi").trim().min(1, "Nama akun wajib diisi"),
  kategori: z.enum(["aktiva", "pasiva", "pendapatan", "biaya"]),
  normalBalance: z.enum(["debit", "kredit"]),
  isActive: z.boolean(),
});

export type AkunSchema = z.output<typeof akunSchema>;
export type Akun = AkunSchema & { id: string };
export type KategoriFilter = "all" | AkunSchema["kategori"];

export interface AkunResponse {
  total: string;
  data: Akun[];
}

export const initAkunFormdata: AkunSchema = {
  kodeAkun: "",
  namaAkun: "",
  kategori: "aktiva",
  normalBalance: "debit",
  isActive: true,
};

export const kategoriOptions = [
  { label: "Aktiva", value: "aktiva" },
  { label: "Pasiva", value: "pasiva" },
  { label: "Pendapatan", value: "pendapatan" },
  { label: "Biaya", value: "biaya" },
];

export const kategoriFilterOptions = [
  { label: "Semua kategori", value: "all" },
  ...kategoriOptions,
];

export const normalBalanceOptions = [
  { label: "Debit", value: "debit" },
  { label: "Kredit", value: "kredit" },
];

export const akunColumns: TableColumn<Akun>[] = [
  { accessorKey: "kodeAkun", header: "Kode Akun" },
  { accessorKey: "namaAkun", header: "Nama Akun" },
  { accessorKey: "kategori", header: "Kategori" },
  { accessorKey: "normalBalance", header: "Saldo Normal" },
  { accessorKey: "isActive", header: "Status" },
];
