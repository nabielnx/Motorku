# Audit kode dan alur Motorku — 6 Oktober 2026

## Kesimpulan

Alur utama sudah terbentuk: katalog → pesanan → reservasi stok → pembayaran → penyelesaian → laporan/retur. Arsitektur Laravel, services, React, dan Inertia sudah cukup sesuai kebutuhan aplikasi toko ini. Namun beberapa jalur alternatif masih menghasilkan status, stok, struk, dan pengaturan yang tidak konsisten.

Audit menemukan **12 temuan: 3 prioritas tinggi (P1) dan 9 prioritas menengah (P2)**. Temuan disusun dari kode yang berjalan saat ini, bukan dari asumsi fitur SaaS atau kebutuhan masa depan.

Dokumen ini mencatat kondisi **sebelum perbaikan** pada branch `develop`, dengan working tree awal bersih. Perbaikan berikutnya dikerjakan lokal pada `fix/full-project-remediation`; lihat [hasil perbaikan](D:/Project/Webs/Motorku/docs/REMEDIATION_2026-10-06.md) untuk status dan verifikasi terbaru. Angka tes dan reproduksi di bawah adalah hasil audit awal. Tidak ada commit, push, atau PR.

## Lingkup dan cara pemeriksaan

| Bagian | Yang ditelusuri |
|---|---|
| Arsitektur dan database | AGENTS.md, dokumentasi alur/relasi, models, migrations, constraints, UUID, hard delete dan snapshot transaksi |
| Autentikasi dan akses | Login, session, CSRF recovery, middleware akun aktif, policies, roles, akun/profil |
| Katalog | Produk, kelompok katalog, kategori/subkategori, pencarian, stok, gambar |
| Data motor | CRUD motor, mapping kompatibilitas, bulk mapping, katalog Motor Saya dan cache |
| Transaksi | POS, pesanan pelanggan, reservasi stok, pembatalan, kedaluwarsa, status pemenuhan |
| Pembayaran | Tunai, QRIS manual, pembayaran ulang, endpoint status pembayaran lama, struk |
| Retur dan laporan | Refund, restock, pendapatan bersih, rekap kas, tutup kas, tanggal laporan |
| Frontend | Kontrak Axios/API, navigasi Inertia, polling, riwayat pelanggan, pagination, skeleton, input uang |
| Pengaturan | Logo, banner, QRIS, foto profil/login/produk/motor, pajak, timezone, printer, katalog QR |

Pemeriksaan menggabungkan pembacaan controller → request → service → model → UI, tes project, dan uji reproduksi tambahan. Uji database memakai **`sparepart_testing`**; data toko di database operasional tidak dipakai untuk mutasi audit.

## Temuan prioritas tinggi

### A01 — Endpoint status pembayaran lama melewati aturan pembayaran utama [P1]

**Lokasi:** [PaymentService.php:103](D:/Project/Webs/Motorku/app/Services/PaymentService.php:103), [routes/payment.php:11](D:/Project/Webs/Motorku/routes/payment.php:11).

`processPayment()` sudah menolak pesanan batal, pembayaran ganda, dan pembayaran tunai setelah tutup kas. Tetapi `updatePaymentStatus()` masih bisa memfinalisasi pembayaran pending tanpa aturan yang sama. Endpoint ini masih terdaftar dan dapat dipanggil owner.

Tiga skenario berhasil direproduksi:

1. Pesanan dibatalkan dan stok sudah kembali. Pembayaran pending kemudian diubah menjadi `paid`. Pesanan menjadi **cancelled + paid**. Rekap kas menghitung Rp10.000, sedangkan pendapatan laporan mengecualikan pesanan batal dan tetap Rp0.
2. Kas ditutup dengan penjualan Rp0. Pembayaran pending kemudian diubah menjadi `paid`; penjualan kas yang dihitung berubah menjadi Rp10.000, tetapi snapshot tutup kas tetap Rp0.
3. Pesanan sudah dibayar tunai. Percobaan pembayaran lama `doku_checkout` yang masih pending diubah menjadi `failed`; status pesanan kembali `unpaid`, walaupun pembayaran tunainya tetap `paid`.

**Batas kejadian:** membutuhkan record pembayaran pending, misalnya data lama. UI pembayaran saat ini langsung membuat pembayaran paid; skenario ini bukan hasil setiap transaksi baru.

**Perbaikan minimum:** hapus endpoint status lama apabila sudah tidak diperlukan. Jika masih diperlukan untuk data lama, finalisasi harus memakai aturan pembayaran yang sama; kegagalan satu percobaan pembayaran tidak boleh membatalkan status paid dari pembayaran lain.

### A02 — Retur penuh sebelum pesanan selesai membuat antrean macet [P1]

