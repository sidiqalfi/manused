# Manused

**Manunggal Sedyo** — aplikasi pengelolaan keuangan dan kegiatan organisasi pemuda-pemudi desa. Manused menyatukan buku kas, dana sosial, arisan per rumah, data anggota, dan administrasi kegiatan dalam satu dashboard.

Antarmuka menggunakan Bahasa Indonesia dengan format rupiah (`id-ID`). Pengurus mencatat transaksi melalui akun mereka, sementara tamu dapat melihat dashboard dan laporan melalui akses baca.

## Fitur

| Modul | Kemampuan |
| --- | --- |
| Dashboard | Ringkasan saldo kas, sosial, dana save arisan, jumlah anggota, grafik tahunan, dan kalender kegiatan. |
| Kas | Periode bulanan, nominal iuran dan batas minimal, pembayaran per anggota atau sekaligus, sumbangan dan pemasukan lain, pengeluaran, saldo awal, serta rekap tahunan. |
| Sosial | Iuran sukarela dengan nominal minimal, pencatatan sekaligus untuk beberapa anggota, sumbangan dan pemasukan lain, pengeluaran, saldo awal, serta rekap tahunan. |
| Arisan | Iuran per rumah, kocokan acak dengan pratinjau atau pencatatan pemenang manual, siklus pemenang, pembatalan kocokan, riwayat, dan dana save. |
| Kegiatan | Jadwal dan status kegiatan, peserta hadir atau hanya patungan, nominal iuran per peserta, pembayaran bertahap, pengeluaran, serta subsidi dari kas. Detail kegiatan memiliki URL berbasis slug. |
| Anggota | Biodata, status aktif, tanggal bergabung, pengelompokan rumah, jabatan kepengurusan, dan riwayat jabatan. |
| Log aktivitas | Riwayat perubahan dan aktivitas autentikasi, detail sebelum/sesudah bila tersedia, serta filter pelaku, aksi, entitas, dan tanggal. |
| Pengguna | Pembuatan akun, perubahan nama/email dan hak akses, reset password, aktivasi/nonaktivasi, serta penghapusan akun lain oleh administrator. |
| Profil dan pengaturan | Pembaruan nama profil, perubahan password, serta saldo awal kas, sosial, dan arisan. |

Halaman kas, sosial, dan arisan menyediakan matriks pembayaran serta perhitungan tunggakan. Ekspor CSV/JSON dengan pilihan kolom tersedia untuk kas, sosial, arisan, anggota, peserta kegiatan, dan log aktivitas.

### Aturan arisan

- **Satu rumah = satu slot.** Pembayaran dan kemenangan dicatat atas nama kepala rumah; anggota serumah mengikuti slot tersebut.
- Rumah yang masih memiliki anggota aktif dapat ikut kocokan, termasuk bila kepala rumah berstatus nonaktif.
- Kandidat kocokan acak harus sudah membayar pada periode terkait dan belum menang pada siklus berjalan. Siklus berikutnya dibuka ketika kandidat pada siklus tersebut habis.
- Dana save dihitung dari saldo awal + seluruh iuran masuk − pembayaran kepada pemenang dari kocokan yang tidak dibatalkan, termasuk iuran terlambat setelah kocokan.

### Akses pengguna

Pengurus masuk melalui `/signin` menggunakan email dan password. Hak akses akun disimpan dalam `User.role`:

| Hak akses | Kemampuan |
| --- | --- |
| `ADMIN` | Menggunakan fitur pengurus dan mengelola akun di `/dashboard/users`. |
| `USER` | Menggunakan fitur pengurus sesuai aturan akses dan kepemilikan data yang berlaku. |
| Tamu | Sesi virtual `guest` untuk akses baca, tanpa akun tersimpan di database. |

Jabatan organisasi seperti Ketua atau Bendahara disimpan melalui `Position` dan `MemberPositionAssignment`, terpisah dari hak akses akun. Administrator dapat menghapus akun lain setelah konfirmasi jika akun tersebut tidak lagi digunakan sebagai pembuat data anggota atau transaksi. Akun sendiri tidak dapat dihapus. Untuk akun yang masih terkait data, gunakan nonaktivasi agar riwayat tetap tersimpan. Minimal satu administrator aktif harus tetap tersedia.

Pengunjung tanpa sesi yang membuka `/dashboard/...` otomatis masuk sebagai tamu dan kembali ke halaman tujuan. Tamu mendapat tampilan baca dan tidak dapat melakukan perubahan data. Halaman anggota, log, profil, dan pengaturan mengalihkan tamu ke dashboard. Akses tamu ini perlu diperhitungkan saat menentukan data yang akan ditampilkan dalam aplikasi.

Perubahan password, email, hak akses, atau status akun melalui pengelolaan pengguna membatalkan sesi lama melalui `tokenVersion`. Akun nonaktif ditolak saat login dan validasi sesi. Perubahan password melalui Profil juga mengakhiri sesi aktif.

## Menjalankan secara lokal

### Prasyarat

