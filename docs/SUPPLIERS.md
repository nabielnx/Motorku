# Supplier

Menu Supplier tersedia untuk owner di bagian Supplier tersendiri, setelah Manajemen dan sebelum Administrasi. Laporan Keuangan berada tepat di bawah Dashboard di bagian Utama.

Modul ini mengelola nama supplier (wajib), nama kontak, telepon/WhatsApp, email, alamat, catatan, serta link toko/website. Satu supplier dapat memiliki maksimal 10 link dengan nama platform masing-masing, misalnya Shopee, Tokopedia, atau website sendiri. URL harus lengkap dengan `http://` atau `https://`, dan dibuka pada tab baru. Tidak ada pengambilan data otomatis dari platform tersebut.

Belum ada hubungan supplier dengan produk, pembelian, atau mutasi stok. Mengubah supplier tidak mengubah stok maupun laporan keuangan.

Halaman `/suppliers` memakai pagination server 15 data, urutan nama/UUID yang stabil, dan pencarian nama/kontak/telepon/email. Tanda `%` dan `_` dicari sebagai teks literal. Penghapusan bersifat permanen dan memerlukan konfirmasi.

## Menjalankan perubahan

1. Jalankan `php artisan migrate` untuk membuat tabel `suppliers` dan menambahkan kolom JSON `links`. Migrasi penambahan link terpisah agar instalasi yang sudah memiliki data supplier tetap bisa di-upgrade.
2. Jalankan `npm run build` untuk frontend dan skeleton Supplier.
3. Jika memakai route cache, bangun ulang dengan `php artisan route:cache`.

Migrasi link tidak mengubah data supplier lama; nilai link kosong tetap didukung. Rollback migrasi link membuang daftar link saja. Rollback migrasi awal menghapus tabel beserta seluruh data supplier; lakukan hanya bila data tersebut memang boleh dibuang.

## Verifikasi

- `php artisan test --filter=SupplierTest`: CRUD, validasi, pencarian, pagination, UUID, akses owner, serta penolakan guest/kasir/manager/akun belum terverifikasi.
- `npm test`: normalisasi form dan validasi Zod.
- Periksa tambah/edit/hapus, pencarian, pagination, dan layout di desktop serta mobile. Skeleton reload dan navigasi berasal dari registry bersama.