**Lokasi:** [OrderReturnService.php:20](D:/Project/Webs/Motorku/app/Services/OrderReturnService.php:20), [OrderService.php:111](D:/Project/Webs/Motorku/app/Services/OrderService.php:111), [OrderService.php:276](D:/Project/Webs/Motorku/app/Services/OrderService.php:276).

Retur diizinkan untuk pesanan yang sudah dibayar walaupun masih `preparing`. Retur seluruh barang mengubah `payment_status` menjadi `refunded`, tetapi membiarkan `order_status` tetap aktif.

**Bukti:** pesanan paid/preparing diretur penuh. Penghitung antrean masih bernilai 1. Transisi ke ready ditolak 422 karena pembayaran bukan lagi paid; pembatalan juga ditolak karena status bukan pending.

**Dampak:** antrean berisi pesanan yang tidak lagi bisa diselesaikan melalui alur normal.

**Perbaikan minimum:** tentukan satu aturan yang konsisten: retur hanya untuk pesanan selesai, atau refund penuh juga menutup pemenuhan pesanan dan mengeluarkannya dari antrean. Terapkan aturan itu pada service dan UI.

### A03 — Pengiriman ulang checkout POS membuat transaksi baru lagi [P1]

**Lokasi:** [OrderService.php:30](D:/Project/Webs/Motorku/app/Services/OrderService.php:30), [OrderService.php:134](D:/Project/Webs/Motorku/app/Services/OrderService.php:134), [POS/Index.jsx:325](D:/Project/Webs/Motorku/resources/js/Pages/POS/Index.jsx:325).

Guard frontend mencegah klik bersamaan, tetapi backend belum mengenali pengiriman ulang checkout yang sama. Setiap request membuat order dan payment baru. Guard pembayaran ganda per order tidak membantu karena ID order juga baru.

**Bukti:** payload POS yang sama dikirim dua kali: keduanya mendapat 201, menghasilkan dua pesanan paid dan dua pembayaran; stok 5 turun menjadi 3.

**Skenario:** respons transaksi pertama hilang atau timeout setelah server menyimpan transaksi, lalu kasir menekan konfirmasi lagi. Tidak ada retry network/5xx otomatis di CSRF helper; pengiriman ulang manual tetap berisiko. Jalur pelanggan juga memakai pembuatan order tanpa identitas checkout, berdasarkan penelusuran kode.

**Perbaikan minimum:** UUID checkout stabil untuk satu percobaan belanja, disimpan dengan unique constraint dan diperiksa dalam transaksi. Pengiriman ulang dengan UUID yang sama mengembalikan hasil lama; transaksi belanja berikutnya memakai UUID baru. Pola `request_id` pada retur bisa dijadikan acuan.

## Temuan prioritas menengah

### A04 — Handler POS membaca pembungkus respons dua kali [P2]

**Lokasi:** [bootstrap.js:14](D:/Project/Webs/Motorku/resources/js/bootstrap.js:14), [POS/Index.jsx:360](D:/Project/Webs/Motorku/resources/js/Pages/POS/Index.jsx:360).

Interceptor sukses mengubah `{ success: true, data: ... }` menjadi `response.data = data`. Handler POS tetap membaca `sale.data.data.order`/`payment`.

**Bukti:** respons asli backend diekspor dari uji Laravel lalu dipakai adapter Axios lokal dengan interceptor bootstrap dan ekspresi POS asli. Pembacaan order/payment menghasilkan `undefined`.

**Dampak:** POS memakai nomor fallback **`ORD-SUCCESS`** dan total lokal, bukan nomor/total server.

**Koreksi setelah pemeriksaan lanjutan:** handler pembayaran daftar pesanan menggunakan `response.data.data` dengan benar. PaymentController tidak mengirim `success:true`, sehingga interceptor tidak membuka pembungkusnya. Probe dengan respons backend kedua endpoint memastikan perbedaan ini. Pernyataan awal bahwa kedua handler bermasalah sudah dikoreksi.

**Perbaikan minimum:** perbaiki pembacaan hasil POS dan konsistenkan kontrak respons. Hindari fallback sukses yang menyembunyikan kegagalan membaca hasil transaksi.

### A05 — Data pembayaran tidak tersedia untuk cetak ulang struk [P2]

**Lokasi:** [OrderResource.php:24](D:/Project/Webs/Motorku/app/Http/Resources/OrderResource.php:24), [Order/Index.jsx:797](D:/Project/Webs/Motorku/resources/js/Pages/Order/Index.jsx:797).

Service memuat relation payments, tetapi `OrderResource` hanya mengirim payment_method. UI cetak membaca `printOrderData.payments`, termasuk amount_received dan change_amount.

**Bukti:** transaksi Rp10.000 dengan uang diterima Rp20.000 berhasil dibuat; GET detail pesanan tidak memiliki `data.payments`.

