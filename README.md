# TokoM

Aplikasi kasir, pengelolaan stok, dan katalog online untuk berbagai usaha, berbasis Laravel 12, React, dan Inertia.js.

## Fitur

- Dashboard owner dan POS kasir
- Katalog publik dan pemesanan customer
- Manajemen produk, kategori, dan stok
- Pembayaran tunai dan QRIS statis yang dikonfirmasi kasir; pengembalian QRIS dapat dicatat tunai atau transfer oleh owner
- Laporan penjualan
- Pencarian sparepart berdasarkan model motor
- Mapping kompatibilitas motor dan sparepart

## Teknologi

- Backend: PHP 8.3+, Laravel 12, Eloquent ORM (extension ZIP untuk impor/ekspor Excel)
- Frontend: React 18, Inertia.js, Vite, Tailwind CSS
- Database: MySQL sesuai konfigurasi `.env`
- Authorization: Laravel Sanctum dan Spatie Permission
- Testing: PHPUnit

## Struktur Utama

```text
app/
  Http/Controllers/     Request dan response
  Http/Requests/         Validasi input
  Models/                Entity database
  Services/              Business logic
  Policies/              Authorization
database/
  migrations/            Struktur database
  seeders/               Data awal
resources/js/
  Pages/                 Halaman React/Inertia
  Layouts/               Layout bersama
routes/                  Route web dan API per domain
tests/                   Feature dan unit test
```

## Instalasi

```bash
composer install
copy .env.example .env
php artisan key:generate
npm install
php artisan migrate --seed
```

Atur koneksi database di `.env` sebelum menjalankan migration. Owner dapat mengunggah gambar QRIS toko lewat Pengaturan.

### Identitas TokoM

Nama aplikasi adalah **TokoM**. Nama usaha, logo toko, serta nama PWA khusus toko tetap mengikuti data masing-masing usaha. Perubahan merek aplikasi tidak menimpa nama usaha yang sudah tersimpan.

Untuk instalasi lama, perbarui nama tampilan di `.env` lokal dan hosting:

```dotenv
APP_NAME="TokoM"
VITE_APP_NAME="${APP_NAME}"
MAIL_FROM_NAME="${APP_NAME}"
```

Sebelum mengganti `APP_NAME`, pertahankan nilai efektif `SESSION_COOKIE`, `CACHE_PREFIX`, dan `REDIS_PREFIX` yang lama jika belum disetel. Untuk instalasi standar dengan `APP_NAME="Motorku"`, nilainya adalah `motorku-session`, `motorku-cache-`, dan `motorku-database-`. Ini menjaga sesi login serta namespace cache yang sudah digunakan. Instalasi baru tidak memerlukan nilai lama tersebut.

Jalankan `php artisan config:cache` setelah mengubah `.env`. Bangun ulang frontend dengan `npm run build` atau mulai ulang Vite saat development. Worker antrean yang berjalan perlu dimulai ulang dengan `php artisan queue:restart` agar memakai nama pengirim baru. Alamat email, password SMTP, dan OAuth tidak perlu diubah untuk penggantian merek ini.

Build CI tanpa `.env` menggunakan nama bawaan TokoM. Nama PWA yang sudah terpasang mengikuti pembaruan manifest oleh browser dan mungkin tidak berubah seketika.

## Menjalankan Development

```bash
composer dev
```

Atau jalankan service secara terpisah:

```bash
php artisan serve
npm run dev
php artisan schedule:work
```

Pesanan online yang belum dibayar menahan stok selama 15 menit. `composer dev` sudah menjalankan scheduler untuk membatalkan pesanan kedaluwarsa. Di staging dan production, jalankan `php artisan schedule:run` setiap menit melalui cron atau scheduler hosting; tanpa proses itu stok pesanan kedaluwarsa tidak otomatis dikembalikan.

## Testing dan Build

```bash
composer test
npm run build
```

## Alur GitHub

Fitur dibuat dari `develop`, diuji lewat Pull Request ke `develop`, lalu dirilis lewat Pull Request `develop` ke `main`. Staging berjalan setelah CI `develop` lulus; production dijalankan manual setelah server siap. Langkah lengkap ada di [panduan alur GitHub](docs/GITHUB_WORKFLOW.md).

## Role

- `owner`: akses penuh, laporan, inventory, user, settings, dan manajemen motor
- `cashier`: POS dan pengelolaan order operasional

## Konvensi Backend

Controller dibuat tipis. Business logic diletakkan di `app/Services/`, validasi memakai Form Request, dan perubahan stok diproses melalui `InventoryService`.

Nomor order menggunakan format `ORD-YYYYMMDD-XXXX` dan dijamin unik oleh database.
