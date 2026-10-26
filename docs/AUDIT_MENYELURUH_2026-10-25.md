# Audit menyeluruh Motorku — 25 Oktober 2026

> Arsip audit untuk checkout dan lingkungan pada tanggal di bawah. Skor, temuan, nama lama, dan hasil uji merupakan catatan historis, bukan status production TokoM saat ini. Lampiran `storage/app/private` bersifat lokal dan tidak disertakan dalam repositori. Seluruh temuan lama belum divalidasi ulang untuk rilis terbaru.

**Kesiapan rilis: 68/100, cocok untuk beta terbatas; pengiriman email staging, tooling development yang rentan, dan konsistensi perubahan harga perlu dibereskan sebelum peluncuran publik.** Angka ini penilaian engineering dari bukti di bawah, bukan skor Lighthouse, persentase keamanan, atau sertifikasi.

Audit menemukan 15 kelompok temuan: dua P1 (satu bersyarat pada lingkungan development), sebelas P2, dan dua P3. Sebagian merupakan risiko pertumbuhan data atau kekurangan verifikasi operasional, bukan insiden yang sudah terjadi. Tidak ditemukan P0 atau kebocoran antarusaha pada jalur yang diperiksa; itu tidak menjamin seluruh kemungkinan serangan telah tertutup.

## Objek, cara kerja, dan batas audit

- Checkout: `fix/customer-profile-save`, commit `581d027f60422d04a05844feba8cc3ee237472ad`.
- `develop` remote saat pemeriksaan akhir: `841641dcbb1b44ee63a252fe295f573d136cd27a`. Selisih checkout audit adalah perbaikan submit profil pelanggan, dua penambahan dan satu penghapusan pada satu file React. Audit ini bukan klaim bahwa commit tersebut sudah terpasang di staging.
- Staging yang diperiksa: `https://midnightblue-barracuda-463745.hostingersite.com`. Pemeriksaan server melalui akses SSH yang sudah diizinkan, terbatas pada konfigurasi efektif, metadata filesystem, dan hitungan agregat.
- Review meliputi routes, middleware, policies, autentikasi staff/customer/Google, isolasi usaha, model dan migrasi, transaksi, stok, pembayaran QRIS manual, retur, tutup kas, laporan, import/export, upload, settings/reset/hapus permanen, frontend/PWA, dependency, CI, deployment, backup, dan operasi.
- Inventaris statis mencakup 355 file PHP terlacak pada `app`, `bootstrap`, `config`, `database`, `routes`, `scripts`, dan `tests`, serta sumber frontend terkait. Fokus pembacaan rinci dan probe ada pada jalur kritis. Angka file bukan klaim coverage setiap baris.
- Tidak mengubah implementasi aplikasi, dependency, kredensial, atau data operasional. Probe destruktif hanya berjalan di MySQL `sparepart_testing` dengan guard lingkungan testing. Tidak menjalankan pembayaran, reset, upload pelanggan, deploy, atau load test pada staging.
- Helper diagnostik server ditaruh sementara di `/tmp` dan sudah dihapus. Tidak menyalin nilai rahasia `.env` atau data pribadi ke laporan. Dokumen audit lama milik pengguna tidak diubah.

P1 berarti perlu ditangani sebelum pemakaian publik pada kondisi yang disebutkan; P2 berarti perbaikan penting untuk kebenaran, ketersediaan, atau skala; P3 berarti pengetatan kualitas/aksesibilitas. Label **terbukti**, **berdasarkan kode**, dan **belum terverifikasi** dibedakan pada setiap bagian.

## Verifikasi yang dijalankan

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| Seluruh suite Laravel, konfigurasi dan route cache diisolasi | **471 passed, 4.640 assertions**, 207,91 detik | [Log backend](D:/Project/Webs/Motorku/storage/app/private/audit-php-test-isolated.log) |
| Probe tambahan khusus audit | **9 probe, 25 assertions**, seluruhnya mereproduksi perilaku bermasalah | [Sumber probe](D:/Project/Webs/Motorku/storage/app/private/DeepAuditProbeTest.php), [log](D:/Project/Webs/Motorku/storage/app/private/audit-probes.log) |
| JavaScript regression tests | **111 passed**, 0 failed | [Log JavaScript](D:/Project/Webs/Motorku/storage/app/private/audit-js-test.log) |
| Build produksi | Berhasil; Vite 3,87 detik, 17 skeleton dihasilkan | [Log build](D:/Project/Webs/Motorku/storage/app/private/audit-build.log) |
| Pint pada cakupan CI dan `composer validate --strict` | Lulus | Output pemeriksaan lokal |
| Composer locked dependency audit | **0 advisories, 0 abandoned** | [Hasil Composer](D:/Project/Webs/Motorku/storage/app/private/audit-composer-advisories.json) |
| npm production audit | **0 vulnerabilities** | [Hasil production](D:/Project/Webs/Motorku/storage/app/private/audit-npm-production.json) |
| npm seluruh dependency | **1 paket high: Vite**, melalui lima advisory | [Hasil lengkap](D:/Project/Webs/Motorku/storage/app/private/audit-npm-all.json) |
| Shell regression health check dan cleanup | Lulus, termasuk kegagalan, retry, lock, symlink dan data persisten | [Log shell](D:/Project/Webs/Motorku/storage/app/private/audit-shell-test.log) |
| Benchmark controller dan serialisasi JSON | Dua dataset, empat jalur, lima run setelah warmup | [236 produk](D:/Project/Webs/Motorku/storage/app/private/audit-payload-benchmark.log), [2.000 produk](D:/Project/Webs/Motorku/storage/app/private/audit-scale-benchmark.log) |
| `git diff --check` | Lulus | Pemeriksaan working tree |
| Konfigurasi efektif staging | 13 pemeriksaan deployment OK; **mailer masih `log`** | [Deployment](D:/Project/Webs/Motorku/storage/app/private/audit-staging-deployment.log), [runtime](D:/Project/Webs/Motorku/storage/app/private/audit-staging-runtime.log) |