- **Node.js 24 LTS** dan npm. Prisma yang digunakan mendukung Node.js `^20.19`, `^22.12`, atau `>=24.0`; test memerlukan dukungan `--experimental-test-module-mocks`.
- **PostgreSQL**, baik instance sendiri maupun melalui Docker Compose yang tersedia.
- **Docker dengan Compose** jika menggunakan database bawaan repository.

Jalankan perintah berikut dari direktori repository.

### 1. Instal dependensi dan siapkan environment

```bash
npm ci
cp .env.example .env
```

Sesuaikan `.env`. Untuk konfigurasi Docker Compose bawaan, gunakan user dan database `postgres`:

```dotenv
POSTGRES_PASSWORD=ganti_password_lokal
DATABASE_URL="postgresql://postgres:ganti_password_lokal@localhost:5432/postgres?schema=public"
AUTH_SECRET=isi_dengan_secret_acak
```

Contoh `DATABASE_URL` di `.env.example` masih memakai user/database placeholder. Ganti sesuai database yang digunakan dan pastikan password pada URL cocok dengan `POSTGRES_PASSWORD`. Karakter khusus dalam password harus di-URL-encode pada connection string.

Buat nilai `AUTH_SECRET`, lalu salin hasilnya ke `.env`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

| Variabel | Penggunaan |
| --- | --- |
| `DATABASE_URL` | Wajib untuk koneksi PostgreSQL oleh aplikasi dan Prisma CLI. |
| `AUTH_SECRET` | Wajib untuk autentikasi dan sesi Auth.js/NextAuth. |
| `POSTGRES_PASSWORD` | Wajib saat menjalankan PostgreSQL melalui Docker Compose bawaan; tidak diperlukan untuk instance eksternal. |

### 2. Jalankan database dan terapkan migrasi

Jika menggunakan Docker Compose:

```bash
npm run db:up
```

