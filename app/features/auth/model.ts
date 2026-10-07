import { z } from "zod";

export const loginSchema = z.object({
  username: z.string("Username wajib diisi").min(1, "Username wajib diisi"),
  password: z.string("Password wajib diisi").min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean(),
});

export type LoginSchema = z.output<typeof loginSchema>;

export const initLoginFormdata: Partial<LoginSchema> = {
  username: undefined,
  password: undefined,
  rememberMe: false,
};

export const registerSchema = z.object({
  image: z.file("Foto profil wajib diisi")
    .min(1, "Foto profil tidak boleh kosong")
    .max(5 * 1024 * 1024, "Ukuran foto profil maksimal 5MB")
    .mime(["image/png", "image/jpeg", "image/jpg", "image/webp"], "Format foto profil harus JPG, PNG, atau WebP"),
  name: z.string("Nama wajib diisi").min(1, "Nama wajib diisi"),
  noHp: z.string("Nomor HP wajib diisi").trim().min(1, "Nomor HP wajib diisi"),
  username: z.string("Username wajib diisi").min(1, "Username wajib diisi"),
  password: z.string("Password wajib diisi").min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string("Konfirmasi password wajib diisi").min(8, "Konfirmasi password minimal 8 karakter"),
  idKelompok: z.number("Silahkan pilih kelompok"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

export const initRegisterFormdata: Partial<RegisterSchema> = {
  image: undefined,
  name: undefined,
  noHp: undefined,
  username: undefined,
  password: undefined,
  confirmPassword: undefined,
  idKelompok: undefined,
};

export type RegisterSchema = z.infer<typeof registerSchema>;
