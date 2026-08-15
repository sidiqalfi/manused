---
name: Manused
description: Buku kas digital pemuda desa — iuran, pengeluaran, transparan untuk semua.
colors:
  primary: "oklch(0.508 0.118 165.612)"
  primary-foreground: "oklch(0.979 0.021 166.113)"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  destructive: "oklch(0.577 0.245 27.325)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  sidebar: "oklch(0.985 0 0)"
  sidebar-primary: "oklch(0.596 0.145 163.225)"
  sidebar-accent: "oklch(0.97 0 0)"
  sidebar-border: "oklch(0.922 0 0)"
typography:
  body:
    fontFamily: "Roboto, var(--font-sans), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Roboto, var(--font-sans), sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  label:
    fontFamily: "Roboto, var(--font-sans), sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1
  page-heading:
    fontFamily: "Roboto, var(--font-sans), sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  mono:
    fontFamily: "Geist Mono, var(--font-geist-mono), monospace"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  xs: "calc(0.45rem * 1.4)"   # xl
  sm: "calc(0.45rem * 1.8)"   # 2xl
  md: "calc(0.45rem * 2.2)"   # 3xl
  lg: "calc(0.45rem * 2.6)"   # 4xl — canonical pill/card radius
spacing:
  xs: "0.5rem"   # gap-2
  sm: "0.75rem"  # p-3
  md: "1rem"     # gap-4 / space-y-4
  lg: "1.5rem"   # p-6
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "2.25rem"
    padding: "0.75rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
  button-outline:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xs}"
    padding: "1.5rem"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2.25rem"
    padding: "0 0.75rem"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.125rem 0.5rem"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.125rem 0.5rem"
---

# Design System: Manused

## Overview

**Creative North Star: "Buku Kas Desa Modern"**

Manused tampak seperti buku kas desa yang dijaga rapi: lembar putih bersih, angka dan nama tersusun dalam tabel yang lega, dan satu warna hijau tegas yang menjadi tanda tangan — persis tinta hijau bendahara di buku kas asli. Sistem ini tenang dan terpercaya; tidak ada ornamen yang bersaing dengan angka, karena angka adalah isinya produk ini.

Kepadatan mengikuti konteks pakai: dashboard operasional untuk pengurus yang butuh memindai cepat (tabel padat, aksi jelas), dengan ruang napas cukup agar tetap enak dibaca di HP saat rapat. Permukaan hampir seluruhnya rata; hierarki dibangun dari tipografi, tone, dan garis tipis — bukan bayangan.

**Key Characteristics:**
- Putih kertas + hijau tinta bendahara sebagai satu-satunya aksen bermakna
- Sudut membulat lembut (radius dasar 0.45rem, tombol/kartu hingga ~1.17rem pill)
- Flat + tonal: kedalaman lewat tone (`muted`, `input/30`) dan `ring-foreground/5`, bukan shadow
- Roboto di semua peran (body/title/label) — familiar, netral, sangat terbaca di layar kecil
- Angka uang selalu berformat `Rp` + `toLocaleString("id-ID")`, never raw numbers

## Colors

Palet: hampir monokrom hangat dengan satu hijau berperan ganda sebagai identitas dan aksi.

### Primary
- **Ledger Green** (oklch(0.508 0.118 165.612)): hijau tinta bendahara. Tombol aksi utama, badge "Sudah Bayar", brand sidebar. Dipakai hemat — elemen hijau adalah tempat mata harus mendarat.
- **Ledger Green Ink** (oklch(0.979 0.021 166.113)): teks di atas Ledger Green.

### Neutral
- **Paper White** (oklch(1 0 0)): latar halaman dan kartu.
- **Ink Charcoal** (oklch(0.145 0 0)): teks utama; hampir hitam, bukan hitam pekat.
- **Faded Ink** (oklch(0.556 0 0)): teks sekunder/subjudul/placeholder.
- **Ledger Line** (oklch(0.922 0 0)): garis tabel dan border input — sama untuk `border` dan `input`.
- **Muted Sheet** (oklch(0.97 0 0)): isian tabel header, latar badge sekunder, permukaan non-aktif.
- **Sidebar Sheet** (oklch(0.985 0 0)): latar sidebar, sedikit lebih redup dari Paper White untuk memisahkan navigasi dari konten.

