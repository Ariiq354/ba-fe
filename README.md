# BA Frontend

Frontend Nuxt SPA (`ssr: false`) yang di-deploy sebagai website statis di
Cloudflare Workers Static Assets. API dan gambar mengacu pada URL di
`app/constants.ts`.

## Development

Gunakan Node.js 22 dan Bun 1.4.2.

```bash
bun install --frozen-lockfile
bun run dev
```

Development server tersedia di `http://localhost:3000`.

## Build dan preview statis

```bash
bun run generate
bun run preview:cloudflare
```

Output statis ada di `.output/public`. Preview Cloudflare lokal tersedia di
`http://localhost:8787`.

`wrangler.jsonc` mengatur direktori output dan fallback SPA ke `index.html`,
sehingga URL halaman bisa dibuka langsung atau di-refresh. Header HTTP ada di
`public/_headers`; cache immutable hanya diterapkan pada aset build `/_nuxt/`.

## Deploy ke Cloudflare dari Git

Hubungkan repository ini melalui dashboard **Workers & Pages → Create
application → Import a repository**, lalu isi:

| Pengaturan            | Nilai                      |
| --------------------- | -------------------------- |
| Worker name           | `ba-fe`                    |
| Production branch     | Branch produksi repository |
| Build command         | `bun run generate`         |
| Deploy command        | `bun run deploy`           |
| Preview command       | `bun run deploy:preview`   |
| Path / Root directory | `/`                        |
| API token             | `Create new token`         |

Jika nama Worker berbeda, sesuaikan `name` di `wrangler.jsonc`. Preview builds
bisa diaktifkan untuk branch lain; `deploy:preview` mengunggah versi preview
tanpa mempromosikannya ke produksi.

Pada pengaturan build, set `NODE_VERSION=22` dan `BUN_VERSION=1.4.2`.
Cloudflare menginstal dependencies sebelum menjalankan build command.

## Deploy dari lokal

Login Cloudflare sekali sebelum deployment pertama:

```bash
bunx wrangler login
```

Build lalu deploy:

```bash
bun run generate
bun run deploy
```

Untuk validasi konfigurasi tanpa upload:

```bash
bun run deploy --dry-run
```

## Domain dan autentikasi

Tambahkan domain frontend melalui pengaturan **Domains & Routes** Worker.
Jika domain frontend berubah, sesuaikan CORS dan `trustedOrigins` Better Auth
di backend. Request frontend memakai `credentials: "include"`; gunakan domain
frontend di bawah `ubberkahamanah.my.id` untuk pengujian login dengan API saat
ini agar tetap same-site. Preview `workers.dev` berbeda site dengan domain API.

Sebelum memindahkan domain produksi, cek login, refresh URL halaman, request API,
upload, dan gambar pada deployment baru.
