# Motorku

POS dan katalog sparepart motor berbasis Laravel 12, React, dan Inertia.js.

## Fitur

- Dashboard owner dan POS kasir
- Katalog publik dan pemesanan customer
- Manajemen produk, kategori, dan stok
- Pembayaran cash, debit, credit, dan QRIS melalui DOKU
- Laporan penjualan
- Pencarian sparepart berdasarkan model motor
- Mapping kompatibilitas motor dan sparepart

## Teknologi

- Backend: PHP 8.2+, Laravel 12, Eloquent ORM
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

Atur koneksi database dan kredensial DOKU di `.env` sebelum menjalankan migration.

## Menjalankan Development

```bash
composer dev
```

Atau jalankan service secara terpisah:

```bash
php artisan serve
npm run dev
```

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