### Named Rules
**The One Ink Rule.** Ledger Green hanya untuk identitas dan aksi (tombol utama, status bayar, brand). Tidak untuk dekorasi, tidak dua-tiga elemen hijau berdesakan di satu area. Rarity-nya yang membuatnya berfungsi sebagai penanda.

**The Calm Money Rule.** Merah destructive (oklch(0.577 0.245 27.325)) hanya untuk konfirmasi penghapusan data dan teks error — uang yang keluar (pengeluaran) TIDAK diwarnai merah; ia tetap netral karena transaksi sah.

## Typography

**Body Font:** Roboto (sans-serif generik fallback)
**Label/Mono Font:** Geist Mono (monospace fallback) — untuk angka/identitas teknis bila perlu

**Character:** Roboto tunggal di semua peran — bukan pilihan yang mencari perhatian, tapi justru itu intinya: aplikasi kas yang tepercaya tidak butuh tipografi ekspresif, butuh angka dan nama yang tidak mungkin salah baca.

### Hierarchy
- **Page Heading** (Roboto 700, 1.5rem, 1.2): judul halaman ("Kas", "Anggota") dengan subjudul Faded Ink di bawahnya.
- **Title** (Roboto 600, 1.125rem): judul seksi tabel ("Iuran Anggota", "Pengeluaran").
- **Body** (Roboto 400, 0.875rem, 1.5): isi tabel, teks dialog, default UI.
- **Label** (Roboto 500, 0.8125rem, 1): label form dan teks kecil UI; uppercase tidak dipakai.
- **Angka uang** (Roboto, sama seperti konteksnya): selalu `Rp 1.234.567` via `toLocaleString("id-ID")`.

### Named Rules
**The Ledger Line Rule.** Baris tabel = satu fakta keuangan. Font size seragam dalam tabel (0.875rem); hierarki dalam tabel dibangun kolom (label kolom medium, isi regular), bukan ukuran campuran.

## Layout

- Dashboard: sidebar kiri collapse-ke-ikon (16rem / 3rem icon) + area konten `SidebarInset` dengan header 4rem (trigger + breadcrumb). Mobile: sidebar jadi sheet.
- Konten halaman: tumpukan vertikal `space-y-4` (1rem), header halaman = judul kiri + aksi kanan (`justify-between`), tanpa container max-width — dashboard melebar penuh.
- Kartu ringkasan: grid 3 kolom di md+, stack di mobile.
- Tabel: lebar penuh dalam `rounded-md border`, sel `p-3`, header `bg-muted/50`.
- Radius dasar token: `--radius: 0.45rem`; seluruh scale diturunkan darinya (sm 0.6× … 4xl 2.6×).

## Elevation & Depth

**Flat + tonal.** Tidak ada shadow pada kartu, tombol, atau baris tabel di keadaan istirahat. Kedalaman dan pemisahan dibangun dari: (1) perbedaan tone — `muted/50`, `input/30`, `secondary`; (2) garis tipis `ring-foreground/5` / border `Ledger Line`. Shadow `shadow-2xl` hanya muncul pada permukaan yang benar-benar melayang di atas halaman: dropdown menu, select popup, tooltip — dan tetap digabung `ring-1 ring-foreground/5` agar tepinya tegas.

### Named Rules
**The Floating-Only Rule.** Shadow (shadow-2xl) adalah penanda "permukaan ini melayang di atas konten" — menu, popup, dialog overlay. Kartu dan tombol yang menempel di halaman tidak pernah ber-shadow.

## Shapes

Bahasa bentuk: membulat lembut dan konsisten. Radius dasar 0.45rem dengan scale turunan; tombol, input, badge, dan tabs memakai radius terbesar (4xl ≈ 1.17rem — nyaris pill, memberi kesan ramah); kartu pakai 2xl (≈0.81rem); tabel container xl (≈0.63rem). Border 1px, tidak pernah tebal. Tidak ada sudut tajam penuh di elemen interaktif.