**Dampak:** cetak ulang struk tidak bisa menampilkan uang diterima dan kembalian yang sebenarnya. Urutan percobaan pembayaran juga perlu dipilih dengan benar, bukan sekadar payment pertama.

**Perbaikan minimum:** kirim rincian pembayaran yang relevan untuk struk melalui resource, lalu cetak pembayaran yang berhasil. Jangan menghitung ulang uang diterima dari data UI saat ini.

### A06 — Pembulatan pajak berbeda antara frontend dan backend [P2]

**Lokasi:** [OrderService.php:191](D:/Project/Webs/Motorku/app/Services/OrderService.php:191), [POS/Index.jsx:179](D:/Project/Webs/Motorku/resources/js/Pages/POS/Index.jsx:179), [Order/Menu.jsx:176](D:/Project/Webs/Motorku/resources/js/Pages/Order/Menu.jsx:176).

UI membulatkan pajak ke rupiah utuh dengan `Math.round()`, sedangkan backend mempertahankan dua digit pecahan. Default persentase saat setting tidak ada juga berbeda: frontend 10%, backend 0%.

**Bukti:** harga Rp10.001, pajak 10%. UI menghitung total Rp11.001; backend meminta Rp11.001,10. Pembayaran uang pas yang ditampilkan UI ditolak 422. Rollback stok/order pada kegagalan ini bekerja.

**Perbaikan minimum:** gunakan satu aturan pembulatan rupiah dan default pajak di seluruh jalur. Total server harus menjadi acuan pembayaran dan struk.

### A07 — Timezone pengaturan hanya diterapkan pada request web [P2]

**Lokasi:** [bootstrap/app.php:53](D:/Project/Webs/Motorku/bootstrap/app.php:53), [routes/api.php:12](D:/Project/Webs/Motorku/routes/api.php:12), [ApplySystemSettings.php:23](D:/Project/Webs/Motorku/app/Http/Middleware/ApplySystemSettings.php:23).

Pengaturan timezone diterapkan melalui middleware web. API order pelanggan tidak memakai middleware tersebut; CLI/scheduler juga tidak melewatinya. Dengan konfigurasi default Jakarta dan toko memilih Makassar/Jayapura, waktu yang tersimpan dapat memakai basis berbeda.

**Bukti:** pada satu instant UTC yang sama, setting toko Jayapura menghasilkan order pelanggan bertanggal **6 Oktober 23:30**, nomor `ORD-20261006-...`, dan pembayaran admin bertanggal **7 Oktober 01:30**.

**Dampak:** tanggal pesanan/pembayaran dan pemeriksaan kedaluwarsa bisa berbeda basis, terutama dekat tengah malam. Kondisi ini tidak muncul bila setting toko dan APP_TIMEZONE sama.

**Perbaikan minimum:** samakan basis waktu untuk web, API publik, dan command. UTC untuk penyimpanan merupakan pilihan yang konsisten, dengan timezone toko untuk tampilan dan batas hari bisnis; perubahan basis data lama perlu diperhitungkan agar tidak menggeser riwayat.

### A08 — Menghapus kategori induk bisa memindahkan kelompok produk [P2]

**Lokasi:** [CategoryService.php:101](D:/Project/Webs/Motorku/app/Services/CategoryService.php:101), [Product.php:51](D:/Project/Webs/Motorku/app/Models/Product.php:51), [migration parent_id:19](D:/Project/Webs/Motorku/database/migrations/2026_09_20_143633_add_parent_id_to_categories_table.php:19).

Penghapusan kategori hanya memeriksa produk yang menempel langsung ke induk. Anak kategori yang dibuat service tidak mewarisi `catalog_group`, sehingga menyimpan default automotive. Saat induk dihapus, FK menjadikan parent_id anak null.

**Bukti:** produk di anak kategori elektronik awalnya ditemukan di electronics. Setelah induk dihapus, produk tidak ditemukan di electronics dan muncul di automotive.

**Perbaikan minimum:** tolak penghapusan kategori yang masih memiliki anak. Jika pemindahan anak memang dikehendaki, jadikan operasi eksplisit dan pertahankan kelompok efektifnya dalam transaksi.

### A09 — Gagal membuat subkategori meninggalkan data setengah tersimpan [P2]

**Lokasi:** [StoreCategoryRequest.php:37](D:/Project/Webs/Motorku/app/Http/Requests/Category/StoreCategoryRequest.php:37), [CategoryService.php:18](D:/Project/Webs/Motorku/app/Services/CategoryService.php:18).

Validasi subkategori belum memeriksa distinct/unique, sedangkan nama kategori memiliki unique constraint. Pembuatan induk dan anak tidak dibungkus transaksi.

**Bukti:** dua subkategori bernama sama dikirim. Respons 500, tetapi induk dan satu anak sudah tersimpan. Pengguna mendapat pesan gagal untuk operasi yang sebagian berhasil.

