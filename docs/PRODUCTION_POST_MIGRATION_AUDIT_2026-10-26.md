# Pemeriksaan production setelah perpindahan ke TokoM

Tanggal: 26 Oktober 2026, Asia/Jakarta.
Target: https://tokopojok.shop/.

## Kesimpulan

Konfigurasi dasar yang diperiksa lulus. Backup production di luar hosting dan latihan restore lokal sudah berhasil. Regresi lokal lulus 518 tes PHP (4.940 assertions), 123 tes JavaScript, dan build production. Deploy normal v1.0.0 berhasil. Benchmark lokal kemudian menemukan hambatan pencarian berperingkat; perbaikan indeks disiapkan di branch terpisah dan belum dideploy. Pencarian luas dengan mapping masih perlu optimasi lanjutan. Tidak memberikan skor kesiapan atau skor Lighthouse yang tidak diukur.

Pemeriksaan dilakukan tanpa login sebagai owner, membuat pesanan production, mengubah pengaturan usaha, atau mengirim email. Backup production disalin ke komputer lokal yang terlindungi dan diuji pada database sementara. Deploy normal yang diotorisasi menjalankan prosedur cache, migrasi dan restart worker yang sudah ada. Pengukuran browser dilakukan lokal terhadap halaman publik. Tidak mengunggah kode atau data usaha ke layanan audit eksternal.

## Bukti konfigurasi yang lulus

- `php artisan app:check-deployment` pada production sukses: environment benar, debug nonaktif, URL HTTPS, APP_KEY tersedia, secure cookies, session database, WebP, storage writable/link, transport email nyata, database reachable, owner aktif dan tanpa password demo yang terdeteksi oleh command.
- Tidak ada migration tertunda. Snapshot data saat diperiksa: 1 akun admin, 0 produk dan 0 pesanan. Terdapat 1 upload publik. Ini membatasi kesimpulan tentang beban toko yang sudah berjalan.
- Heartbeat scheduler terbaru tersedia. Lock worker cron ditemukan, jobs dan failed_jobs masing-masing 0. Keberhasilan memproses job nyata dan pengiriman email belum diuji pada sesi audit ini.
- `/.env` dan `/.git/config` mengembalikan 403. GET JSON `/api/settings` dan `/api/user` sebagai guest mengembalikan 401. `/settings` mengarahkan guest keluar halaman privat. Ini pemeriksaan permukaan, bukan bukti seluruh kontrol akses lulus pentest.
- CI push main `64da84a4fd24f1ddcb9dfcc91d9a119b4e4183e1` sukses, run 40323330074.
- Hosted staging sudah dipensiunkan. Pengaman production tetap bekerja jika folder staging tidak ada.

## Selesai: backup production dan latihan pemulihan lokal

Bukti awal: folder `.deploy-backups` production belum berisi file. Backup penuh 605 MB yang dibuat sebelumnya adalah backup staging. Snapshot production baru `readiness-20261026-3d1de128` kemudian dibuat dengan SQL, kode/dependency, aset hasil build, upload dan konfigurasi privat termasuk APP_KEY. Arsip sekitar 11 MB dan SQL sekitar 97 KB disalin ke folder lokal privat, di luar Git, dengan ACL khusus pemilik. SHA-256 dan integritas arsip cocok.

Hasil latihan: SQL diimpor ke database MySQL lokal baru. Laravel dari arsip dijalankan memakai login database SELECT-only, email dinonaktifkan dan kredensial Google dikosongkan. Jumlah baris 15 tabel cocok; 1 hash upload cocok; APP_KEY berhasil mendekripsi probe; role owner aktif tersedia; migration tertunda 0. Database dan login latihan kemudian dihapus. Arsip asli tetap utuh dan panduan pemulihan ada dalam folder backup privat.

Batas: latihan ini membuktikan snapshot dapat dipulihkan di lokal, bukan failover production atau target waktu pemulihan. Backup terjadwal provider, cakupan, retensi dan restore dari hPanel belum diverifikasi. Snapshot manual ini tidak otomatis mengaktifkan backup harian. Sebelum restore nyata, rekonsiliasi transaksi/upload setelah waktu snapshot tetap wajib diputuskan.

## Selesai: pembuktian deploy normal. Batas pemulihan tetap berlaku