## Components

### Buttons
- **Shape:** sangat membulat (4xl ≈ 1.17rem, nyaris pill)
- **Primary:** Ledger Green + teks hijau-tinta; tinggi 2.25rem, px-3
- **Hover:** `bg-primary/80` — meng redup, bukan menggelap; transisi `all` cepat
- **Secondary/Outline/Ghost:** tone abu (secondary muted-violet, outline `input/30` + border, ghost transparan + hover `bg-muted`)
- **Destructive:** latar `destructive/10` + teks merah — bukan blok merah pekat
- **Icon buttons:** `size-9`, ikon Lucide 16px

### Chips
- **Badge default:** Ledger Green solid — khusus status "Sudah Bayar"
- **Badge outline:** border tipis, transparan — daftar anggota belum bayar
- **Badge secondary:** Muted Sheet — gender "Perempuan"

### Cards / Containers
- **Corner Style:** 2xl (≈0.81rem)
- **Background:** Paper White; pemisah via `ring-1 ring-foreground/10` (bukan shadow)
- **Internal Padding:** 1.5rem (--card-spacing), header/konten sejajar padding sama
- **Card title:** 1rem medium; nilai uang 1.5rem bold di bawahnya

### Inputs / Fields
- **Style:** latar `input/30` + border Ledger Line, radius 4xl pill, tinggi 2.25rem
- **Focus:** border berubah ke `ring` + halo 3px `ring-ring/50` — satu-satunya "glow" di sistem
- **Error:** border + halo merah (`destructive/20`); teks error `text-sm text-destructive`
- **Select native** (periode, anggota, bulan): `<select>` polos dengan styling border sama — sengaja, demi keandalan di HP

### Navigation
- **Sidebar:** Sidebar Sheet, grup "Main" + "Secondary", item aktif `bg-sidebar-accent`; toggle Ctrl+B; header brand ikon Terminal hijau + "Manused / Manunggal Sedyo"
- **Breadcrumb:** dari pathname otomatis, kapitalisasi, separator tersembunyi di mobile

### Tabel Kas (signature)
Tabel HTML polos dalam container ber-border — bukan TanStack Table visual — dengan kolom: anggota, badge status, nominal (kanan), tanggal (`id-ID`), catatan muted, aksi ikon sampah. Di bawah tabel iuran: rangkaian badge outline "Belum bayar (N anggota)". Pola "tabel bermakna + rekap badge" ini adalah signature Manused dan harus dipertahankan di surface baru.

## Do's and Don'ts

### Do:
- **Do** format semua uang sebagai `Rp ${amount.toLocaleString("id-ID")}` — tidak pernah angka polos.
- **Do** tulis seluruh copy UI dalam bahasa Indonesia ("Catat Pembayaran", "Batas Bawah", "Belum bayar").
- **Do** pakai Ledger Green hemat: satu titik hijau fokus per area layar.
- **Do** buat target sentuh ≥ 2.25rem (h-9) — dipakai sambil berdiri di lapangan.
- **Do** gunakan `ring-foreground/5` untuk memisahkan permukaan sebelum memikirkan shadow.
- **Do** sediakan state kosong ber-teks Indonesia ("Belum ada pembayaran tercatat"), bukan ruang kosong.

### Don't:
- **Don't** beri shadow pada kartu/tombol di halaman — shadow hanya untuk popover/menu/dialog (The Floating-Only Rule).
- **Don't** warnai pengeluaran dengan merah — merah hanya error/hapus (The Calm Money Rule).
- **Don't** tambahkan warna aksen baru di luar palet token; dark mode sudah didefinisikan dan selalu pakai token, bukan warna literal.
- **Don't** pakai ukuran font campuran dalam satu tabel (The Ledger Line Rule).
- **Don't** ganti `<select>` native dengan custom picker untuk form lapangan — keandalan mobile menang.
