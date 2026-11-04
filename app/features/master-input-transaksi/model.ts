import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";

const akunIdSchema = z
  .number()
  .optional()
  .pipe(z.number("Pilih akun").int().positive("Pilih akun"));

export const masterInputTransaksiSchema = z.object({
  nama: z.string("Nama wajib diisi").trim().min(1, "Nama wajib diisi"),
  akunDebitId: akunIdSchema,
  akunKreditId: akunIdSchema,
  isActive: z.boolean(),
});

export type MasterInputTransaksiSchema = z.output<typeof masterInputTransaksiSchema>;

export interface MasterInputTransaksi extends MasterInputTransaksiSchema {
  id: number;
  kodeAkunDebit: string;
  namaAkunDebit: string;
  kodeAkunKredit: string;
  namaAkunKredit: string;
}

export interface MasterInputTransaksiResponse {
  total: number;
  data: MasterInputTransaksi[];
}

export interface MasterInputAkun {
  id: number;
  kodeAkun: string;
  namaAkun: string;
  isActive: boolean;
}

export interface MasterInputAkunResponse {
  total: number;
  data: MasterInputAkun[];
}

export function initMasterInputTransaksiFormdata(template?: MasterInputTransaksi) {
  return {
    nama: template?.nama ?? "",
    akunDebitId: template?.akunDebitId,
    akunKreditId: template?.akunKreditId,
    isActive: template?.isActive ?? true,
  };
}

export function getMasterInputTransaksiChanges(
  data: MasterInputTransaksiSchema,
  template: MasterInputTransaksi,
) {
  const changes: Partial<MasterInputTransaksiSchema> = {};
  if (data.nama !== template.nama) changes.nama = data.nama;
  if (data.akunDebitId !== template.akunDebitId) changes.akunDebitId = data.akunDebitId;
  if (data.akunKreditId !== template.akunKreditId) changes.akunKreditId = data.akunKreditId;
  if (data.isActive !== template.isActive) changes.isActive = data.isActive;
  return changes;
}

export type StatusFilter = "all" | "active" | "inactive";

export const statusFilterOptions = [
  { label: "Semua status", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
];

export const masterInputTransaksiColumns: TableColumn<MasterInputTransaksi>[] = [
  { accessorKey: "nama", header: "Nama" },
  { accessorKey: "namaAkunDebit", header: "Akun Debit" },
  { accessorKey: "namaAkunKredit", header: "Akun Kredit" },
  { accessorKey: "isActive", header: "Status" },
];
