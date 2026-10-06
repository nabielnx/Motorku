# Hasil perbaikan audit Motorku — 6 Oktober 2026

## Status pekerjaan

Perubahan disiapkan pada branch `fix/full-project-remediation`, dimulai dari `develop`, untuk PR ke `develop` sesuai permintaan pengguna. Tidak ada deploy remote atau migrasi oleh agent ke database operasional. Database yang dimutasi untuk tes adalah MySQL `sparepart_testing`; test runner dan worker concurrency menolak database lain.

[Audit awal](D:/Project/Webs/Motorku/docs/AUDIT_FLOW_2026-10-06.md) tetap disimpan sebagai catatan reproduksi sebelum perbaikan. Hasil awal dan jumlah tes lama di dokumen tersebut tidak menunjukkan kondisi kode setelah perbaikan.

## Akar masalah dan perbaikan

| Temuan | Akar masalah | Perubahan |
|---|---|---|
| A01: pembayaran lama | Endpoint status pending mempunyai aturan berbeda dari pembayaran baru | Lock order sebelum payment; cek pesanan batal, pembayaran ganda, nominal, QRIS dan tutup kas. Percobaan gagal tidak menurunkan pesanan yang sudah paid/refunded. Pending lama termasuk DOKU dibatalkan ketika pembayaran baru berhasil. Gambar QRIS kosong/whitespace juga ditolak. |
| A02: retur membuat antrean macet | Retur penuh diperbolehkan ketika pemenuhan masih aktif | Retur hanya untuk pesanan completed yang sudah dibayar; tombol UI mengikuti aturan service. |
| A03: checkout ganda | Request baru selalu membuat order baru | Identitas UUID checkout disimpan browser dan tabel `checkout_requests`. Insert unik + transaksi/row lock mengembalikan order/payment yang sama pada retry. Payload atau kasir berbeda dengan UUID sama ditolak. Tidak ada retry otomatis untuk error jaringan/server yang hasil transaksinya belum diketahui. |
| A04: POS dianggap gagal walau sukses | Interceptor Axios sudah membuka `successResponse`, tetapi POS membacanya dua kali | POS membaca `sale.data.order/payment`; tes memakai interceptor sebenarnya. Respons PaymentController lama tetap dibaca sebagai `response.data.data` sesuai kontraknya. |
| A05: struk kurang data | OrderResource tidak menyertakan nominal pembayaran untuk cetak ulang | Data pembayaran aman dimuat dalam resource; POS dan daftar pesanan memakai satu ThermalReceipt, termasuk uang diterima, kembalian, diskon, pajak, status dan ukuran 58/80 mm. |
| A06: pajak berbeda | Backend menghasilkan pecahan Rupiah sedangkan UI membulatkan | Pajak backend dibulatkan ke Rupiah utuh; fallback persentase UI disamakan dengan backend. Snapshot pesanan pelanggan memakai harga dan total server. |
| A07: timezone tidak konsisten | Pengaturan waktu hanya diterapkan pada grup web | Middleware runtime dipakai untuk web/API; expiry command menerapkan timezone toko. Nomor order, paid_at, filter dan laporan mengikuti waktu toko. |
| A08–A09: kategori | Delete parent bisa mengubah kelompok anak; parent dibuat sebelum kegagalan anak | Parent dengan isi ditolak saat dihapus; create/update kategori atomik. Catalog group diwariskan anak dan diselaraskan saat update; validasi nama/ID anak diperketat. |
| A10: pengaturan tidak berpengaruh | Nilai tersimpan tidak dibaca alur terkait | Banner enabled, pemesanan QR enabled, session timeout dan paper size benar-benar mengendalikan fitur. Katalog ditutup dengan pesan jelas, sementara riwayat pesanan lama tetap dapat diakses. |
| A11: cache fitment | Cache Motor Saya tidak dibatalkan ketika kategori berubah | Cache dibersihkan setelah transaksi kategori berhasil. Cache katalog yang tidak pernah dibaca dihapus. |
| A12: tanggal laporan | Tanggal mentah diteruskan ke Carbon | Form Request untuk format tanggal dan urutan rentang; input salah menghasilkan 422. |
| Staf/pengaturan | Proteksi owner berada di controller, bentuk data hasil CRUD berbeda, bulk settings menerima nilai bebas | Proteksi akun sendiri/owner terakhir dipusatkan di UserService dengan lock role owner. UI reload paginator setelah CRUD, menghitung owner lintas halaman; `is_active` boolean. Bulk/individual settings memakai aturan tipe dan whitelist yang sama. |
| B01: dependency | Paket rentan atau tidak dipakai masih tersimpan | Laravel/dependency PHP dan dependency frontend kompatibel diperbarui; paket realtime, pusher, html2canvas dan plugin Tailwind Vite yang tidak dipakai dihapus. Tailwind 3 dipertahankan. |
| B02: seeder | Akun password demo dapat dibuat di production; settings ditimpa saat reseed | UserSeeder ditolak di production/staging. Seeder utama di sana hanya role/settings, mempertahankan nilai existing, tanpa katalog contoh. Default logo tidak menunjuk file yang tidak ada. `app:create-owner` untuk owner pertama dengan prompt password tersembunyi. |
| B03–B05: rilis/CI | Deploy menimpa file tanpa menghapus file lama, rollback belum jelas, checks belum lengkap | CI menambah JS/Pint/dependency checks. Production mensyaratkan CI sukses untuk SHA yang sama. Aktivasi release membuat backup SQL/kode, rsync menghapus file lama, migrasi dan deployment checks; kegagalan tetap maintenance. `/up` menguji koneksi DB. Panduan provisioning dan pemulihan manual diperbarui. |