**Perbaikan minimum:** validasi nama anak terhadap duplikasi dan kategori yang sudah ada; bungkus pembuatan induk beserta seluruh anak dalam satu transaksi.

### A10 — Tiga pengaturan dapat disimpan tetapi tidak mengendalikan fitur [P2]

**Lokasi:** [SettingController.php:105](D:/Project/Webs/Motorku/app/Http/Controllers/Setting/SettingController.php:105), [Setting/Index.jsx:339](D:/Project/Webs/Motorku/resources/js/Pages/Setting/Index.jsx:339), [CustomerMenuController.php:37](D:/Project/Webs/Motorku/app/Http/Controllers/Order/CustomerMenuController.php:37), [app.css:75](D:/Project/Webs/Motorku/resources/css/app.css:75).

| Pengaturan | Hasil penelusuran |
|---|---|
| Aktifkan Katalog QR | `qr_order.enabled=false` tetap memungkinkan POST order pelanggan; dibuktikan dengan respons 201. Controller katalog/order tidak menerapkan switch ini. |
| Aktifkan banner promo | Flag promo_banner.enabled tidak dimuat ke settings katalog dan tidak dipakai saat memberikan/render URL banner; banner lama tetap tersedia meski toggle dimatikan. |
| Ukuran kertas 58/80 mm | Nilai tersimpan, tetapi CSS struk memaksa width 80mm dan tidak membaca pilihan ukuran. |

**Perbaikan minimum:** sambungkan setiap kontrol ke jalur yang benar. Katalog QR membutuhkan aturan akses backend, banner membutuhkan kondisi render, dan printer membutuhkan lebar struk dari setting. Perilaku terhadap pelanggan yang sudah memiliki pesanan harus tetap jelas saat katalog dimatikan.

### A11 — Perubahan kategori tidak membatalkan cache Motor Saya [P2]

**Lokasi:** [CategoryController.php:79](D:/Project/Webs/Motorku/app/Http/Controllers/Category/CategoryController.php:79), [MotorSayaController.php:79](D:/Project/Webs/Motorku/app/Http/Controllers/Motorcycle/MotorSayaController.php:79), [CacheService.php:33](D:/Project/Webs/Motorku/app/Services/CacheService.php:33).

Nama kategori ikut disimpan dalam cache parts motor selama 30 menit. Update kategori tidak membatalkan cache tersebut.

**Bukti:** cache parts dibaca, kategori diubah, API parts dibaca lagi. Database menampilkan nama baru, tetapi API pelanggan masih mengirim nama lama.

**Perbaikan minimum:** panggil invalidasi cache parts yang sudah tersedia setelah mutasi kategori berhasil. Tidak perlu membuat sistem cache baru.

### A12 — Filter tanggal laporan tidak divalidasi [P2]

**Lokasi:** [ReportController.php:95](D:/Project/Webs/Motorku/app/Http/Controllers/Report/ReportController.php:95).

Carbon::parse dipanggil langsung terhadap query tanggal. Input salah menghasilkan exception server, bukan respons validasi.

**Bukti:** `/api/reports?start_date=not-a-date&end_date=2026-10-06` mengembalikan 500.

**Perbaikan minimum:** validasi format tanggal dan urutan start/end sebelum parsing, dengan respons 422 yang dapat ditampilkan frontend. Gunakan pola validasi tanggal dashboard yang sudah ada.

## Bagian yang sudah memiliki perlindungan yang baik

- Pembuatan penjualan POS memakai transaksi database; kegagalan pembayaran dapat membatalkan order dan pengurangan stok.
- Mutasi stok dipusatkan pada InventoryService, dengan locking dan penolakan stok negatif.
- Nomor order/invoice menggunakan sequence dan locking. Duplikasi nomor berbeda dari pengiriman ulang checkout pada A03.
- Pembayaran utama mengunci order dan menolak pembayaran kedua untuk order yang sama.
- Retur memiliki request_id untuk mencegah refund/restock ulang; nilai refund mempertimbangkan sisa nominal dan retur sebelumnya.
- Endpoint status/batal pelanggan memerlukan token akses pesanan; pembatalan pelanggan dibatasi pada pesanan pending yang belum dibayar.
- Login menolak akun tanpa role; middleware akun aktif, policies, dan pembatasan owner/cashier tersedia. Perlindungan akun sendiri/owner terakhir memiliki tes alur biasa.
- CSRF Axios menghapus header token lama dan membatasi recovery 419 satu kali; tidak melakukan retry otomatis untuk network/5xx. Refresh token digabung saat request bersamaan.
- Polling riwayat pelanggan mempertahankan riwayat saat request sementara gagal; polling daftar pesanan membawa filter/page aktif. Layout tidak perlu menunggu fetch badge untuk menampilkan halaman.
- Upload memakai service bersama: JPEG/PNG/WebP, batas input 4 MB dan resolusi, konversi WebP, kualitas/resolusi bertahap hingga hasil di bawah 1.000.000 byte. File baru dibersihkan bila penyimpanan referensi gagal.
- Input uang bersama membersihkan karakter nonangka dan memisahkan format tampilan dari nilai yang dikirim. Aturan nominal pecahan perlu diselaraskan dengan A06.
- Penghapusan produk mempertahankan snapshot item transaksi. Penghapusan master data tidak perlu menghapus riwayat penjualan yang telah dibayar.

