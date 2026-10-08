import type { TableColumn } from "@nuxt/ui";
import { z } from "zod";

export const rolePenggunaSchema = z.enum(["admin", "user", "pj", "wanhat"]);

export const penggunaSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  image: z.string(),
  noHp: z.string(),
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
export type RolePengguna = z.output<typeof rolePenggunaSchema>;
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

export function canChangePenggunaRole(pengguna: Pick<Pengguna, "banned" | "noAnggota">, role: RolePengguna) {
  return pengguna.banned !== true && (role !== "pj" || !!pengguna.noAnggota);
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

export const rolePenggunaOptions = rolePenggunaSchema.options.map(value => ({
  label: roleLabels[value],
  value,
}));

export function formatPenggunaRole(role: string | null) {
  if (!role)
    return "Anggota";
  return roleLabels[role] ?? role;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export function formatPenggunaDate(date: string) {
  return dateFormatter.format(new Date(date));
}

export const penggunaColumns: TableColumn<Pengguna>[] = [
  { accessorKey: "name", header: "Pengguna" },
  { accessorKey: "noAnggota", header: "Nomor Anggota", cell: ({ row }) => row.original.noAnggota || "—" },
  { id: "kelompok", header: "Kelompok" },
  { accessorKey: "role", header: "Role", cell: ({ row }) => formatPenggunaRole(row.original.role) },
  { id: "status", header: "Status" },
  { accessorKey: "createdAt", header: "Tanggal Daftar", cell: ({ row }) => formatPenggunaDate(row.original.createdAt) },
  { id: "pengelolaan", header: "Aksi" },
];