Checkout tanpa `request_id` masih diterima untuk kompatibilitas pemanggil internal/lama; deduplikasi membutuhkan UUID tersebut. POS dan checkout pelanggan sekarang selalu mengirimkannya. Tabel baru menyimpan UUID, hash SHA-256 payload/context dan relasi order; **bukan sidik jari manusia**. Retur tetap memakai identitas request yang sudah ada.

Perbaikan stok juga menghitung jumlah gabungan bila produk yang sama muncul pada beberapa baris dengan catatan berbeda. Baris terpisah tetap diperbolehkan, tetapi tidak dapat melewati stok tersedia.

## Perbaikan lanjutan

- Navigasi Produk/Otomotif/Elektronik/Alat Bangunan/Sepeda menentukan ukuran pagination sebelum request pertama. Penyesuaian grid berjalan tanpa skeleton kedua; ukuran card tidak berubah. Akses POS owner dan cashier terverifikasi, dan owner mengonfirmasi POS bisa dibuka.
- Pesan katalog tanpa produk dibedakan dari hasil pencarian/filter kosong. Placeholder login menjadi “Masukkan email” dan “Masukkan password”; label email mengikuti autentikasi yang memang hanya menerima email.
- Sesuai permintaan, fitur Ingat saya dan Lupa password dihapus: UI login/profil, prop Inertia, empat route pemulihan, dua controller dan dua halaman reset. Login mengabaikan `remember=true`; model menonaktifkan autentikasi remember-me, termasuk cookie lama. Penggantian password setelah login tetap tersedia dan memerlukan password saat ini. Tidak ada perubahan schema atau migrasi database untuk penghapusan fitur ini.
- ID request POS, checkout pelanggan dan retur memakai helper UUID v4 dengan `crypto.getRandomValues()` ketika `crypto.randomUUID()` tidak tersedia. Fallback tetap memakai sumber acak kriptografis dan identitas checkout tetap disimpan untuk retry/reload. Tes mereproduksi browser tanpa randomUUID, memeriksa format UUID, identitas retry, jalur native dan penolakan browser tanpa sumber acak.