Poin-poin ini menunjukkan jalur utama dan beberapa guard sudah berjalan; bukan jaminan seluruh kombinasi request atau perangkat sudah diuji.

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `php artisan test` | **191 tes lolos**, 1.016 assertions, 75,88 detik |
| `node --test tests/js/*.test.js tests/js/*.test.mjs` | **7 tes lolos** |
| `npm run build` | **Lolos**, 2,60 detik |
| `php -l` pada app/bootstrap/config/database/routes/tests | **226 file lolos**, 0 gagal |
| `git diff --check` | **Lolos** |
| Uji reproduksi tambahan Laravel | **13 skenario berhasil direproduksi**, 69 assertions |
| Uji kontrak Axios lokal | Pembacaan respons POS salah; pembacaan pembayaran daftar pesanan benar, sesuai respons masing-masing controller |

**Tes reproduksi sengaja memeriksa kondisi bug yang sedang terjadi. Hasil lolos pada tes tersebut berarti bug terbukti ada, bukan sudah diperbaiki.**

Artefak lokal audit berada di `storage/app/` yang diabaikan Git:

- [FullProjectAuditProbesTest.php](D:/Project/Webs/Motorku/storage/app/FullProjectAuditProbesTest.php)
- [full-project-audit-contract.mjs](D:/Project/Webs/Motorku/storage/app/full-project-audit-contract.mjs)
- [hasil tes project](D:/Project/Webs/Motorku/storage/app/full-project-audit-tests.txt)
- [hasil reproduksi](D:/Project/Webs/Motorku/storage/app/full-project-audit-probes.txt)
- [hasil build](D:/Project/Webs/Motorku/storage/app/full-project-audit-build.txt)

Uji reproduksi dapat dijalankan kembali dengan `php artisan test storage/app/FullProjectAuditProbesTest.php` dan `node storage/app/full-project-audit-contract.mjs`. Jangan menjalankan suite database secara bersamaan dengan suite lain yang memakai database testing yang sama.

## Batas audit dan uji manual berikutnya

Audit ini berfokus pada kode, tes HTTP Laravel, dan kontrak JavaScript. Tidak dilakukan transaksi ke penyedia pembayaran, pengujian printer fisik, atau pengujian browser otomatis menyeluruh.

Setelah perbaikan, cek manual:

1. Dua tab POS, respons checkout hilang, klik konfirmasi ulang, dan perubahan harga saat keranjang sudah terbuka.
2. Pembayaran tunai/QRIS, nominal uang pas, struk baru/cetak ulang, printer 58 dan 80 mm.
3. Retur sebagian/penuh sebelum dan sesudah penyelesaian serta setelah tutup kas.
4. Perubahan timezone WIB/WITA/WIT dekat tengah malam dan command pembatalan order kedaluwarsa.
5. Sesi login kedaluwarsa saat navigasi/simpan form, perangkat offline/online kembali, dan riwayat pelanggan setelah reload.
6. Dua owner memodifikasi akun owner secara bersamaan. Guard owner terakhir saat ini memeriksa sebelum mutasi; skenario concurrency ini belum dibuktikan dengan uji paralel.
7. Kategori elektronik/otomotif, kategori induk dengan anak, cache parts, toggle katalog/banner, dan upload gagal.
8. Layout/skeleton desktop dan ponsel, scrolling dashboard, pagination/filter saat polling. Build tidak membuktikan hasil visualnya.

Belum ada benchmark beban. Audit dependency dan standar kode dilakukan pada pemeriksaan lanjutan di bawah. Katalog/POS masih memuat daftar produk lengkap; kebutuhan pagination server untuk katalog pelanggan sebaiknya ditentukan berdasarkan jumlah produk dan pengukuran payload yang nyata.

## Urutan perbaikan yang disarankan

1. **A01–A03:** konsistensi pembayaran, retur, dan pengiriman ulang checkout.
2. **A04–A07:** kontrak API, struk, pajak, dan waktu transaksi.
3. **A08–A12:** kategori, pengaturan, cache, dan validasi laporan.
4. Tambahkan tes perilaku yang diharapkan untuk setiap perbaikan; uji reproduksi lokal kemudian diubah menjadi tes regresi yang permanen.