**Arti probe lulus:** assertion sengaja menangkap kondisi yang salah agar temuan dapat dibuktikan. Ini bukan sembilan regression test yang menyatakan perilaku tersebut sudah benar. Setelah diperbaiki, expectation harus dibalik dan test dimasukkan ke suite permanen. File bukti di `storage/app/private` diabaikan Git dan bukan bagian suite CI.

Run backend awal gagal satu test karena route cache lokal memuat `_debugbar/cache/{key}`. Mengubah `APP_DEBUG` saja tidak menghilangkan route yang sudah tercache. Run final memakai `APP_CONFIG_CACHE` dan `APP_ROUTES_CACHE` terpisah yang belum ada, lalu seluruh 471 test lulus. Cache development pengguna tidak dihapus. Kegagalan awal ini tidak dilaporkan sebagai celah produksi.

## Daftar prioritas

| ID | Prioritas | Temuan | Jenis bukti |
|---|---|---|---|
| A01 | P1 untuk rilis dengan email | Mailer staging `log`, email tidak dikirim | Runtime server |
| A02 | P1 bersyarat | Vite rentan, dev server bind semua interface dan CORS terbuka | Lockfile, konfigurasi, advisory resmi |
| A03 | P2 | Form produk lama menimpa harga terbaru | Probe HTTP dan database |
| A04 | P2 | POS cash dapat selesai dengan nominal berbeda dari yang ditampilkan | Probe dan alur frontend |
| A05 | P2 | Stok awal pecahan diterima, model memotong menjadi integer | Probe HTTP dan database |
| A06 | P2, kasus tipe P3 | Validasi belum melindungi total nominal dan input bertipe salah | Dua probe HTTP |
| A07 | P2 | Preset periode laporan tidak menentukan tanggal server | Probe HTTP |
| A08 | P2 | Pagination API, rentang laporan, dan PDF belum dibatasi memadai | Probe dan kode |
| A09 | P2 saat data membesar | Pencarian memindai kandidat; katalog/POS mengambil semua produk | Kode dan benchmark 236/2.000 produk |
| A10 | P2 | Klaim QRIS belum terverifikasi menahan stok tanpa batas waktu | Probe waktu +90 hari |
| A11 | P2 saat akumulasi | Cache versi lama kedaluwarsa tetap menjadi row database | Probe cache dan runtime driver |
| A12 | P2 operasional | Backup per deploy belum memiliki rotasi otomatis/restore drill terbukti | Kode, metadata server, batas bukti |
| A13 | P2 fungsional | PWA toko ber-slug selalu mulai dari root toko legacy | Manifest dan resolver bisnis |
| A14 | P3 | Dropdown periode belum memenuhi interaksi keyboard listbox | Review komponen |
| A15 | P3 | Disiplin tipe dan isolasi test lokal belum konsisten | Scan file dan run test |

### A01 — Email staging belum terkirim

**Terbukti:** konfigurasi efektif server menunjukkan `environment=staging`, `mailer=log`, `queue_driver=sync`. Driver log mencatat pesan alih-alih mengirimkannya. Ini memengaruhi verifikasi pendaftaran email/password, pemulihan password, dan undangan staf. Login Google dengan identitas yang dipercaya tidak membutuhkan alur email yang sama, sehingga tidak semua login rusak.

Default pada [konfigurasi mail](D:/Project/Webs/Motorku/config/mail.php:17) dan `.env.example` memang `log`; itu aman untuk pengembangan, tetapi tidak memenuhi alur email publik. `app:check-deployment` sendiri menyatakan mail delivery harus diuji terpisah, jadi hasil 13 OK tidak membuktikan pengiriman email.

**Perbaikan:** pasang mailer SMTP/API yang benar di environment hosting, rebuild cache konfigurasi, dan uji satu verifikasi serta satu reset password memakai akun uji. Periksa delivery ke inbox dan tautan callback domain HTTPS. Worker tidak wajib hanya karena ada email: konfigurasi saat ini `sync`; sesuaikan worker bila kemudian memakai queue.

**Gate selesai:** email benar-benar diterima dan tautannya bekerja. Tidak cukup notification fake atau log “sent”. Konfigurasi production terpisah belum diperiksa.

### A02 — Tooling development rentan dan terlalu terbuka secara default

**Terbukti:** [lockfile](D:/Project/Webs/Motorku/package-lock.json:3837) memakai Vite 7.3.6. Audit penuh mendeteksi satu paket high dengan lima advisory, sedangkan audit `--omit=dev` bersih. Itu hasil yang konsisten karena Vite berada di devDependencies.