Tes subset navigasi/katalog dan autentikasi/profil lulus selama perbaikan lanjutan. Verifikasi akhir sebelum PR menjalankan ulang seluruh suite PHP, tes JavaScript, build, sintaks PHP, Pint dan audit dependency. Hasil pada tabel berikut sudah mencakup perbaikan lanjutan; jumlah tes subset tidak dijumlahkan dengan full suite.

## Verifikasi akhir sebelum PR

| Pemeriksaan | Hasil akhir |
|---|---|
| `php artisan test` | **221 passed, 1393 assertions**, tidak ada failed; MySQL `sparepart_testing` |
| `npm test` | **12 passed**, tidak ada failed |
| `npm run build` | Berhasil, bundle production dibuat; `public/hot` tidak tertinggal |
| PHP syntax (`php -l`) | **231 file** app/bootstrap/config/database/routes/scripts/tests lulus |
| Pint seluruh direktori PHP di atas | Passed |
| `composer validate --strict` | Valid |
| `composer audit` | Tidak ada security advisory |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` penuh | 5 high dan 3 moderate pada rantai dependency build; detail/batasan di bawah |
| Bash syntax `scripts/deploy-release.sh` | Lulus `bash -n` |
| `git diff --check` | Lulus |


Bukti verifikasi akhir tersimpan di `storage/app/pr-*.txt` dan `storage/app/pr-full-npm-audit.json`, yang diabaikan Git. Bukti audit sebelumnya tersimpan di `storage/app/remediation-*.txt`. Tes regresi baru mencakup FullAuditRemediationTest, CheckoutConcurrencyTest, ProductionProvisioningTest, AdminNavigationTest, checkout.test.js dan productPagination.test.js. Uji concurrency menjalankan dua proses PHP independen dengan fixture yang telah committed ke database testing: hasilnya UUID order sama, satu order, satu payment paid dan stok 5 menjadi 4.

### Perbaikan gate Pint setelah CI pertama

CI pertama PR #73 gagal karena argumen folder `bootstrap` memasukkan `bootstrap/cache/packages.php` dan `bootstrap/cache/services.php` yang dihasilkan Composer/Laravel. Cache lokal sebelumnya sempat diformat, sehingga pemeriksaan lokal tidak mereproduksi kondisi cache baru di CI. Setelah menjalankan ulang hook Composer `post-autoload-dump`, kegagalan dua file yang sama berhasil direproduksi.

Perintah CI diperbaiki menjadi `vendor/bin/pint --test app bootstrap/*.php config database routes scripts tests`: file sumber PHP di bootstrap tetap diperiksa, sedangkan cache hasil generate tidak masuk cakupan. Perintah yang sama dijalankan melalui Bash dengan cache baru dan lulus. Bukti lokal: `storage/app/ci-pint-reproduced.txt` dan `storage/app/ci-pint-fixed.txt`.

## Advisory yang masih tersisa

Pada verifikasi akhir 6 Oktober 2026, dependency transitif `source-map-js` diperbarui dari 1.2.1 ke patch 1.2.2 untuk mengatasi [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). Tes JavaScript dan build dijalankan ulang setelah pembaruan ini.

`npm audit` penuh masih melaporkan **5 paket high dan 3 moderate** pada dependency build. Lima paket high berasal dari [advisory `braces` GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) pada rantai Tailwind 3/chokidar/micromatch/fast-glob. Tiga paket moderate berasal dari [advisory `postcss-selector-parser` GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), yang memerlukan versi 7.1.6 sementara Tailwind 3 memakai major 6. Tidak dipaksakan override lintas major atau migrasi Tailwind 4 dalam perbaikan ini.

Rantai ini adalah dependency build, bukan dependency browser/PHP runtime; `npm audit --omit=dev` bersih. Berdasarkan pemakaiannya saat ini, input pattern berasal dari konfigurasi repo yang dipercaya. Temuan build tetap harus dipantau dan tidak dinyatakan sudah diperbaiki. CI menyimpan laporan audit penuh sebagai artifact dan menjadikan audit dependency production sebagai gate.

## Langkah setelah merge

**Pada pemeriksaan schema lanjutan 6 Oktober 2026, tabel `checkout_requests` sudah terkonfirmasi ada pada database lokal `sparepart` dengan kolom yang sesuai. Pemeriksaan ini hanya membaca database; agent tidak menjalankan migrasi operasional.** Checkout dengan UUID membutuhkan tabel ini. Untuk instalasi/server lain, periksa status migrasi dan jalankan migrasi yang masih pending sebelum memakai checkout baru.

Setelah perubahan direview/digabungkan dan backup tersedia, pada checkout/server yang benar:

```bash
composer install
npm ci
npm run build
php artisan migrate
php artisan optimize:clear
```

Gunakan `--force` untuk migrasi production melalui prosedur deploy/maintenance. Migrasi ini hanya menambah tabel deduplikasi checkout; tidak mengisi katalog atau menghapus transaksi. Jangan menjalankan `migrate:fresh` atau seeder demo pada database operasional.

[Alur deploy dan rollback](D:/Project/Webs/Motorku/docs/GITHUB_WORKFLOW.md) mencakup pemeriksaan `app:check-deployment`, initial owner, kebutuhan upload dan backup. Environment/secrets GitHub maupun server production belum diubah oleh pekerjaan ini.

## Yang masih perlu diuji manual

- Browser: POS tunai/QRIS, timeout/reload lalu retry, pesanan pelanggan sampai completed/retur; pastikan receipt/pagination dan pesan error sesuai.
- Printer fisik: print preview dan hasil 58/80 mm, termasuk printer driver, auto-print, margin, nama kasir dan nominal.
- Pengaturan/UI: banner disable, katalog QR disable (riwayat lama tetap tersedia), timezone, session timeout, CRUD staf lintas halaman, browser multi-tab/sesi kedaluwarsa.
- Staging: workflow GitHub, SSH, rsync, backup SQL/kode, failure maintenance dan restore ke database sementara. Script deploy baru lulus sintaks Bash; belum dieksekusi ke host remote.
- Production: HTTPS/proxy, GD WebP, PHP/web-server upload limits, mail, scheduler setiap menit, worker, storage link/permission dan kapasitas/retensi backup. Tes lokal tidak menjamin kondisi server tersebut.

Tidak ditambahkan store Zustand, sistem event/broadcast pengganti, SDK pembayaran baru, atau arsitektur offline sync. Controller tetap tipis dan logika bisnis tetap berada di services. Sejumlah file lama diformat oleh Pint untuk memenuhi gate style; perubahan ini ikut tercantum pada daftar file.

## Daftar file yang berubah

Daftar berikut termasuk penambahan, penghapusan dan perapihan format Pint. File laporan/log di `storage/app` tidak ikut version control.

Daftar audit utama mencakup **122 file** berubah/ditambah/dihapus. File perbaikan lanjutan yang belum termasuk daftar ini tercantum pada bagian terakhir.

### Backend

- [app/Console/Commands/CheckDeployment.php](D:/Project/Webs/Motorku/app/Console/Commands/CheckDeployment.php)
- [app/Console/Commands/CreateOwner.php](D:/Project/Webs/Motorku/app/Console/Commands/CreateOwner.php)
- [app/Console/Commands/ExpireStaleOrders.php](D:/Project/Webs/Motorku/app/Console/Commands/ExpireStaleOrders.php)
- [app/Enums/InventoryLogType.php](D:/Project/Webs/Motorku/app/Enums/InventoryLogType.php)
- [app/Enums/PaymentStatus.php](D:/Project/Webs/Motorku/app/Enums/PaymentStatus.php)
- `app/Events/OrderStatusUpdated.php` — dihapus.
- [app/Http/Controllers/Category/CategoryController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Category/CategoryController.php)
- [app/Http/Controllers/Dashboard/PosController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Dashboard/PosController.php)
- [app/Http/Controllers/Inventory/InventoryController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Inventory/InventoryController.php)
- [app/Http/Controllers/Motorcycle/MotorSayaController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Motorcycle/MotorSayaController.php)
- [app/Http/Controllers/Motorcycle/MotorcycleController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Motorcycle/MotorcycleController.php)
- [app/Http/Controllers/Order/CustomerMenuController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Order/CustomerMenuController.php)
- [app/Http/Controllers/Order/OrderController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Order/OrderController.php)
- [app/Http/Controllers/Payment/PaymentController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Payment/PaymentController.php)
- [app/Http/Controllers/Product/ProductController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Product/ProductController.php)
- [app/Http/Controllers/Profile/ProfileController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Profile/ProfileController.php)
- [app/Http/Controllers/Report/ReportController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Report/ReportController.php)
- [app/Http/Controllers/Setting/SettingController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Setting/SettingController.php)
- [app/Http/Controllers/User/UserController.php](D:/Project/Webs/Motorku/app/Http/Controllers/User/UserController.php)
- [app/Http/Middleware/ApplySystemSettings.php](D:/Project/Webs/Motorku/app/Http/Middleware/ApplySystemSettings.php)
- [app/Http/Middleware/EnsureUserIsActive.php](D:/Project/Webs/Motorku/app/Http/Middleware/EnsureUserIsActive.php)
- [app/Http/Middleware/HandleInertiaRequests.php](D:/Project/Webs/Motorku/app/Http/Middleware/HandleInertiaRequests.php)
- [app/Http/Requests/Category/StoreCategoryRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Category/StoreCategoryRequest.php)
- [app/Http/Requests/Category/UpdateCategoryRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Category/UpdateCategoryRequest.php)
- [app/Http/Requests/Inventory/UpdateInventoryRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Inventory/UpdateInventoryRequest.php)
- [app/Http/Requests/Motorcycle/AttachMotorcyclePartRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Motorcycle/AttachMotorcyclePartRequest.php)
- [app/Http/Requests/Motorcycle/BulkAttachMotorcyclePartsRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Motorcycle/BulkAttachMotorcyclePartsRequest.php)
- [app/Http/Requests/Motorcycle/GetMotorcyclePartsRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Motorcycle/GetMotorcyclePartsRequest.php)
- [app/Http/Requests/Motorcycle/UpdateMotorcyclePartRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Motorcycle/UpdateMotorcyclePartRequest.php)
- [app/Http/Requests/Order/StoreCustomerOrderRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Order/StoreCustomerOrderRequest.php)
- [app/Http/Requests/Order/StoreOrderRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Order/StoreOrderRequest.php)
- [app/Http/Requests/Report/ReportDateRangeRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Report/ReportDateRangeRequest.php)
- [app/Http/Requests/Setting/SaveSettingsRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Setting/SaveSettingsRequest.php)
- [app/Http/Requests/Setting/UpdateSettingRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Setting/UpdateSettingRequest.php)
- [app/Http/Requests/User/UpdateUserRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/User/UpdateUserRequest.php)
- [app/Http/Resources/OrderResource.php](D:/Project/Webs/Motorku/app/Http/Resources/OrderResource.php)
- [app/Http/Resources/UserResource.php](D:/Project/Webs/Motorku/app/Http/Resources/UserResource.php)
- [app/Models/Category.php](D:/Project/Webs/Motorku/app/Models/Category.php)
- [app/Models/MotorcyclePart.php](D:/Project/Webs/Motorku/app/Models/MotorcyclePart.php)
- [app/Models/Role.php](D:/Project/Webs/Motorku/app/Models/Role.php)
- [app/Models/User.php](D:/Project/Webs/Motorku/app/Models/User.php)
- [app/Policies/ProductPolicy.php](D:/Project/Webs/Motorku/app/Policies/ProductPolicy.php)
- [app/Providers/AppServiceProvider.php](D:/Project/Webs/Motorku/app/Providers/AppServiceProvider.php)
- [app/Services/CacheService.php](D:/Project/Webs/Motorku/app/Services/CacheService.php)
- [app/Services/CategoryService.php](D:/Project/Webs/Motorku/app/Services/CategoryService.php)
- [app/Services/OrderReturnService.php](D:/Project/Webs/Motorku/app/Services/OrderReturnService.php)
- [app/Services/OrderService.php](D:/Project/Webs/Motorku/app/Services/OrderService.php)
- [app/Services/PaymentService.php](D:/Project/Webs/Motorku/app/Services/PaymentService.php)
- [app/Services/SettingService.php](D:/Project/Webs/Motorku/app/Services/SettingService.php)
- [app/Services/UserService.php](D:/Project/Webs/Motorku/app/Services/UserService.php)
- [bootstrap/app.php](D:/Project/Webs/Motorku/bootstrap/app.php)
- `config/reverb.php` — dihapus.
- [config/sanctum.php](D:/Project/Webs/Motorku/config/sanctum.php)
- [routes/api.php](D:/Project/Webs/Motorku/routes/api.php)
- `routes/channels.php` — dihapus.
- [routes/web.php](D:/Project/Webs/Motorku/routes/web.php)

### Frontend

- [resources/css/app.css](D:/Project/Webs/Motorku/resources/css/app.css)
- [resources/js/Components/Customer/OrderingUnavailable.jsx](D:/Project/Webs/Motorku/resources/js/Components/Customer/OrderingUnavailable.jsx)
- [resources/js/Components/ThermalReceipt.jsx](D:/Project/Webs/Motorku/resources/js/Components/ThermalReceipt.jsx)
- [resources/js/Pages/Motorcycle/MotorSaya.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Motorcycle/MotorSaya.jsx)
- [resources/js/Pages/Order/Index.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Order/Index.jsx)
- [resources/js/Pages/Order/Menu.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Order/Menu.jsx)
- [resources/js/Pages/Order/Show.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Order/Show.jsx)
- [resources/js/Pages/POS/Index.jsx](D:/Project/Webs/Motorku/resources/js/Pages/POS/Index.jsx)
- [resources/js/Pages/Payment/Index.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Payment/Index.jsx)
- [resources/js/Pages/User/Index.jsx](D:/Project/Webs/Motorku/resources/js/Pages/User/Index.jsx)
- [resources/js/Utils/checkout.js](D:/Project/Webs/Motorku/resources/js/Utils/checkout.js)
- [resources/js/bootstrap.js](D:/Project/Webs/Motorku/resources/js/bootstrap.js)
- `resources/js/echo.js` — dihapus.

### Database

- [database/factories/CategoryFactory.php](D:/Project/Webs/Motorku/database/factories/CategoryFactory.php)
- [database/factories/OrderFactory.php](D:/Project/Webs/Motorku/database/factories/OrderFactory.php)
- [database/factories/OrderItemFactory.php](D:/Project/Webs/Motorku/database/factories/OrderItemFactory.php)
- [database/factories/PaymentFactory.php](D:/Project/Webs/Motorku/database/factories/PaymentFactory.php)
- [database/factories/ProductFactory.php](D:/Project/Webs/Motorku/database/factories/ProductFactory.php)
- [database/migrations/0001_01_01_000006_create_orders_table.php](D:/Project/Webs/Motorku/database/migrations/0001_01_01_000006_create_orders_table.php)
- [database/migrations/0001_01_01_000007_create_order_items_table.php](D:/Project/Webs/Motorku/database/migrations/0001_01_01_000007_create_order_items_table.php)
- [database/migrations/0001_01_01_000008_create_payments_table.php](D:/Project/Webs/Motorku/database/migrations/0001_01_01_000008_create_payments_table.php)
- [database/migrations/0001_01_01_000010_create_settings_table.php](D:/Project/Webs/Motorku/database/migrations/0001_01_01_000010_create_settings_table.php)
- [database/migrations/2026_07_24_214031_add_indexes_to_report_date_columns.php](D:/Project/Webs/Motorku/database/migrations/2026_07_24_214031_add_indexes_to_report_date_columns.php)
- [database/migrations/2026_09_20_133309_drop_product_modifiers_and_order_type.php](D:/Project/Webs/Motorku/database/migrations/2026_09_20_133309_drop_product_modifiers_and_order_type.php)
- [database/migrations/2026_09_20_150000_add_unique_gateway_reference_to_payments_table.php](D:/Project/Webs/Motorku/database/migrations/2026_09_20_150000_add_unique_gateway_reference_to_payments_table.php)
- [database/migrations/2026_10_06_000001_create_checkout_requests_table.php](D:/Project/Webs/Motorku/database/migrations/2026_10_06_000001_create_checkout_requests_table.php)
- [database/seeders/DatabaseSeeder.php](D:/Project/Webs/Motorku/database/seeders/DatabaseSeeder.php)
- [database/seeders/MotorcycleSeeder.php](D:/Project/Webs/Motorku/database/seeders/MotorcycleSeeder.php)
- [database/seeders/OilProductSeeder.php](D:/Project/Webs/Motorku/database/seeders/OilProductSeeder.php)
- [database/seeders/RoleSeeder.php](D:/Project/Webs/Motorku/database/seeders/RoleSeeder.php)
- [database/seeders/SettingSeeder.php](D:/Project/Webs/Motorku/database/seeders/SettingSeeder.php)
- [database/seeders/TireMotorcycleMappingSeeder.php](D:/Project/Webs/Motorku/database/seeders/TireMotorcycleMappingSeeder.php)
- [database/seeders/TireProductSeeder.php](D:/Project/Webs/Motorku/database/seeders/TireProductSeeder.php)
- [database/seeders/UserSeeder.php](D:/Project/Webs/Motorku/database/seeders/UserSeeder.php)

### Dependency, CI dan deploy

- [.github/workflows/ci.yml](D:/Project/Webs/Motorku/.github/workflows/ci.yml)
- [.github/workflows/deploy-production.yml](D:/Project/Webs/Motorku/.github/workflows/deploy-production.yml)
- [.github/workflows/deploy-staging.yml](D:/Project/Webs/Motorku/.github/workflows/deploy-staging.yml)
- [composer.json](D:/Project/Webs/Motorku/composer.json)
- [composer.lock](D:/Project/Webs/Motorku/composer.lock)
- [package-lock.json](D:/Project/Webs/Motorku/package-lock.json)
- [package.json](D:/Project/Webs/Motorku/package.json)
- [scripts/backup-database.php](D:/Project/Webs/Motorku/scripts/backup-database.php)
- [scripts/deploy-release.sh](D:/Project/Webs/Motorku/scripts/deploy-release.sh)

### Pengujian

- [tests/Feature/Auth/AuthenticationTest.php](D:/Project/Webs/Motorku/tests/Feature/Auth/AuthenticationTest.php)
- [tests/Feature/CheckoutConcurrencyTest.php](D:/Project/Webs/Motorku/tests/Feature/CheckoutConcurrencyTest.php)
- [tests/Feature/DashboardAuditVerificationTest.php](D:/Project/Webs/Motorku/tests/Feature/DashboardAuditVerificationTest.php)
- [tests/Feature/FullAuditRemediationTest.php](D:/Project/Webs/Motorku/tests/Feature/FullAuditRemediationTest.php)
- [tests/Feature/Inventory/InventoryTest.php](D:/Project/Webs/Motorku/tests/Feature/Inventory/InventoryTest.php)
- [tests/Feature/Motorcycle/MotorcycleManagementTest.php](D:/Project/Webs/Motorku/tests/Feature/Motorcycle/MotorcycleManagementTest.php)
- [tests/Feature/Order/OrderListFilterTest.php](D:/Project/Webs/Motorku/tests/Feature/Order/OrderListFilterTest.php)
- [tests/Feature/Order/OrderReturnTest.php](D:/Project/Webs/Motorku/tests/Feature/Order/OrderReturnTest.php)
- [tests/Feature/Order/PosAuditVerificationTest.php](D:/Project/Webs/Motorku/tests/Feature/Order/PosAuditVerificationTest.php)
- [tests/Feature/PaginationTest.php](D:/Project/Webs/Motorku/tests/Feature/PaginationTest.php)
- [tests/Feature/Payment/AuditRemediationTest.php](D:/Project/Webs/Motorku/tests/Feature/Payment/AuditRemediationTest.php)
- [tests/Feature/Payment/ManualQrisPaymentTest.php](D:/Project/Webs/Motorku/tests/Feature/Payment/ManualQrisPaymentTest.php)
- [tests/Feature/Product/ProductSearchTest.php](D:/Project/Webs/Motorku/tests/Feature/Product/ProductSearchTest.php)
- [tests/Feature/ProductionProvisioningTest.php](D:/Project/Webs/Motorku/tests/Feature/ProductionProvisioningTest.php)
- [tests/Feature/ProductionReadinessTest.php](D:/Project/Webs/Motorku/tests/Feature/ProductionReadinessTest.php)
- [tests/Feature/Report/CashClosingTest.php](D:/Project/Webs/Motorku/tests/Feature/Report/CashClosingTest.php)
- [tests/Feature/Report/ReportTest.php](D:/Project/Webs/Motorku/tests/Feature/Report/ReportTest.php)
- [tests/TestCase.php](D:/Project/Webs/Motorku/tests/TestCase.php)
- [tests/fixtures/checkout-worker.php](D:/Project/Webs/Motorku/tests/fixtures/checkout-worker.php)
- [tests/js/checkout.test.js](D:/Project/Webs/Motorku/tests/js/checkout.test.js)

### Dokumentasi

- [DATABASE_RELATIONS.md](D:/Project/Webs/Motorku/DATABASE_RELATIONS.md) — kegunaan seluruh 29 tabel, diagram relasi, 233 kolom, index dan 21 foreign key berdasarkan schema lokal yang dibaca tanpa mengubah data.
- [docs/AUDIT_FLOW_2026-10-06.md](D:/Project/Webs/Motorku/docs/AUDIT_FLOW_2026-10-06.md)
- [docs/GITHUB_WORKFLOW.md](D:/Project/Webs/Motorku/docs/GITHUB_WORKFLOW.md)
- [docs/REMEDIATION_2026-10-06.md](D:/Project/Webs/Motorku/docs/REMEDIATION_2026-10-06.md)

### Tambahan perbaikan lanjutan

- [resources/js/app.jsx](D:/Project/Webs/Motorku/resources/js/app.jsx)
- [resources/js/Utils/productPagination.js](D:/Project/Webs/Motorku/resources/js/Utils/productPagination.js)
- [tests/Feature/AdminNavigationTest.php](D:/Project/Webs/Motorku/tests/Feature/AdminNavigationTest.php)
- [tests/js/productPagination.test.js](D:/Project/Webs/Motorku/tests/js/productPagination.test.js)
- [resources/js/Pages/Auth/Login.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Auth/Login.jsx)
- [resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx](D:/Project/Webs/Motorku/resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx)
- [app/Http/Controllers/Auth/AuthenticatedSessionController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Auth/AuthenticatedSessionController.php)
- [app/Http/Requests/Auth/LoginRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/Auth/LoginRequest.php)
- [routes/auth.php](D:/Project/Webs/Motorku/routes/auth.php)
- [tests/Feature/Auth/AuthenticationTest.php](D:/Project/Webs/Motorku/tests/Feature/Auth/AuthenticationTest.php)
- Dihapus: `app/Http/Controllers/Auth/NewPasswordController.php`, `app/Http/Controllers/Auth/PasswordResetLinkController.php`, `resources/js/Pages/Auth/ForgotPassword.jsx`, `resources/js/Pages/Auth/ResetPassword.jsx`, dan `tests/Feature/Auth/PasswordResetTest.php`.