Catatan dokumentasi: AGENTS.md masih menyebut soft deletes dan role manager, sementara implementasi saat ini memakai hard delete pada core models dan alur role owner/cashier. Dokumentasi perlu diselaraskan saat perbaikan dilakukan agar tidak mengarahkan perubahan berikutnya ke pola lama.

## Pemeriksaan lanjutan — standar kode, production, dan kompleksitas

Bagian ini ditambahkan setelah pertanyaan lanjutan pengguna. Dua belas temuan di atas adalah temuan alur aplikasi; hasil di bawah mencakup kualitas implementasi, dependency, dan proses rilis.

### Penilaian standar kode

**Belum seluruhnya mengikuti standar project.** Pola services, Form Requests, policies, UUID, dan Inertia sudah digunakan, tetapi penerapannya belum konsisten.

| Pemeriksaan tambahan | Hasil |
|---|---|
| `php vendor/bin/pint --test --format=json` | Gagal: **61 file project** ditandai formatter. Ada 5 file scratch lokal tambahan; total keluaran alat 66. Tidak dijalankan auto-format. |
| `composer validate --strict --no-interaction` | JSON valid, tetapi strict check gagal karena constraint `pusher/pusher-php-server: *` tidak dibatasi. |
| `composer check-platform-reqs --no-dev` | Kebutuhan PHP/extensions lokal yang diperiksa Composer lolos; ini bukan pemeriksaan server production. |
| `composer audit --locked --no-interaction --format=json` | **2 advisory low** pada dependency PHP yang dikunci. |
| `npm audit --json` | **9 paket terdampak: 7 high, 2 moderate, 0 critical**. Ini jumlah paket yang dilaporkan npm, bukan 9 exploit aplikasi yang sudah terbukti. |

Pint menemukan masalah format/import/whitespace, bukan 61 bug runtime. `php -l` lolos berarti sintaks valid; hal itu tidak menyatakan format, desain, keamanan, atau perilakunya benar.

Perbedaan yang terlihat dari penelusuran:

- Validasi/bentuk respons bercampur antara Form Requests, inline validation, resource, raw model, dan `successResponse()`.
- Aturan owner terakhir/akun sendiri berada di controller, bukan sepenuhnya di service seperti ketentuan project. Pengecekan dan mutasinya belum berada dalam satu penguncian bersama untuk skenario request paralel.
- Setting memiliki jalur simpan massal dengan aturan per-field dan jalur update per-ID yang hanya menerima string/nullable. Kedua jalur tidak menerapkan aturan tipe/nilai yang sama.
- Tidak ditemukan konfigurasi lint frontend/static analysis PHP di pipeline saat ini. Menambah alat tersebut harus sesuai kebutuhan; CI yang sudah ada lebih dahulu perlu menjalankan seluruh tes JavaScript yang tersedia.
- Dokumentasi masih menyebut Zod/Zustand, tetapi package.json dan implementasi saat ini tidak menggunakannya. Solusinya menyelaraskan dokumentasi, bukan memasang dependency hanya agar cocok dengan catatan lama.

### B01 — Dependency keamanan perlu ditinjau sebelum rilis

Versi yang diperiksa dari lockfile/instalasi lokal: Laravel **12.64.0**, Flysystem **3.35.2**, Axios **1.18.1**, Tailwind **3.4.19**, Vite **7.3.6**.

Composer melaporkan:

