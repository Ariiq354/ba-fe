import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";

export const penggunaSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  idKelompok: z.number().int(),
  namaKelompok: z.string(),
  kodeKelompok: z.string(),
  noAnggota: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const penggunaResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  data: z.array(penggunaSchema),
});

export const statusFilterSchema = z.enum(["all", "pending", "verified"]);
export const verifikasiPenggunaResponseSchema = z.object({
  noAnggota: z.string().min(1),
});

export type Pengguna = z.output<typeof penggunaSchema>;
export type PenggunaResponse = z.output<typeof penggunaResponseSchema>;
export type StatusPenggunaFilter = z.output<typeof statusFilterSchema>;
export type VerifikasiPenggunaResponse = z.output<typeof verifikasiPenggunaResponseSchema>;

export const statusFilterOptions = [
  { label: "Semua status", value: "all" },
  { label: "Menunggu verifikasi", value: "pending" },
  { label: "Terverifikasi", value: "verified" },
];

// Match the backend's verification marker; other bans cannot be verified.
const pendingVerificationBanReason = "Pengguna belum terverifikasi";

export function getPenggunaStatus(pengguna: Pick<Pengguna, "banned" | "banReason">) {
  if (pengguna.banned !== true)
    return "verified";
  return pengguna.banReason === pendingVerificationBanReason ? "pending" : "banned";
}

export function isPenggunaPj(pengguna: Pick<Pengguna, "role">) {
  return pengguna.role?.split(",").some(role => role.trim() === "pj") ?? false;
}

export function canSetPenggunaPj(pengguna: Pick<Pengguna, "role" | "banned" | "noAnggota">) {
  const isAdmin = pengguna.role?.split(",").some(role => role.trim() === "admin") ?? false;
  return !isAdmin && pengguna.banned !== true && !!pengguna.noAnggota;
}

export const statusPenggunaLabels = {
  pending: { label: "Menunggu verifikasi", color: "warning" },
  verified: { label: "Terverifikasi", color: "success" },
  banned: { label: "Diblokir", color: "error" },
} as const;

const roleLabels: Record<string, string> = {
  admin: "Admin",
  user: "Anggota",
  pj: "PJ Kelompok",
  wanhat: "Wanhat",
};

export function formatPenggunaRole(role: string | null) {
  if (!role)
    return "Anggota";
  return role.split(",").map(value => roleLabels[value.trim()] ?? value.trim()).join(", ");
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export const penggunaColumns: TableColumn<Pengguna>[] = [
  { accessorKey: "name", header: "Pengguna" },
  { accessorKey: "noAnggota", header: "Nomor Anggota", cell: ({ row }) => row.original.noAnggota || "—" },
  { id: "kelompok", header: "Kelompok" },
  { accessorKey: "role", header: "Role", cell: ({ row }) => formatPenggunaRole(row.original.role) },
  { id: "status", header: "Status" },
  { accessorKey: "createdAt", header: "Tanggal Daftar", cell: ({ row }) => dateFormatter.format(new Date(row.original.createdAt)) },
  { id: "pengelolaan", header: "Aksi" },
];
