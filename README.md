# Manused (Manunggal Sedyo)

Buku kas digital untuk organisasi pemuda-pemudi desa. Mencatat iuran anggota, pengeluaran, iuran sosial bulanan, dan arisan (kocokan) dengan cepat — satu sumber data yang akurat, transparan, dan terlacak.

## Fitur

- **Kas bulanan** — periode kas (iuran + batas bawah per bulan), pencatatan & penghapusan pembayaran iuran anggota, pencatatan & penghapusan pengeluaran, ringkasan kas (total masuk/keluar/saldo, termasuk saldo awal), serta rekap tahunan per bulan (grafik).
- **Sosial** — iuran sukarela per anggota dengan nominal minimal, pengeluaran sosial, ringkasan dan rekap tahunan, plus saldo awal. Mirip kas, dengan catatan tambahan per anggota.
- **Arisan** — iuran arisan flat per periode, kocokan bulanan dengan preview kandidat (eligible = aktif & belum pernah menang), riwayat kocokan (termasuk void/batal), dana save berjalan dengan saldo awal, dan payout ke pemenang.
- **Anggota** — CRUD anggota pemuda (nama, nama lengkap, gender, tanggal lahir, dusun, RT/RW, telepon, status aktif) plus role kepengurusan (Ketua, Wakil, Bendahara, Sekretaris, Humas, Anggota) dengan riwayat jabatan.
- **Pengaturan** — saldo awal dana kas, sosial, dan dana save arisan (tersimpan sebagai AppSetting key-value).
- **Dashboard pengurus** — ringkasan saldo kas/sosial/arisan + total anggota, grafik arus tahunan per buku (Kas, Sosial, Arisan), caption saldo awal, aksi cepat per buku, sidebar navigasi.
- Semua copy antarmuka dalam **Bahasa Indonesia**; angka uang selalu berformat `Rp` (locale `id-ID`).

## Tech Stack

- [Next.js 16](https://nextjs.org) App Router + React 19, TypeScript (strict)
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives — **bukan** Radix)
- [Prisma 7](https://www.prisma.io) + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- [NextAuth v5](https://authjs.dev) (credentials, bcryptjs)
- [TanStack Query v5](https://tanstack.com/query) untuk client-side fetching
- [Recharts 3](https://recharts.org) untuk grafik rekap tahunan
- Zod v4 untuk validasi input

## Persiapan Awal

Prasyarat: Node.js, dan PostgreSQL (bisa via Docker).

1. **Salin environment variables**

   ```bash
   cp .env.example .env
   ```

   Isi `.env`:
   - `POSTGRES_PASSWORD` — password database (dipakai docker compose)
   - `DATABASE_URL` — koneksi PostgreSQL, format `postgresql://user:password@localhost:5432/db?schema=public`
   - `AUTH_SECRET` — secret NextAuth; generate dengan `npx auth secret`

2. **Jalankan database** (Postgres + Adminer)

   ```bash
   npm run db:up
   ```

3. **Terapkan skema & generate Prisma client**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

   > Prisma client di-generate ke `src/generated/prisma` — impor dari `@/lib/prisma`, jangan pernah dari `@prisma/client`.

4. **Isi data seed (opsional)**

   ```bash
   npx prisma db seed
   ```

   Seed berisi: 1 akun pengurus, 40 anggota lengkap dengan role kepengurusan, 6 role default (Ketua, Wakil Ketua, Bendahara, Sekretaris, Humas, Anggota), periode kas/sosial/arisan 12 bulan tahun berjalan beserta iuran, pengeluaran, dan riwayat kocokan arisan.

5. **Jalankan dev server**

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000).

## Script

| Command | Keterangan |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm test` | Semua test (`node:test` via `tsx`) |
| `npm run db:up` / `npm run db:down` | Start/stop docker compose (Postgres + Adminer) |
| `npx tsc --noEmit` | Type check (build tidak menjalankan tsc) |

Menjalankan satu file test:

```bash
npx tsx --experimental-test-module-mocks --test src/features/members/member-schemas.test.ts
```

## Struktur Proyek

Feature-sliced layout — `src/features/<feature>/{actions,components,dialogs}` dengan route tipis di `src/app/` yang merangkai feature.

```
src/
  app/                     # route App Router (dashboard, dashboard/cash|sosial|arisan|members|settings, signin)
  features/
    auth/                  # konfigurasi NextAuth (lib/auth.ts), aksi & form login
    cash/                  # periode kas, pembayaran iuran, pengeluaran, saldo awal, ringkasan & rekap tahunan
    sosial/                # iuran sukarela (min. nominal), pengeluaran, saldo awal, ringkasan & rekap tahunan
    arisan/                # iuran arisan, kocokan (draw-logic), dana save, riwayat & rekap tahunan
    members/               # CRUD anggota
    roles/                 # role kepengurusan + assignment (riwayat jabatan)
    dashboard/             # shell dashboard (sidebar, breadcrumb, QueryProvider)
  components/              # komponen UI global (ui/, period-selector, summary-stat-cards, grafik tahunan)
  generated/prisma/        # Prisma client (hasil generate)
  lib/                     # prisma singleton, format (formatCurrency/formatDate), months
```

Path alias: `@/*` → `src/*` dan `@features/*` → `src/features/*`.

## Database

Model inti di `prisma/schema.prisma`:

- `User` — akun pengurus (NextAuth credentials)
- `Member` — anggota pemuda (gender, dusun, RT/RW, status aktif)
- `Role` — role kepengurusan (nama + urutan rank, unik)
- `MemberRoleAssignment` — jabatan anggota dengan `startDate`/`endDate` (null = masih menjabat) sehingga riwayat kepengurusan tersimpan
- `CashPeriod` / `CashIncome` / `CashExpense` — kas bulanan (iuran + batas bawah, pembayaran unik per anggota per periode, pengeluaran)
- `SosialPeriod` / `SosialIncome` / `SosialExpense` — iuran sosial sukarela dengan nominal minimal, kontribusi unik per anggota per periode, pengeluaran
- `ArisanPeriod` / `ArisanIncome` / `ArisanDraw` — arisan: iuran flat per periode, pembayaran unik per anggota per periode, kocokan dengan pemenang, jumlah terkumpul, payout, saldo save, dan status void
- `AppSetting` — key-value store untuk saldo awal (`cash.initialBalance`, `sosial.initialBalance`, `arisan.initialSave`)

Setiap catatan menyimpan `createdById` (siapa yang mencatat) untuk jejak audit.

## Testing

`node:test` + `node:assert/strict` via `tsx` dengan `--experimental-test-module-mocks`. Dependensi (Prisma, auth) di-mock menggunakan `mock.module()` di awal file test sebelum mengimpor aksi yang diuji. Test ditempatkan di samping feature-nya (mis. `src/features/members/member-actions.test.ts`).

```bash
npm test
```

## Konvensi Commit

Proyek ini memakai [Conventional Commits](https://www.conventionalcommits.org) dalam Bahasa Inggris — lihat `CLAUDE.md` untuk detailnya.