- Laravel: advisory XSS pada halaman debug, terkait `APP_DEBUG=true`; versi yang dipakai masuk rentang terdampak. Maintainer mencantumkan patch Laravel 12.69.0. [Advisory Laravel](https://github.com/laravel/framework/security/advisories/GHSA-jh5r-qr3c-85q8).
- Flysystem: pemeriksaan karakter path dapat dilewati oleh UTF-8 malformed. Upload aplikasi sendiri menghasilkan nama UUID dan direktori yang ditentukan server, sehingga hasil audit dependency belum membuktikan jalur eksploit melalui upload Motorku. [Advisory Flysystem](https://github.com/thephpleague/flysystem/security/advisories/GHSA-cxf4-7mrp-vvpr).

Npm melaporkan paket Axios, baseline-browser-mapping, braces, browserslist, chokidar, fast-glob, micromatch, qs, dan tailwindcss. Beberapa laporan diwarisi dari dependency yang sama; banyak jalurnya terkait tooling Node/build. Axios ikut dibundel ke browser meskipun tercatat di devDependencies, sehingga hanya menjalankan `npm audit --omit=dev` tidak cukup untuk menilai bundle ini. Salah satu advisory Axios membutuhkan kondisi prototype pollution dan penggunaan fetch adapter; audit ini belum membuktikan kondisi tersebut dapat dicapai di aplikasi. [Advisory Axios](https://github.com/axios/axios/security/advisories/GHSA-vh66-26gq-q6x8).

**Tindakan:** lakukan pembaruan terarah dan uji kompatibilitas. Jangan menjalankan `npm audit fix --force` begitu saja: keluaran npm menawarkan major upgrade Tailwind 4 untuk beberapa dependency, sedangkan project memakai Tailwind 3.

### B02 — Seeder akun demo tidak dibatasi untuk lingkungan lokal/testing

**Lokasi:** [UserSeeder.php:22](D:/Project/Webs/Motorku/database/seeders/UserSeeder.php:22), [DatabaseSeeder.php:16](D:/Project/Webs/Motorku/database/seeders/DatabaseSeeder.php:16).

Seeder membuat owner/kasir dengan password demo yang diketahui. `updateOrCreate()` juga memperbarui password akun dengan email yang cocok saat seeder dijalankan ulang. Tidak ada guard environment di seeder.

**Risiko bersyarat:** jika DatabaseSeeder/UserSeeder dijalankan pada production, akun demo dibuat atau password akun yang cocok direset ke nilai demo. Workflow deploy sekarang tidak menjalankan seeder, jadi ini bukan klaim bahwa akun production sudah terkena.

**Perbaikan minimum:** batasi akun contoh ke local/testing; pisahkan provisioning owner production dengan kredensial yang ditetapkan secara aman. Role/permission seeder dapat tetap dipakai sesuai kebutuhan.

### B03 — Pemulihan deployment belum melakukan rollback

**Lokasi:** [deploy-production.yml:87](D:/Project/Webs/Motorku/.github/workflows/deploy-production.yml:87), [deploy-production.yml:116](D:/Project/Webs/Motorku/.github/workflows/deploy-production.yml:116).

Workflow menimpa direktori server secara langsung, menjalankan migration, lalu optimize. Bila deployment gagal, langkah pemulihan hanya menjalankan `artisan up`; langkah tersebut tidak mengembalikan kode/database ke kondisi sebelumnya.

**Risiko:** aplikasi dapat diaktifkan kembali ketika upload atau migration baru selesai sebagian. File yang sudah dihapus dari repository juga tidak otomatis dibersihkan oleh upload overwrite. Ini risiko yang terlihat dari workflow, belum diuji melalui deployment gagal pada server nyata.

Dokumentasi sudah meminta backup database manual. Untuk skala sekarang, backup dan prosedur restore yang sudah diuji dapat memadai; tidak harus langsung membangun sistem deployment rumit. Tetapi menonaktifkan maintenance harus bergantung pada keadaan release yang benar-benar dapat berjalan.

### B04 — CI belum menjalankan seluruh pemeriksaan yang tersedia

**Lokasi:** [ci.yml:54](D:/Project/Webs/Motorku/.github/workflows/ci.yml:54).

CI membangun frontend dan menjalankan tes PHP, tetapi hanya menjalankan `recentOrderStatus.test.js`. Tes CSRF, input uang, riwayat/polling, tanggal, dan kategori POS yang sekarang tersedia tidak semuanya dijalankan di CI. Formatter dan audit dependency juga belum menjadi gate.

Production workflow bersifat manual dan tidak memiliki langkah eksplisit untuk menunggu hasil CI pada SHA release. Required branch checks disebut di dokumentasi, tetapi setting GitHub sebenarnya belum diperiksa dalam audit lokal.

**Perbaikan minimum:** jalankan semua tes JS yang sudah ada dan pastikan SHA yang dirilis telah lulus CI. Tambahkan gate format/security setelah hasil saat ini dibereskan agar gate tidak langsung gagal pada semua perubahan.

### B05 — Kondisi server production belum dapat dinyatakan lolos

Audit membaca kode workflow dan konfigurasi contoh, bukan menginspeksi server production. Hal berikut belum diverifikasi pada server sebenarnya:

- HTTPS, APP_ENV/APP_DEBUG, secure cookie, APP_KEY, domain/proxy dan konfigurasi session.
- Database user/permissions, data migration lama, backup dan uji restore.
- Cron scheduler untuk `orders:expire-stale`; tanpa scheduler, reservasi pesanan kedaluwarsa tidak dilepas otomatis.
- Queue worker apabila queued broadcast tetap digunakan; `queue:restart` tidak membuat service worker baru.
- GD dengan dukungan WebP, memory_limit, batas upload PHP/proxy, storage writable dan symlink public.
- SMTP untuk reset password; `.env.example` menggunakan mail log, sehingga keberhasilan request reset tidak membuktikan email dikirim.
- Alur pembayaran/retur/struk di staging menggunakan build production, bukan Vite development server.

Health check workflow hanya meminta halaman utama. Respons 200 pada halaman tersebut belum membuktikan login, pembayaran, worker, scheduler, atau upload bekerja. Panduan deployment Laravel juga mewajibkan konfigurasi server/debug dan pengelolaan proses sesuai lingkungan. [Laravel deployment](https://laravel.com/framework/docs/12.x/deployment).

### Penilaian overengineering dan kode yang bisa disederhanakan

Arsitektur services + Eloquent + Inertia sesuai ukuran project; tidak ditemukan lapisan repository/interface/factory generik yang berlebihan di kode aplikasi yang diperiksa. Locking stok, sequence nomor, transaksi database, snapshot item, dan lock tutup kas punya tujuan nyata untuk menjaga transaksi. Bagian tersebut perlu dipertahankan.

Bagian yang patut dirapikan:

| Bagian | Bukti dan dampak | Penyederhanaan yang masuk akal |
|---|---|---|
| Komponen halaman sangat besar | Motorcycle/Index 2.226 baris, Product/Index 1.923, POS/Index 1.325. Modal, form, filter, state, dan tampilan terkumpul dalam satu file. | Pisahkan komponen sesuai batas yang sudah nyata, misalnya form/modal dan tabel. Ukuran file saja bukan bukti overengineering; masalahnya tanggung jawab dan duplikasi yang sulit ditelusuri. |
| Realtime belum dikonsumsi UI | echo.js dan paket Echo/Pusher tersedia; tidak ditemukan import/subscription dari halaman. Backend masih mengirim OrderStatusUpdated sementara UI memakai polling. | Pilih jalur update yang benar-benar dipakai. Untuk kebutuhan saat ini polling sudah tersedia; broadcast/dependency yang tidak diperlukan bisa dihapus setelah memastikan tidak ada consumer eksternal. |
| Cache katalog yang tidak digunakan | CATALOG_DATA/TTL_CATALOG masih didefinisikan dan flushCatalog dipanggil, tetapi tidak ada pembacaan cache katalog pada kode saat ini. | Hapus jalur yang sudah tidak berfungsi; jangan menambah cache tanpa pengukuran kebutuhan. Cache settings/parts berbeda karena memang digunakan. |
| Dependency tidak terpakai | Tidak ditemukan pemakaian html2canvas dan @laravel/echo-react pada source yang diperiksa. Plugin @tailwindcss/vite juga tidak dipakai oleh vite.config.js. | Hapus paket setelah memastikan tidak ada penggunaan lain. Tidak perlu migrasi Tailwind hanya karena plugin lain sudah terpasang. |
| Bentuk respons API bercampur | successResponse dibuka otomatis; PaymentController/raw endpoint memakai bentuk lain. A04 adalah salah satu akibatnya. | Tetapkan satu kontrak yang jelas. Hindari wrapper tambahan atau fallback berulang yang menutupi kontrak salah. |
| Alias/sisa fitur lama | Alias processing, referensi DOKU lama, metadata offline sync dan dokumentasi restoran masih sebagian tersisa. | Bersihkan yang sudah tidak dipakai setelah mengecek data lama. Jangan menghapus field database atau kompatibilitas data secara massal tanpa bukti. |

Ini lebih banyak menunjukkan kode yang menumpuk dan pola tidak konsisten daripada arsitektur yang terlalu canggih. Refactor kecil pada bagian yang akan diperbaiki lebih sesuai dibanding menulis ulang project atau menambah framework state management.

### Batas kepastian setelah pemeriksaan lanjutan

- Modul utama telah ditelusuri lintas lapisan dan diuji pada skenario yang disebutkan. Seluruh 226 file PHP milik project di direktori pemeriksaan lolos syntax check.
- Tidak setiap baris source dibuktikan perilakunya, tidak setiap kombinasi state/request diuji, dan dependency vendor tidak direview baris demi baris. Tidak ada angka coverage yang diukur pada run ini.
- Audit dependency membaca database advisory terkini; hasil tersebut memerlukan triage jalur penggunaan, bukan kesimpulan bahwa semua advisory dapat dieksploitasi di aplikasi ini.
- Browser lintas perangkat, load test, request concurrency nyata, deployment failure/rollback, dan server production belum diperiksa secara menyeluruh.

**Status:** belum layak diberi klaim "sudah sepenuhnya sesuai standar" atau "production pasti bebas masalah". Bereskan temuan transaksi prioritas tinggi dan dependency yang relevan, lalu verifikasi staging dan lingkungan server sebelum rilis.

Artefak tambahan lokal: [hasil Pint](D:/Project/Webs/Motorku/storage/app/full-project-audit-pint.json), [validasi Composer](D:/Project/Webs/Motorku/storage/app/full-project-audit-composer-validate.txt), [audit Composer](D:/Project/Webs/Motorku/storage/app/full-project-audit-composer-security.json), [audit npm](D:/Project/Webs/Motorku/storage/app/full-project-audit-npm-security.json).
