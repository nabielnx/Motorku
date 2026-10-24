# Supplier

Menu Supplier tersedia untuk owner di bagian Manajemen. Laporan Keuangan berada tepat di bawah Dashboard di bagian Utama.

Modul ini mengelola nama supplier (wajib), nama kontak, telepon/WhatsApp, email, alamat, dan catatan. Belum ada hubungan supplier dengan produk, pembelian, atau mutasi stok. Mengubah supplier tidak mengubah stok maupun laporan keuangan.

Halaman `/suppliers` memakai pagination server 15 data, urutan nama/UUID yang stabil, dan pencarian nama/kontak/telepon/email. Tanda `%` dan `_` dicari sebagai teks literal. Penghapusan bersifat permanen dan memerlukan konfirmasi.

## Menjalankan perubahan

1. Jalankan `php artisan migrate` untuk membuat tabel `suppliers`.
2. Jalankan `npm run build` untuk frontend dan skeleton Supplier.
3. Jika memakai route cache, bangun ulang dengan `php artisan route:cache`.

Migrasi hanya menambah tabel baru. Rollback menghapus tabel beserta data supplier; lakukan hanya bila data tersebut memang boleh dibuang.

## Verifikasi

- `php artisan test --filter=SupplierTest`: CRUD, validasi, pencarian, pagination, UUID, akses owner, serta penolakan guest/kasir/manager/akun belum terverifikasi.
- `npm test`: normalisasi form dan validasi Zod.
- Periksa tambah/edit/hapus, pencarian, pagination, dan layout di desktop serta mobile. Skeleton reload dan navigasi berasal dari registry bersama.