PostgreSQL tersedia di `localhost:5432` dan Adminer di [localhost:8080](http://localhost:8080). Pada Adminer, gunakan server `db`, user `postgres`, database `postgres`, serta password dari `.env`.

Setelah PostgreSQL siap menerima koneksi:

```bash
npx prisma migrate dev
npx prisma generate
```

Prisma Client dihasilkan ke `src/generated/prisma/` dan tidak disimpan di Git. Kode aplikasi menggunakan singleton dari `@/lib/prisma`; tipe model tersedia melalui `@/generated/prisma/client`.

### 3. Isi data demo

Untuk mencoba aplikasi dengan database pengembangan kosong:

```bash
npm run seed
```

Seed membuat akun pengurus demo, 40 anggota, enam jabatan beserta penugasannya, serta periode kas/sosial/arisan selama 12 bulan pada tahun berjalan dengan contoh transaksi dan kocokan. Seed belum menyediakan contoh kegiatan.

| Akun demo | Nilai |
| --- | --- |
| Email | `johndoe@gmail.com` |
| Password | `12345678` |

**Gunakan seed hanya untuk database demo.** Script menghapus data anggota, jabatan, kas, sosial, arisan, dan pengaturan sebelum mengisinya kembali, serta mengatur ulang password akun demo. Seed belum membersihkan relasi peserta/pembayaran kegiatan sehingga menjalankannya pada database yang sudah berisi kegiatan dapat gagal setelah sebagian data terhapus.

Untuk mengisi atau memperbarui enam jabatan default saja, tersedia `npm run seed:positions`.

### 4. Tetapkan administrator pertama

Migrasi mempertahankan akun lama sebagai `USER` aktif. Pilih akun yang sudah ada untuk menjadi administrator:

```bash
npm run admin:promote -- nama@example.com
```

Perintah ini mempertahankan password dan data transaksi serta meminta akun tersebut login ulang. Untuk database demo, gunakan email akun demo dari langkah sebelumnya. Akun berikutnya dapat dibuat dari menu **Kelola Pengguna**.

### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka [localhost:3000](http://localhost:3000), lalu masuk dengan akun demo atau pilih akses tamu.

Docker Compose saat ini menjalankan PostgreSQL dan Adminer saja; aplikasi Next.js dijalankan melalui npm. Compose belum mendefinisikan volume database secara eksplisit, jadi siapkan penyimpanan persisten dan backup jika dipakai untuk data yang perlu dipertahankan.

## Perintah pengembangan

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan Next.js. |
| `npm run build` | Menghasilkan Prisma Client, lalu membuat build produksi Next.js. |
| `npm start` | Menjalankan server produksi dari hasil build. |
| `npm run lint` | Memeriksa kode dengan ESLint dan konfigurasi Next.js. |
| `npm test` | Menjalankan test dengan `node:test` melalui `tsx`. |
| `npm run db:up` | Menjalankan PostgreSQL dan Adminer di latar belakang. |
| `npm run db:down` | Menghentikan dan menghapus container serta network Compose. |
| `npm run seed` | Mengisi ulang data demo; menghapus data yang disebutkan pada bagian seed. |
| `npm run seed:positions` | Melakukan upsert jabatan default tanpa menjalankan seed demo penuh. |
| `npm run admin:promote -- email` | Menetapkan akun aktif yang sudah ada sebagai administrator. |
| `npx prisma migrate dev` | Menerapkan migrasi lokal dan membuat migrasi untuk perubahan skema. |
| `npx prisma generate` | Menghasilkan Prisma Client dari skema saat ini. |
| `npx tsc --noEmit` | Memeriksa tipe TypeScript secara terpisah. |

Test menggunakan `node:assert/strict` dengan mock modul untuk dependensi seperti Prisma dan autentikasi. File test ditempatkan di dekat kode yang diuji, termasuk validasi input, server actions, logika kocokan, rumah tangga, tunggakan, akses tamu, profil, dan ekspor log.

Menjalankan satu file test:

```bash
npx tsx --experimental-test-module-mocks --test src/features/members/member-schemas.test.ts
```

## Stack dan struktur kode

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 16.2.12 App Router, React 19.2.4, TypeScript strict |
| Antarmuka | Tailwind CSS 4, shadcn/ui berbasis Base UI, Lucide |
| Data di client | TanStack Query 5 dan TanStack Table 8 |
| Grafik | Recharts 3 |
| Database | PostgreSQL, Prisma ORM 7, adapter `@prisma/adapter-pg` |
| Autentikasi | NextAuth 5 beta, credentials, bcryptjs, sesi JWT |
| Validasi dan test | Zod 4, `node:test`, `tsx` |

Kode dikelompokkan per fitur. Route di `src/app/` merangkai komponen dan aksi dari `src/features/`; server actions mengakses database melalui Prisma, sedangkan query options dan invalidasi cache client dikelola dengan TanStack Query.

```text
prisma/
  schema.prisma            # Model dan relasi database
  migrations/              # Riwayat migrasi PostgreSQL
  seed.ts                  # Data demo
  seed-positions.ts        # Entry point seed jabatan saja
  seed/positions.ts        # Definisi dan upsert jabatan default
src/
  app/                     # Route, layout, halaman, dan endpoint Auth.js
  features/
    auth/                  # Login, logout, sesi, dan akses tamu
    dashboard/             # Sidebar, ringkasan, dan provider query
    cash/                  # Buku kas
    sosial/                # Dana sosial
    arisan/                # Iuran, kocokan, dan dana save
    kegiatan/              # Jadwal, peserta, pembayaran, dan pengeluaran
    members/               # Biodata dan pengelompokan rumah
    positions/             # Jabatan dan riwayat kepengurusan
    log/                   # Pencatatan, pencarian, dan ekspor aktivitas
    profile/               # Profil akun dan password
    users/                 # Pengelolaan akun oleh administrator
  components/              # UI bersama, tabel pembayaran, dan grafik
  lib/                     # Prisma, format, ekspor, rate limit, dan tunggakan
  generated/prisma/        # Prisma Client hasil generate
  types/                   # Tipe tambahan sesi NextAuth
  proxy.ts                 # Penanganan sesi untuk route dashboard
```

Alias impor: `@/*` mengarah ke `src/*`, sedangkan `@features/*` mengarah ke `src/features/*`.

Model utama meliputi `User`, `Member`, `Position`, `MemberPositionAssignment`, kelompok `Cash*`, `Sosial*`, `Arisan*`, dan `Kegiatan*`, serta `AppSetting` dan `ActivityLog`. Transaksi menyimpan pembuat melalui `createdById`; log aktivitas menyimpan pelaku, aksi, entitas, dan snapshot perubahan bila tersedia. Lihat [skema database](prisma/schema.prisma) untuk detail relasi dan batasan data.

## Menjalankan di produksi

Aplikasi memerlukan runtime server Next.js untuk autentikasi, server actions, dan akses database. Siapkan PostgreSQL serta `DATABASE_URL` dan `AUTH_SECRET` pada environment deployment, lalu jalankan:

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
```

`npm run build` sudah menjalankan `prisma generate`, tetapi tidak menerapkan migrasi database. Jalankan lint dan test sebagai langkah pemeriksaan tersendiri. Pada instalasi yang sudah memiliki akun, tetapkan administrator pertama dengan `npm run admin:promote -- nama@example.com`. Gunakan akun pengurus yang disiapkan untuk produksi; seed demo menghapus data dan bukan langkah deployment.

Panduan runtime tersedia pada [dokumentasi deployment Next.js](https://nextjs.org/docs/app/getting-started/deploying).

## Dokumen terkait

- [docs/administrator-access.md](docs/administrator-access.md) — rancangan akses akun, migrasi jabatan, dan penyiapan administrator.
- [PRODUCT.md](PRODUCT.md) — konteks produk dan kebutuhan awal.
- [DESIGN.md](DESIGN.md) — arah visual dan panduan antarmuka.
- [AGENTS.md](AGENTS.md) — instruksi repository dan rujukan dokumentasi Next.js yang terpasang.
- [CLAUDE.md](CLAUDE.md) — panduan pengembangan tambahan dan konvensi commit.

Gunakan Conventional Commits dalam Bahasa Inggris, misalnya `docs(readme): update project setup guide`. Untuk perilaku dan konfigurasi terkini, cocokkan dokumentasi dengan kode sumber, [package.json](package.json), serta [prisma.config.ts](prisma.config.ts).