Bukti awal: run instalasi 40314306852 gagal saat aktivasi karena fungsi PHP symlink/exec Hostinger dinonaktifkan, lalu dipulihkan manual. Setelah snapshot dan restore lokal terbukti, rilis normal v1.0.0 dari main `64da84a4fd24f1ddcb9dfcc91d9a119b4e4183e1` dijalankan dengan `first_install=false`. [Run 40330432844](https://github.com/nabielnx/Motorku/actions/runs/40330432844) selesai success, termasuk pembuatan backup, aktivasi, health check, pembersihan incoming dan tag release.

Verifikasi sesudah rilis: `/` adalah respons aplikasi Inertia HTTP 200; `/up` HTTP 200 berisi `Application up`; gambar QRIS tersimpan HTTP 200 `image/webp`. Jumlah baris 15 tabel tetap sama dengan snapshot, hash upload cocok dan APP_KEY tetap. Tidak ada maintenance atau migration tertunda. Scheduler recent, queued_jobs 0 dan failed_jobs 0. Satu pasangan backup SQL/kode normal ditemukan.

Batas: tidak melakukan rollback pada production aktif. Restore lokal membuktikan SQL/kode/upload/kunci dapat dipulihkan bersama, tetapi prosedur cutover dengan transaksi baru tetap perlu rekonsiliasi dan persetujuan tindakan pemulihan.

## Prioritas 3: regresi alur bisnis setelah perubahan lingkungan

Bukti: konfigurasi dan endpoint publik sudah diperiksa; sesi audit ini tidak memakai akun test production dan tidak membuat transaksi. Suite lokal memakai database MySQL `tokom_testing` dengan guard nama database. Semua 518 tes PHP lulus (4.940 assertions), termasuk isolasi usaha, akun customer, checkout, stok/pembayaran/QRIS, upload, impor dan reset transaksi. Semua 123 tes JavaScript lulus dan build Vite beserta 17 skeleton berhasil. Ini tidak menggantikan uji UI autentikasi pada domain production.

Tindakan: gunakan build production lokal dan akun/data fixture untuk owner vs customer, pemisahan antar usaha, login Google/email, verifikasi/reset password, upload dan penghapusan file, impor/update stok, POS tunai/QRIS, konfirmasi manual dana masuk, pembatalan/expiry, invoice, laporan dan ekspor PDF. Uji mobile dan desktop. Untuk uji email atau transaksi di production, tentukan akun dan data uji yang aman terlebih dahulu.

QRIS tetap menggunakan pemeriksaan dana masuk oleh kasir. Perubahan domain/konfigurasi tidak menambahkan konfirmasi pembayaran otomatis.

## Prioritas 4: baseline performa yang mewakili pemakaian

Pengukuran yang benar-benar diperoleh:

- Halaman: beranda katalog yang belum memiliki produk.
- Chrome lokal, viewport mobile 390 × 844, CPU slowdown 4×, jaringan Slow 4G.
- Satu trace reload setelah halaman dan challenge CDN sebelumnya sudah dimuat. Cache tidak dibersihkan, sehingga ini bukan cold-load test.
- Observed LCP 1.164 ms; TTFB 133 ms; render delay 1.031 ms; CLS 0,00.
- Tidak ada data lapangan CrUX pada hasil tool. INP tidak dapat disimpulkan karena interaksi representatif tidak direkam.
- Pada kunjungan anonim pertama, browser sempat menampilkan halaman verifikasi CDN. Trace reload di atas tidak mewakili seluruh tambahan waktu kunjungan pertama tersebut.

Tindakan: ukur ulang cold dan warm load mobile/desktop, serta POS, daftar pesanan, pencarian/filter dan ekspor dengan data lokal yang mendekati skala penggunaan. Catat jumlah data, kondisi jaringan, cache, dan hasil beberapa pengukuran. Periksa tantangan CDN untuk pengunjung sah tanpa menonaktifkan semua perlindungan. Skor Hostinger staging lama tidak boleh dianggap skor production baru.

### Temuan dan perbaikan pencarian dari benchmark lokal

Dataset fiktif: 2.000 produk, 12 motor, dua mapping per produk. Data dibuat dalam transaksi `tokom_testing` dan di-rollback. Tidak dimasukkan ke production. Aplikasi warm, satu warmup lalu lima sampel. Waktu di bawah hanya controller dan serialisasi JSON, tidak mencakup middleware penuh, jaringan, browser atau email.

Query lama untuk pencarian luas teramati masih executing setelah 205 detik. Probe terpisah dengan SELECT dibatasi 5 detik juga timeout. EXPLAIN menunjukkan join `VARBINARY(36)` ke UUID teks membuat produk dibaca lewat indeks usaha dengan sekitar 1.000 kandidat per lookup pada fixture tersebut, bukan lookup primary key. Perubahan menjadi `VARCHAR(36)` membuat EXPLAIN memakai `PRIMARY`, `eq_ref`, satu kandidat per lookup. Pada probe SQL yang sama, varian teks menyelesaikan 16 hasil dalam 96,58 ms, sedangkan varian lama mencapai batas 5 detik. Ini hasil lokal, bukan jaminan latensi hosting.

Perbaikan tidak mengubah UUID, skema, skor, scope usaha atau stok. Parameter tetap memakai binding. Sintaks VARCHAR JSON_TABLE dan kesamaan collation sudah diperiksa lewat SELECT konstan dan metadata pada MariaDB production 11.8.9. Tes pencarian/paginasi lulus 15 tes (325 assertions), termasuk 2.001 hasil berperingkat dengan guard timeout query MySQL. Pint dan pemeriksaan whitespace lulus. Tes guard timeout khusus MySQL akan dilewati pada MariaDB; kompatibilitas sintaks MariaDB diperiksa terpisah.

Hasil benchmark penuh setelah perubahan, median lima sampel:

| Kasus | Median controller + JSON | Query | Payload tanpa gzip |
| --- | ---: | ---: | ---: |
| Katalog awal | 149,56 ms | 7 | 55.292 byte |
| POS awal | 150,52 ms | 7 | 55.633 byte |
| Pencarian produk luas, partial refresh | 4.818,40 ms | 38 | 15.907 byte |
| Produk tanpa pencarian, partial refresh | 51,72 ms | 4 | 15.907 byte |

**Masih perlu dibenahi:** meskipun join peringkat sudah memakai indeks, keseluruhan pencarian luas dengan mapping masih sekitar 4,8 detik. Profil tambahan satu sampel warm 4.905,27 ms mencatat total waktu query 3.419,89 ms (query paling lambat 653,42 ms), sehingga hasil 96,58 ms dari probe join tidak boleh disebut kecepatan seluruh pencarian. Pemuatan metadata/mapping per batch dan perhitungan dokumen masih menjadi pekerjaan optimasi lanjutan. Tidak menyatakan seluruh performa sudah baik berdasarkan beranda kosong atau probe join saja.

Referensi tipe teks/biner dan JSON_TABLE: [MySQL](https://dev.mysql.com/doc/refman/8.0/en/charset-binary-collations.html), [MariaDB](https://mariadb.com/docs/server/reference/sql-functions/special-functions/json-functions/json_table). Kesimpulan indeks di atas berasal dari EXPLAIN dan probe lokal proyek, bukan perkiraan dari dokumentasi.

## Konfigurasi PHP yang perlu dicocokkan

Bukti kode: gambar maksimal 4 MB, sedangkan impor XLSX/CSV maksimal 10 MB (`ProductSheetRequest`). CLI server sebelumnya melaporkan upload/post limit 2.048 MB. Nilai CLI belum membuktikan nilai PHP web per domain.

Tindakan: periksa PHP web untuk tokopojok.shop di hPanel. Selaraskan batas dengan kebutuhan nyata, misalnya upload_max_filesize 10M dan post_max_size 16M untuk impor 10 MB, sambil mempertahankan validasi gambar 4 MB di aplikasi. Jangan menurunkan seluruh upload ke 4 MB karena itu dapat memblokir file impor yang sah. Rekomendasi dokumentasi telah diselaraskan. Tidak ada override upload/post eksplisit yang ditemukan di file .user.ini/domain yang diperiksa; itu belum membuktikan nilai efektif SAPI web.

## Prioritas berikutnya: SEO halaman publik

Bukti: robots.txt production mengizinkan crawl; sitemap mengembalikan 200 dengan 2 URL tanpa domain staging. Pada DOM beranda ditemukan 2 meta description dan tidak ada H1. Beranda saat ini masih katalog kosong, sementara tujuan sebelumnya adalah memasarkan aplikasi dan melayani pembeli melalui halaman berbeda.

Tindakan: sesudah alur operasional stabil, tentukan beranda aplikasi dan URL katalog usaha, gunakan satu description dan H1 yang sesuai tujuan tiap halaman, lalu sediakan URL detail produk yang memang dipublikasikan. Jangan menyimpulkan cakupan indeks atau trafik tanpa data Search Console.

## Batas pemeriksaan

- Restore snapshot production berhasil pada database lokal terpisah. Belum melakukan pemulihan database production aktif, failover, atau load test production.
- Belum memverifikasi backup provider dari hPanel.
- Belum menguji alur terautentikasi production, kirim email nyata, atau pekerjaan antrean nyata.
- Controller/JSON katalog, POS dan pencarian sudah dibenchmark dengan fixture berisi. Belum mengukur render browser dengan dataset tersebut, laporan/PDF, cold load penuh, beban serentak production, atau data pengguna nyata.
- Console 401/403 dari probe akses privat adalah hasil yang diharapkan dari pemeriksaan audit, bukan otomatis error aplikasi.
- Pekerjaan ini membuat backup dan menjalankan deploy normal yang diotorisasi. Perubahan pencarian dan dokumentasi disiapkan terpisah; source production tetap rilis v1.0.0 sampai perbaikan ditinjau, digabung dan dirilis.
