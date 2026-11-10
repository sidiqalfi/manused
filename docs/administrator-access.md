# Administrator dan jabatan organisasi

Hak akses akun disimpan di `User.role` (`ADMIN` atau `USER`) dan status akun
di `User.isActive`. Tamu tetap merupakan sesi virtual. Jabatan organisasi
disimpan terpisah melalui `Position` dan `MemberPositionAssignment`.

## Keputusan implementasi

- Migrasi mengubah nama tabel, kolom, indeks, dan constraint jabatan di tempat;
  data dan ID lama dipertahankan. Akun lama menjadi `USER` aktif.
- Halaman `/dashboard/users` tersedia untuk administrator aktif. Setiap read
  dan mutation memeriksa izin dari database, termasuk versi sesi.
- Administrator dapat membuat akun, mengubah nama/email/hak akses, mengganti
  password, mengaktifkan/menonaktifkan akun, dan menghapus akun lain.
- Penghapusan permanen membutuhkan konfirmasi. Akun sendiri dan administrator
  aktif terakhir dilindungi. Relasi pembuat data menolak penghapusan akun yang
  masih digunakan oleh anggota, periode, atau transaksi; nonaktifkan akun tersebut
  untuk menghentikan aksesnya. Data terkait tidak dihapus atau dipindahkan.
- Penghapusan akun membatalkan sesi pada validasi berikutnya. Log aktivitas lama
  tetap tersimpan dengan identitas pelaku, dan penghapusan dicatat sebagai `DELETE`.
- Perubahan hak akses, email, status, atau password menaikkan `tokenVersion`.
  Login menolak akun nonaktif; validasi sesi menolak versi token lama.
- Transaksi serializable melindungi administrator aktif terakhir dan
  memeriksa ulang izin pelaku sebelum mengubah akun. Konflik transaksi
  meminta pengguna mengulangi tindakan.
- Pencatatan audit pengelolaan pengguna bersifat atomik dengan perubahan akun.
  Data yang dikirim ke browser dan log tidak menyertakan hash password.
- Hak akses administrator tidak mengubah aturan kepemilikan transaksi keuangan.

## Penyiapan administrator

Terapkan migrasi dan generate client, lalu promosikan akun yang sudah ada:

```bash
npx prisma migrate deploy
npx prisma generate
npm run admin:promote -- nama@example.com
```

Perintah promosi hanya berlaku untuk akun aktif yang sudah ada, tidak
menjalankan seed, dan mencatat perubahan hak akses. Sesudah promosi, login
ulang. Akun baru berikutnya dibuat dari halaman Kelola Pengguna.

## Verifikasi

Uji mencakup penolakan akses user/tamu, akun nonaktif dan sesi kedaluwarsa,
payload tidak valid, email duplikat, pencabutan sesi, snapshot audit aman,
perlindungan administrator terakhir, penghapusan akun, penolakan akun yang masih
dipakai data lain, rollback bila audit gagal, serta migrasi jabatan tanpa kehilangan data.

Jalankan test biasa dengan `npm test`. Pengujian integrasi dilewati sampai
`TEST_DATABASE_URL` diisi dengan koneksi PostgreSQL khusus pengujian:

```bash
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/manused_test" npm test
```

Pengujian integrasi membuat schema sementara, menerapkan migrasi dan fixture,
lalu menghapus schema tersebut setelah selesai. Gunakan database uji terpisah.
