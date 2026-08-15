# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Pengurus pemuda desa (internal, ter-autentikasi)** — beberapa pengurus, bukan hanya bendahara, masing-masing punya akun dan sama-sama mencatat. Nanti ada fitur lain yang menyangkut peran pengurus lain.
- **Publik (tanpa login)** — anggota dan warga melihat data kas read-only di route `/` (root). Dashboard `/dashboard/*` hanya untuk pengurus.

## Product Purpose

Manused (Manunggal Sedyo) mencatat iuran dan pengeluaran kas bulanan organisasi pemuda-pemudi desa: anggota, periode kas, pembayaran iuran per anggota per periode, dan pengeluaran. Sukses = pencatatan kas berjalan akurat dan transparan — pengurus mencatat dengan cepat, publik bisa melihat rekap tanpa minta-minta data.

## Positioning

Buku kas digital sederhana untuk organisasi desa: satu sumber data iuran/pengeluaran yang dipublikasikan sendiri ke anggota, bukan spreadsheet di HP bendahara yang harus dikirim manual.

## Operating Context

- Pencatatan terjadi dua-duanya: di HP saat/waktu kegiatan (rapat, iuran bulanan), dan rekap di laptop. UI harus nyaman di layar kecil dan besar.
- Semua copy antarmuka dalam bahasa Indonesia.
- Login kredensial email+password (NextAuth); sesi JWT 24 jam.
- Data sensitif uang kas desa — akurasi angka dan jejak siapa yang mencatat (createdById) penting.

## Capabilities and Constraints

- **Ada sekarang:** CRUD anggota (dengan RT/RW 3 digit, dusun), periode kas bulanan (iuran + batas bawah per periode, unik per bulan-tahun), catat/hapus pembayaran iuran (satu per anggota per periode; nominal ≥ batas bawah), catat/hapus pengeluaran, ringkasan kas (total masuk/keluar/saldo), halaman dashboard dengan sidebar.
- **Direncanakan:** publikasi semua data kas read-only ke route `/`; export PDF (rekap); fitur lain untuk peran pengurus lain (belum dispesifikkan).
- **Constraint teknis:** Next.js 16 App Router, React 19, Prisma + PostgreSQL (driver adapter), TanStack Query untuk client fetching, server actions dengan result `{ success, data?, error? }`, shadcn/ui di atas Base UI.
- **Belum ditentukan:** skema peran/hak akses antar pengurus (saat ini semua pengurus setara).

## Evidence on Hand

- Skema data lengkap dan stabil di `prisma/schema.prisma` (User, Member, CashPeriod, CashIncome, CashExpense).
- Seed data realistis 10 anggota di `prisma/seed.ts`.
- UI dashboard internal sudah jalan (kas + anggota). Route `/` masih placeholder "hello world" — halaman publik belum dibangun; jangan mengarang konten publik sebelum user memberi copy/data.
- Nama brand: "Manused" / "Manunggal Sedyo" (dipakai di sidebar).

## Product Principles

1. **Cepat dicatat** — pencatatan iuran/pengeluaran dalam hitungan detik, minim langkah, nyaman di HP saat kegiatan berlangsung.
2. **Transparan by default** — data kas milik anggota; publikasi ke route `/` adalah tujuan produk, bukan fitur tambahan.
3. **Akurat & terlacak** — setiap catatan tahu siapa pencatatnya; validasi ketat (zod) di semua input; angka tidak pernah boleh salah tampil.
4. **Sederhana untuk pengurus desa** — tanpa jargon keuangan; istilah sehari-hari (iuran, batas bawah, dusun, RT/RW); bahasa Indonesia penuh.
5. **Satu sumber kebenaran** — rekap publik dan dashboard internal membaca data yang sama, tidak ada jalur input ganda.

## Accessibility & Inclusion

Pengguna lintas usia pengurus pemuda; kontras dan ukuran target sentuh layak dipakai di HP lapangan. Belum ada standar a11y spesifik yang diwajibkan.
