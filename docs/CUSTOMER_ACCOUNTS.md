# Akun pelanggan dan checkout tamu

Pelanggan bisa tetap memesan tanpa login, atau masuk melalui Google dan email/password. Akun pelanggan bersifat global; riwayat pesanan dan data pengambilan dibatasi ke toko yang sedang dibuka.

## Perilaku

- Ikon akun di header katalog membuka `/customer/login`. Dari halaman ini tersedia pilihan Masuk kelola toko.
- Checkout tamu tidak membuat akun. Akses status pesanan tetap memakai token yang tersimpan di perangkat pemesan.
- Checkout pelanggan yang masuk menghubungkan pesanan baru ke akun pelanggan. Nama dan nomor telepon tersimpan per toko untuk checkout berikutnya.
- Riwayat akun di `/order/status` berasal dari server, tersedia lintas perangkat, dengan filter dan pagination 20 pesanan per halaman.
- Pesanan tamu lama tidak otomatis menjadi milik akun berdasarkan nama, email, atau nomor telepon.
- Login pelanggan tidak membuat usaha, tidak memberi peran owner/kasir, dan menggunakan session guard tersendiri. Email yang sama boleh digunakan untuk akun pelanggan dan akun toko secara terpisah.
- Akun email/password yang belum ditautkan ke Google harus masuk dengan password terlebih dahulu, lalu menautkan Google melalui halaman akun pelanggan.
- Google-only customer bisa membuat password melalui tautan pemulihan email. Pemulihan password hanya mengubah akun pelanggan dan mengakhiri sesi pelanggan lama.
- Verifikasi email tersedia dari halaman akun. Pesanan tetap dapat dibuat sebelum verifikasi, seperti checkout tamu.
- Reset data transaksi toko menghapus riwayat pesanan, tetapi mempertahankan akun dan profil pelanggan.

## Menjalankan pembaruan

```bash
php artisan migrate
php artisan config:cache
npm run build
```

Migrasi menambah `customer_accounts`, `customer_profiles`, `customer_password_reset_tokens`, dan kolom opsional `orders.customer_account_id`. Pesanan yang sudah ada tetap menjadi pesanan tamu.

Google memakai `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REDIRECT_URI` yang sudah ada. Callback tetap `/auth/google/callback`; tidak perlu menambahkan callback Google baru. State dan PKCE tetap digunakan, dengan tujuan pelanggan/toko disimpan pada percobaan OAuth di sesi server.

Konfigurasi email aplikasi harus aktif agar email verifikasi dan pemulihan password terkirim. Tautan email pelanggan menggunakan rute pelanggan dan mempertahankan toko asal.

## Batas akses

- Browser checkout menggunakan POST `/customer/checkout` dengan CSRF. Identitas akun diambil dari sesi server, bukan dari payload.
- Endpoint stateless `/api/customer/order` dipertahankan untuk kompatibilitas sebagai guest-only.
- Daftar riwayat selalu memfilter akun pelanggan dan usaha aktif; token detail hanya diberikan kepada akun pemilik pesanan.
- Pemulihan password memakai tabel token terpisah dari owner/staf.
- Penyimpanan struk dan percobaan checkout dipisahkan per pelanggan, sementara keranjang belanja tetap tersedia setelah masuk.

## Validasi

```bash
php artisan test tests/Feature/Customer/CustomerAccountTest.php
npm test
npm run build
```