[Vite config](D:/Project/Webs/Motorku/vite.config.js:7) bind `0.0.0.0` dan `cors: true`; [composer dev](D:/Project/Webs/Motorku/composer.json:56) juga menjalankan server dengan `--host`. Akses aktual tetap bergantung firewall/jaringan. Salah satu advisory resmi menjelaskan bypass pemeriksaan file Windows yang dapat digabungkan dengan masalah escaping shell; untuk advisory tersebut Vite 7.3.7 sudah patched. [Advisory maintainer GHSA-587h-7wmj-h5pm](https://github.com/vitejs/launch-editor/security/advisories/GHSA-587h-7wmj-h5pm).

**Dampak dan batas:** prioritas tinggi pada Windows development jika jalur serangan/editor yang disebut advisory dapat dicapai. Ini bukan bukti Hostinger Linux sudah dieksploitasi atau bundle statis production memiliki endpoint editor. Tidak menjalankan payload command execution saat audit.

**Perbaikan:** naikkan ke rilis Vite yang menutup seluruh advisory lockfile dan kompatibel dengan plugin saat ini; jangan hanya mengganti launch-editor transitif bila Vite membundelkannya. Batasi bind dan CORS development secara default; akses LAN menjadi konfigurasi eksplisit. Tambahkan visibilitas audit dev/build di CI. Audit production harus tetap wajib berhasil sesuai pilihan pengguna.

**Gate selesai:** audit penuh sesuai kebijakan menjadi bersih, build/test tetap lulus, dev server tidak terbuka ke jaringan tak dipercaya tanpa kebutuhan.

### A03 — Edit produk belum mempunyai deteksi konflik

**Terbukti:** produk mula-mula berharga 1.000. Perubahan pertama menyimpan 2.000. Form lama kemudian mengirim nama baru dengan harga snapshot 1.000 dan versi lama; respons tetap 200, harga akhir kembali **1.000**.

[ProductService](D:/Project/Webs/Motorku/app/Services/ProductService.php:91) membaca model lalu menaikkan `sync_version`, tanpa compare terhadap versi klien. [UpdateProductRequest](D:/Project/Webs/Motorku/app/Http/Requests/Product/UpdateProductRequest.php:27) tidak memiliki kontrak versi tersebut. Masalah terjadi bahkan dengan dua tab yang disimpan berurutan, tanpa perlu beban concurrency ekstrem.

**Dampak:** perubahan owner/kasir lain dapat hilang secara diam-diam. Menambah increment atomic saja tidak menyelesaikan kehilangan perubahan.

**Perbaikan:** kirim versi snapshot, lakukan compare-and-update atomik dengan ownership usaha, dan kembalikan konflik 409 ketika versi berbeda. UI harus mempertahankan input dan menawarkan muat ulang/review perubahan.

**Gate selesai:** test dua snapshot memastikan perubahan pertama bertahan dan penyimpanan form kedua ditolak sebagai konflik. Pertahankan proteksi fingerprint import yang sudah ada.

### A04 — Harga POS tunai belum mengikat nominal yang disetujui kasir

**Terbukti:** total yang ditampilkan/disubmit sebagai harapan 10.000, harga server berubah menjadi 15.000, uang diterima 20.000. Penjualan cash tetap **201** dengan total server **15.000**, tanpa langkah konfirmasi ulang.

[OrderService](D:/Project/Webs/Motorku/app/Services/OrderService.php:269) memeriksa `expected_total` untuk order publik. [createPosSale](D:/Project/Webs/Motorku/app/Services/OrderService.php:32) mewajibkan quote untuk QRIS manual, tetapi jalur cash tidak mengikat quote tersebut. [Payload POS](D:/Project/Webs/Motorku/resources/js/Pages/POS/Index.jsx:360) juga belum mengirim expected total. Receipt memakai hasil server, sehingga catatan finalnya benar tetapi modal sebelumnya dapat menawarkan angka berbeda.

**Batas:** ini bukan kemampuan browser memaksa server memakai harga murah; server tetap menghitung harga database. Jika uang diterima kurang dari total aktual, server menolak.

**Perbaikan:** quote/revalidasi keranjang sebelum konfirmasi cash; sertakan total/versi yang disetujui dan tolak perubahan harga/pajak dengan respons yang meminta review. Rekonsiliasi stok setelah sale dan ketika tab kembali aktif.

**Gate selesai:** perubahan harga/tax antara modal terbuka dan submit tidak langsung menyelesaikan transaksi; setelah kasir menyetujui nominal terbaru, pembayaran dan kembalian konsisten.

### A05 — Kontrak stok integer belum ditegakkan pada pembuatan produk

**Terbukti:** POST produk dengan `stock=1.9` mendapat **201**; database menyimpan **1.90**, tetapi model mengembalikan **1**. [Request create](D:/Project/Webs/Motorku/app/Http/Requests/Product/StoreProductRequest.php:38) memakai `numeric`, sedangkan [cast Product](D:/Project/Webs/Motorku/app/Models/Product.php:42) memakai integer. `minimum_stock` memiliki ketidaksesuaian serupa pada create/update. Schema stok masih decimal(10,2).

**Dampak:** stok terlihat berbeda dari nilai tersimpan dan alur log/perhitungan dapat kehilangan pecahan. Pengetatan jalur inventory saja belum menutup pembuatan produk.

**Perbaikan:** untuk model penjualan per pcs sekarang, validasi integer dan batas maksimum sesuai schema di seluruh pintu masuk. Bila stok pecahan memang dibutuhkan, ubah kontrak end-to-end termasuk order, inventory, import, receipt dan UI. Inventarisasi data lama sebelum migrasi; jangan membulatkan stok operasional diam-diam.

**Gate selesai:** create, edit minimum, import, inventory dan order memakai satu kontrak; data lama memiliki rencana normalisasi yang dapat ditinjau.

### A06 — Batas validasi belum mencakup tipe input dan total uang

**Terbukti, kasus pertama (P3):** `customer_name` berupa array pada checkout publik menghasilkan **500**, bukan 422. [StoreCustomerOrderRequest](D:/Project/Webs/Motorku/app/Http/Requests/Order/StoreCustomerOrderRequest.php:23) memanggil `trim()` sebelum validasi string. [StoreOrderRequest](D:/Project/Webs/Motorku/app/Http/Requests/Order/StoreOrderRequest.php:25) memakai pola sama. Tidak ada order yang dibuat dalam probe ini.

**Terbukti, kasus kedua (P2):** harga unit 6.000.000.000.000 masih lolos batas harga produk; quantity 2 menghasilkan subtotal 12.000.000.000.000, melebihi kapasitas decimal(15,2). POS menghasilkan **500**. Transaksi rollback: order tidak tersisa dan stok 10 tetap utuh. Harga ekstrem ini bukan kasus toko sehari-hari, tetapi membuktikan validasi domain uang belum konsisten.

[StorePosSaleRequest](D:/Project/Webs/Motorku/app/Http/Requests/Order/StorePosSaleRequest.php:26) juga menerima `amount_received` numeric tanpa maksimum. Batas harus diterapkan pada nilai hasil agregasi, tax dan kembalian, bukan hanya harga unit.

**Perbaikan:** sanitasi hanya setelah pemeriksaan tipe atau lewat normalizer yang aman; tolak tipe salah dengan 422. Tetapkan batas total transaksi dan nominal diterima sesuai schema/domain, hitung uang dalam satuan rupiah/integer yang terkontrol, lalu validasi sebelum insert.

**Gate selesai:** kedua probe menghasilkan 422 yang jelas tanpa log TypeError/SQL overflow, dan test rollback tetap dipertahankan.

### A07 — Label preset laporan dapat berbeda dari data yang dihitung

**Terbukti:** dengan waktu 25 Oktober, GET `/reports?period=today` mengembalikan `period=today`, tetapi tanggal **1–25 Oktober**, bukan 25 Oktober saja.

[ReportDateRangeRequest](D:/Project/Webs/Motorku/app/Http/Requests/Report/ReportDateRangeRequest.php:14) mengisi awal bulan saat tanggal tidak diberikan. [ReportController](D:/Project/Webs/Motorku/app/Http/Controllers/Report/ReportController.php:97) langsung memakai tanggal tersebut. UI umumnya mengirim kedua tanggal, sehingga bukan semua klik filter salah; URL preset saja/API/integrasi terkena.

**Perbaikan:** resolver preset server yang sama untuk dashboard, orders, dan reports; tanggal eksplisit menjadi sumber untuk custom dengan aturan jelas ketika preset dan tanggal bertentangan.

**Gate selesai:** today/7_days/30_days/this_month/this_year diuji tanpa tanggal eksplisit, termasuk pergantian bulan, zona waktu usaha, dan batas tanggal akhir hari.

### A08 — Beberapa request belum mempunyai batas biaya pemrosesan

**Terbukti:** `/api/products?per_page=0` mengembalikan seluruh 25 produk fixture. [Controller](D:/Project/Webs/Motorku/app/Http/Controllers/Product/ProductController.php:86) membaca integer tanpa min/max dan [service](D:/Project/Webs/Motorku/app/Services/ProductService.php:71) mengartikan nol sebagai `get()`. Produk web mempunyai whitelist sendiri; masalah tersebut ada pada API, bukan whitelist halaman web.

**Terbukti:** rentang laporan custom **1900–2100** diterima 200. [Validasi laporan](D:/Project/Webs/Motorku/app/Http/Requests/Report/ReportDateRangeRequest.php:28) hanya memeriksa format dan urutan. [Export laporan](D:/Project/Webs/Motorku/app/Services/ReportService.php:118) mengambil semua order/items pada rentang tersebut.

**Berdasarkan kode:** [PDF produk](D:/Project/Webs/Motorku/app/Services/ProductSheet/ProductSheetExporter.php:65) mengambil semua produk lalu merender Dompdf secara sinkron. XLSX/CSV memakai `lazy(200)` dan tidak memiliki pola all-memory yang sama. Endpoint administratif ini dibatasi role; audit tidak membuktikan anonymous DoS melalui PDF.

**Perbaikan:** min/max pagination yang konsisten di listing API; batas rentang tanggal; batas baris/estimasi ukuran PDF. Ekspor besar perlu queue dengan download privat dan cleanup. Cocokkan batas dengan PHP memory/time limit hosting.

**Gate selesai:** nol/negatif/angka sangat besar ditolak atau dinormalisasi aman; PDF dan laporan besar memiliki perilaku terukur, bukan timeout tanpa penjelasan. Tetapkan batas sebagai aturan produk, bukan menyembunyikan data secara diam-diam.

### A09 — Biaya katalog dan pencarian masih bertumbuh terhadap seluruh data

**Terukur pada data sintetis lokal:** 2.000 produk dengan dua mapping per produk menghasilkan median pencarian luas **5,14 detik / 37 query** untuk kata `Benchmark` yang cocok dengan seluruh fixture. Katalog publik median **1,62 detik**, POS **1,57 detik**; JSON mentah masing-masing **1,78 MB** dan **1,52 MB**. Ini bukan latency Hostinger atau estimasi semua jenis pencarian. Dataset kecil, 236 produk, jauh lebih ringan; rincian metodologi dan angka di bagian performa.

**Berdasarkan kode:** [CatalogSearchService](D:/Project/Webs/Motorku/app/Services/CatalogSearchService.php:243) membaca kandidat dalam chunk 250, melakukan scoring PHP, mengumpulkan ID matching, lalu membangun CASE untuk ranking. Chunk membatasi batch, bukan total CPU/query atau banyaknya ID ranking. Pagination hasil akhir belum membatasi pekerjaan awal tersebut.

[Katalog publik](D:/Project/Webs/Motorku/app/Http/Controllers/Order/CustomerMenuController.php:59) menghitung penjualan historis dan mengambil seluruh produk aktif beserta mapping. [POS](D:/Project/Webs/Motorku/app/Http/Controllers/Dashboard/PosController.php:25) sudah memangkas kolom, tetapi masih mengambil semua produk. Progressive rendering hanya mengurangi komponen yang dipasang, bukan JSON awal/query seluruh katalog.

**Perbaikan:** ukur pada data realistis; candidate prefilter terindeks sebelum fuzzy ranking, endpoint pencarian/pagination, lazy mapping/detail, dan agregat penjualan dengan invalidasi yang tepat. Jangan mengorbankan pencarian berdasarkan mapping motor atau mencache harga/stok tanpa rekonsiliasi.

**Gate selesai:** p50/p95, ukuran payload, memory dan jumlah query terukur pada beberapa ukuran dataset realistis. Jangan menjanjikan percepatan sebelum mengukur. Benchmark di bawah membuktikan biaya lokal pada fixture tersebut, tetapi belum menunjukkan bottleneck server staging.

### A10 — Laporan “sudah bayar” menahan reservasi tanpa batas review

**Terbukti:** order publik qty 1 dari stok 5 dibuat, lalu pemegang token mengirim klaim pembayaran tanpa dana terverifikasi. Setelah waktu testing dimajukan **90 hari**, `expire()` tetap false dan stok tetap **4**.

[CustomerOrderService](D:/Project/Webs/Motorku/app/Services/CustomerOrderService.php:32) mencatat `payment_review_requested_at`. Scope stale mengecualikan review sehingga [expiry](D:/Project/Webs/Motorku/app/Services/OrderCancellationService.php:43) tidak melepas stok. Tujuannya masuk akal untuk melindungi pelanggan yang sungguh membayar, tetapi belum ada batas antrean, umur review, atau eskalasi yang menjamin penyelesaian.

**Batas:** status tidak otomatis berubah menjadi lunas; kasir tetap harus memeriksa dana. Ada throttle IP dan kasir dapat menolak laporan. Pada snapshot staging tidak ditemukan review berumur lebih dari 24 jam. Risiko yang dibuktikan adalah reservasi bisa tertahan, bukan uang tercatat masuk secara palsu.

**Perbaikan:** kebijakan review dengan SLA/alert, antrean prioritas, pembatasan reservasi berulang dan prosedur penolakan. Jangan otomatis membatalkan klaim yang mungkin benar-benar dibayar tanpa jalur rekonsiliasi kasir.

**Gate selesai:** simulasi klaim palsu berulang dan keterlambatan kasir tidak mengunci stok tanpa jalur penyelesaian terpantau; dana yang benar-benar masuk tetap dapat direkonsiliasi.

### A11 — Expiry cache database tidak otomatis menghapus key versi lama

**Terbukti:** probe memakai database cache, menulis parts key versi lama, mengganti versi, lalu melewati TTL. Row expired versi lama masih ada karena tidak pernah dibaca kembali. Implementasi DatabaseStore menghapus key expired ketika key itu diminta; pergantian versi membuat key lama tidak lagi diminta.

[CacheService](D:/Project/Webs/Motorku/app/Services/CacheService.php:57) mengganti namespace versi untuk invalidasi; TTL parts 1.800 detik. [Scheduler](D:/Project/Webs/Motorku/routes/console.php:11) belum mempunyai cleanup row cache expired. Runtime staging memakai **database cache**; snapshot audit hanya 5 row, 1 expired, sehingga ini belum menjadi pembengkakan besar saat ini.

**Dampak:** row dan payload lama dapat terus bertambah seiring invalidasi dan pembacaan mapping. Ini berbeda dari Redis yang mempunyai TTL native; jangan menyamakan perilakunya.

**Perbaikan:** cleanup expired database cache secara bertahap dan terjadwal, atau desain invalidasi/store dengan expiry fisik yang sesuai. Hindari global flush yang mengganggu usaha lain, rate limits, atau lock.

**Gate selesai:** setelah banyak siklus baca/invalidation, cleanup menghapus row lama tanpa menghapus key aktif/usaha lain; verifikasi ukuran tabel stabil setelah periode retensi.

### A12 — Pertumbuhan backup dan kesiapan pemulihan belum tuntas

**Terbukti dari kode/runtime:** [deploy-release.sh](D:/Project/Webs/Motorku/scripts/deploy-release.sh:14) membuat SQL dan arsip kode setiap aktivasi. Tidak ada rotasi otomatis pada script/scheduler proyek. Pemeriksaan akhir staging menemukan **117 file, sekitar 398 MB** di `.deploy-backups`. Jumlah file bukan jumlah deploy, karena satu backup dapat terdiri dari beberapa file.

**Yang sudah benar:** directory backup mode 700, `.env` mode 600, backup di luar public; permintaan web `.deploy-backups/` berakhir 404 setelah redirect. Cleanup incoming release sudah dibatasi path/SHA, lock, dan proteksi symlink/data persisten; shell test lulus. Satu incoming directory terlihat saat snapshot dan dapat merupakan deploy aktif; keberadaannya sendiri bukan bukti cleanup gagal. Backup persisten berbeda dari temporary incoming yang dibersihkan setelah deploy.

**Belum terverifikasi:** salinan backup off-host yang dapat dipulihkan, jadwal rotasi hPanel di luar kode, dan restore drill sukses. Prosedur rollback manual sudah ada pada [dokumentasi](D:/Project/Webs/Motorku/docs/GITHUB_WORKFLOW.md:92); audit tidak menyatakan rollback sama sekali tidak tersedia.

**Perbaikan:** retensi berbasis umur/jumlah/ruang dengan perlindungan backup terbaru dan deploy aktif, salinan terpisah, serta restore drill staging ke database sementara. Jangan menghapus seluruh release/backup hanya untuk menurunkan inode.

**Gate selesai:** ada bukti restore kode+database+upload yang cocok, target waktu kehilangan data/pemulihan, dan rotasi yang tidak menghapus satu-satunya recovery point.

### A13 — PWA belum mempertahankan toko yang dipasang

**Berdasarkan kode:** [manifest](D:/Project/Webs/Motorku/public/manifest.webmanifest:2) menetapkan `id: /` dan `start_url: /`. [Shell](D:/Project/Webs/Motorku/resources/views/app.blade.php:24) memakai manifest global yang sama. Sementara katalog usaha lain berada di `/s/{businessSlug}` dan [ResolveBusiness](D:/Project/Webs/Motorku/app/Http/Middleware/ResolveBusiness.php:25) memilih usaha legacy untuk root tanpa slug.

**Dampak:** PWA yang dipasang saat membuka usaha lain akan diluncurkan dari root legacy, bukan mempertahankan toko yang dipilih. Ini salah navigasi/konteks toko; bukan bukti akses ke data admin usaha lain.

**Perbaikan:** tentukan apakah PWA adalah aplikasi platform tunggal dengan pemilihan toko, atau aplikasi per toko dengan manifest/id/start_url yang mempertahankan slug. Selaraskan cart, ikon, nama aplikasi dan deep link.

**Gate selesai:** instal dari dua toko berbeda di Android/desktop, tutup dan buka ulang, lalu pastikan konteks toko/keranjang benar. Pengujian instalasi perangkat nyata belum dilakukan pada audit ini.

### A14 — Dropdown periode masih memiliki kekurangan keyboard

**Berdasarkan kode:** [PeriodSelectDropdown](D:/Project/Webs/Motorku/resources/js/Components/PeriodSelectDropdown.jsx:81) memberi role listbox/option dan menangani Escape, tetapi belum memindahkan fokus ke pilihan, memberi navigasi ArrowUp/Down/Home/End, atau mengembalikan fokus setelah pilihan. Tampilan mobile menyerupai modal tanpa focus management; Tab dapat berpindah ke elemen belakangnya.

**Perbaikan:** gunakan primitive Listbox/Popover yang sesuai atau lengkapi pola interaksi. Test keyboard dan screen reader; atribut ARIA saja tidak menciptakan perilaku select. Overlay pada baris 113 juga masih memakai opacity/backdrop blur, bertentangan dengan aturan visual solid di AGENTS.md.

**Gate selesai:** pengguna keyboard dapat membuka, berpindah, memilih, membatalkan dan kembali ke kontrol awal dengan urutan fokus yang jelas. Belum ada pengujian pembaca layar/perangkat fisik di sesi ini.

### A15 — Kualitas kode dan reproduksibilitas pengujian perlu ditingkatkan

**Terbukti:** 181 dari 355 file PHP terlacak dalam cakupan scan tidak memiliki `declare(strict_types=1)`, berlawanan dengan AGENTS.md. Ini hitungan konvensi, bukan 181 vulnerability. Pint default tidak menegakkan aturan tersebut.

Konfigurasi [PHPUnit](D:/Project/Webs/Motorku/phpunit.xml:23) sudah mengunci database testing; [TestCase](D:/Project/Webs/Motorku/tests/TestCase.php:13) memverifikasi nama database dan environment sebelum test. Namun cache route lokal masih dapat memengaruhi inventaris route pada test, seperti kegagalan Debugbar awal audit.

**Perbaikan:** wrapper perintah test dengan cache path testing tersendiri, pemeriksaan strict-types bertahap, type hints dan static analysis yang disesuaikan baseline. Pecah komponen besar mengikuti batas domain saat disentuh oleh perbaikan, bukan refactor seluruh UI sekaligus.

**Perbaikan yang sudah terlihat:** shell Blade sekarang 339 baris dan skeleton dihasilkan dari 17 komponen bersama, sehingga masalah duplikasi shell besar pada audit lama sudah berkurang. Tetap perlukan pemeriksaan cold reload vs navigasi Inertia.

**Gate selesai:** suite lokal/CI menghasilkan inventaris route sama tanpa bergantung cache development, dan file baru mematuhi standar tipe. Penambahan test harus menutup behavior nyata, bukan sekadar meniru implementasi.

## Performa: hasil ukur dan batas kesimpulan

Benchmark lokal memakai aplikasi warm dan MySQL testing, masing-masing dataset 236 dan 2.000 produk, 12 motor, dua mapping per produk. Lima pengukuran setelah warmup untuk setiap kasus. Waktu hanya controller dan serialisasi JSON, bukan seluruh middleware, jaringan, TLS, rendering React, atau perangkat pengguna. Fixture di-rollback setelah masing-masing benchmark, dan kedua proses selesai exit 0.

| Produk | Jalur | Median | Query/run | JSON mentah | Gzip lokal |
|---:|---|---:|---:|---:|---:|
| 236 | Katalog publik | 90,28 ms | 8 | 210.125 byte | 9.558 byte |
| 236 | POS | 80,28 ms | 6 | 180.069 byte | 9.209 byte |
| 236 | Partial listing produk admin | 10,54 ms | 4 | 15.850 byte | 1.386 byte |
| 2.000 | Katalog publik | 1.617,33 ms | 8 | 1.782.003 byte | 73.994 byte |
| 2.000 | POS | 1.571,39 ms | 6 | 1.524.744 byte | 70.356 byte |
| 2.000 | Partial listing dengan pencarian luas | 5.139,84 ms | 37 | 15.907 byte | 1.400 byte |
| 2.000 | Partial listing tanpa pencarian | 36,29 ms | 4 | 15.907 byte | 1.400 byte |

Pencarian luas memakai kata `Benchmark`, cocok dengan semua nama produk fixture, sehingga mewakili kasus banyak kecocokan. Response tetap kecil karena pagination, tetapi biaya mencari/ranking tetap besar. Ini menunjukkan masalah tidak cukup diselesaikan dengan mengecilkan JSON hasil atau progressive rendering.

Fixture memiliki deskripsi berulang sehingga kompresi sangat baik; jangan memakai angka gzip ini sebagai jaminan ukuran katalog nyata. Pengukuran ini belum mewakili histori penjualan besar, ragam nama/mapping nyata, semua pola pencarian, atau perangkat pengguna. Belum ada p95 produksi, EXPLAIN data operasional, beban kasir serentak pada hosting, maupun memory benchmark PDF besar. [Sumber benchmark 2.000 produk](D:/Project/Webs/Motorku/storage/app/private/audit-scale-benchmark.php) adalah salinan harness benchmark proyek yang memakai guard testing dan rollback.

Build sudah page-split. Chunk `vendor-inertia` sekitar 350,74 kB mentah / 116,66 kB gzip; `AuthenticatedLayout` 108,18 / 25,27 kB; jsQR 130,73 / 47,46 kB. Ukuran itu bukan total download setiap halaman karena pemuatan bergantung import/route. Optimasi berikutnya harus didasarkan waterfall dan LCP/INP/CLS, bukan sekadar memecah semua file.

Skor Hostinger desktop 91/mobile 77 dari percakapan sebelumnya tidak diukur ulang dalam audit ini. Tidak mengklaim penyebab atau kenaikan skor tertentu tanpa Lighthouse/browser trace yang baru.

## Kontrol penting yang telah diperiksa

- **Isolasi usaha:** middleware memilih konteks admin dari user, query `shop` tidak dapat memindahkan admin ke usaha lain; scope model, aturan foreign ID, pivot, cache, file dan sequence memakai usaha. Test isolasi bisnis dan migrasi lulus. Akun customer global adalah desain yang disengaja; histori order tetap berdasarkan customer dan toko, tidak diklaim dari kemiripan email/telepon.
- **Autentikasi:** Google memakai state/PKCE, attempt timeout dan tidak menautkan akun existing hanya karena email cocok. Linking membutuhkan alur akun yang sah. Staff nonaktif dicabut session/token; endpoint Sanctum memeriksa active account. Flow email punya blocker runtime A01 meskipun test fake lulus.
- **Checkout:** harga/tax dihitung server, duplicate line quantity digabung, row lock dan transaction menjaga stok. Idempotency mencakup usaha, channel, actor dan fingerprint; retry tidak hanya mengandalkan tombol disabled. Bukti suite mencakup checkout bersamaan, tetapi bukan stress test banyak proses di hosting.
- **Pembayaran/retur:** pembatalan/lunas/retur memiliki pemeriksaan status, lock dan rollback. Refund dibatasi quantity tersisa dan amount, tutup kas memblokir perubahan hari terkait. QRIS tetap membutuhkan kasir memverifikasi dana; audit tidak menambahkan asumsi webhook otomatis.
- **Hapus/reset:** backend mempunyai kontrol hapus, per-usaha dan referential integrity; historis transaksi menyimpan snapshot. Reset transaksi memerlukan password owner dan throttle. Produk/referensi/stok bukan sasaran reset transaksi. Tidak menjalankan reset operasional saat audit.
- **Upload/import:** MIME/ukuran/dimensi, batas megapiksel dan WebP re-encode; path deletion dibatasi ownership. Reader spreadsheet membatasi ZIP/XML/row/cell dan menolak pola traversal/DOCTYPE berbahaya. Preview/import mempunyai ownership/fingerprint. CSV/XLSX memperlakukan teks yang berpotensi formula secara defensif.
- **Browser/security:** CSP nonce, nosniff, frame policy, secure cookie dan no-store untuk jalur privat tersedia. Scan sumber tidak menemukan `dangerouslySetInnerHTML`, `document.write`, atau eval JavaScript. SQL ranking memakai binding; keberadaan `orderByRaw` sendiri tidak membuktikan injection.
- **PWA/privacy:** service worker tidak menyimpan respons API/halaman privat dalam cache offline. Ini bukan dukungan POS offline penuh.
- **CI/deploy:** dependency production audit tetap hard failure; health check menguji Laravel dan storefront, bukan menerima halaman challenge 200; production workflow mengecek CI sukses untuk SHA terkait. Script cleanup membatasi penghapusan ke incoming release yang diizinkan.

## Verifikasi server dan yang masih belum diketahui

Snapshot staging: debug false, secure cookie true, session database, CSP enforce true, queue sync, cache database, mail log. Terdapat tiga usaha; hitungan stale orders nol dan review QRIS lebih dari 24 jam nol. Angka agregat ini tidak membuktikan scheduler berjalan setiap menit.

HTTP yang diuji: root dan `/up` 200; `/.env` dan `/.git/config` 403; `/composer.json` serta `/vendor/autoload.php` 404; `/storage/logs/laravel.log` 403; `/.deploy-backups/` redirect lalu 404. Ini membuktikan path-path tersebut tidak mengekspos isi pada snapshot pemeriksaan, bukan seluruh kemungkinan nama backup/path.

Perintah `crontab` tidak tersedia pada SSH hosting ini. Scheduler dapat diatur melalui hPanel di luar shell; **status scheduler belum dapat disimpulkan**, bukan terbukti tidak ada. Perlu lihat konfigurasi hPanel atau drill order uji yang terkontrol. Tidak menjalankan drill itu pada order pelanggan nyata.

File terlacak yang cocok pola environment adalah `.env.example`; tidak ditemukan private-key header dalam scan konten terlacak atau riwayat path `.env`. Ini bukan full-history entropy secret scan. Tidak memeriksa isi GitHub secrets, semua aturan firewall/WAF, konfigurasi SMTP provider, domain OAuth semua environment, backup hPanel off-host, atau seluruh log pribadi.

E2E browser untuk Google nyata, delivery email, install PWA, screen reader, dan responsive semua viewport belum dijalankan di sesi ini. Profil pelanggan backend dan perubahan submit frontend diperiksa, tetapi belum diklaim teruji end-to-end dengan akun Google nyata. Status CI GitHub untuk commit checkout tidak dijadikan bukti kelulusan; hasil yang dicatat adalah run lokal di atas.

## Perbandingan dengan audit 23 Oktober

Dokumen lama tetap utuh. Temuan tidak otomatis dianggap masih ada hanya karena pernah dilaporkan.

| Topik lama | Status pada checkout audit sekarang |
|---|---|
| Bearer token staff nonaktif | Kontrol active-account/revoke sudah ada; suite lulus |
| Token polling customer dalam URL frontend | Frontend sekarang memakai header `X-Customer-Token`; server masih menerima query untuk kompatibilitas |
| Cash disabled diabaikan | `assertCashEnabled` sudah ada dan regression test lulus |
| Dependency enam paket high | Audit kini satu paket high Vite; rantai lain tidak dilaporkan rentan pada snapshot ini |
| Harga publik/cart dan QRIS quote | Guard/reconciliation sudah ada; sisa masalah cash ada di A04 |
| Preset laporan, pecahan stok, pagination/ekspor, lost update | Masih relevan; beberapa sekarang dibuktikan dengan probe HTTP baru |
| Skeleton shell duplikatif | Sudah jauh diperkecil dan menggunakan generator bersama |
| Incoming release/inode | Proteksi cleanup dan test sudah tersedia; backup persisten perlu retensi terpisah |

## Urutan penanganan dan syarat rilis

1. **Tutup blocker environment/development:** aktifkan delivery email dan uji penerima nyata; patch Vite dan batasi eksposur dev server. Ini dua pekerjaan berbeda, tidak perlu menunggu refactor UI.
2. **Lindungi nilai transaksi:** optimistic locking edit produk, quote cash POS, kontrak stok, batas nominal dan sanitasi aman. Pindahkan probe terkait ke regression suite dengan expectation yang benar.
3. **Batasi biaya request dan reservasi:** resolver laporan, pagination, rentang/export, dan kebijakan review QRIS. Ukur katalog/search dengan data realistis sebelum mengubah algoritme.
4. **Pastikan operasi berumur panjang:** prune cache expired, retensi/off-host backup dan restore drill; verifikasi scheduler hPanel. Cleanup tidak boleh menyentuh upload, `.env`, database aktif atau satu-satunya backup.
5. **Tuntaskan perilaku perangkat/pengguna:** konteks PWA per toko, keyboard dropdown, cold load/navigation skeleton, dan alur profil customer di browser.

Rilis publik sebaiknya menunggu A01 selesai, A02 dimitigasi sesuai lingkungan, A03–A05 mempunyai regression test, dan satu alur lengkap pendaftaran–verifikasi–checkout–konfirmasi kasir–retur serta restore drill teruji di staging. Audit ini menyediakan bukti dan daftar perbaikan; implementasi perbaikan temuan belum dilakukan pada sesi ini.
