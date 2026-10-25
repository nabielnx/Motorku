# Perbaikan audit 25–26 Oktober 2026

Perbaikan kode mencakup konflik edit produk (versi snapshot wajib, konflik HTTP 409), expected total checkout cash, validasi stok integer dan batas uang, resolver laporan, batas pagination/PDF/ekspor, pagination katalog/POS, cache metadata pencarian berbasis isi, batas 10.000 kandidat pencarian dengan pesan untuk mempersempit kategori, expiry review QRIS 24 jam, prune cache kedaluwarsa, manifest per toko, keyboard dropdown periode, strict types dan isolasi cache pengujian. Pencarian tetap mencakup mapping motor, bukan hanya nama produk yang sudah tampil. Harga/stok tidak disimpan dalam cache pencarian.

Form edit yang dibuka sebelum release harus dimuat ulang agar mempunyai `sync_version`. Klien POS cash wajib mengirim `expected_total`; klien QRIS tetap menggunakan quote. Respons konflik tidak menimpa data yang lebih baru. Data stok pecahan lama tidak dibulatkan otomatis: lakukan opname fisik, yang mempertahankan nilai sebelumnya pada log stok.

## Pengoperasian

1. Deploy mengikuti workflow biasa. Tidak ada migration skema baru dan tidak ada reset produk, referensi, stok atau transaksi. Indeks expiry cache sudah tersedia pada migrasi bawaan.
2. Jalankan scheduler Laravel setiap menit melalui hPanel/cron. Contoh: `* * * * * cd /path/aplikasi && php artisan schedule:run >> /dev/null 2>&1`. Gunakan PHP CLI yang sama dengan aplikasi. Heartbeat scheduler muncul sebagai peringatan jika belum berjalan atau lebih dari lima menit tidak diperbarui.
3. Review QRIS unpaid/pending dibatalkan otomatis setelah 24 jam oleh scheduler, sesuai pilihan owner. Stok kembali sekali. Bila pelanggan sungguh membayar tetapi terlambat dikonfirmasi, rekonsiliasi dana bersama toko; pesanan yang sudah cancelled tidak dapat dipaksa lunas melalui endpoint lama.
4. `php artisan cache:prune-expired --dry-run` memeriksa cache. Scheduler membersihkan cache database expired per jam dalam batch, tanpa global flush atau penghapusan lock aktif. Ini tidak menghapus gambar/upload.
5. `php artisan deploy:preview-backup-retention --keep=10 --days=30` hanya menampilkan pasangan backup lama. **Tidak ada penghapusan backup otomatis dalam perubahan ini.** Preview staging saat implementasi menemukan nol kandidat. Persetujuan kebijakan hapus, salinan off-host dan restore drill masih diperlukan sebelum mengaktifkan rotasi destruktif.

## Email verifikasi dan reset password

Login Google/OAuth bukan layanan pengiriman email. Aplikasi memerlukan SMTP atau API pengirim untuk verifikasi email/password, reset password, dan undangan staf. `MAIL_MAILER=log` hanya menulis ke log, cocok untuk lokal. Pemeriksaan deployment memperingatkannya di staging dan menggagalkan readiness production bila transport masih log/array.

Pilih akun pengirim yang memang dimiliki. Bila mempunyai email Hostinger pada domain sendiri, gunakan detail SMTP dari dashboard email Hostinger. Jangan menganggap subdomain sementara hosting otomatis menyediakan akun email. Bila belum mempunyai akun pengirim, siapkan provider terlebih dahulu; kredensial Google OAuth tidak dapat dipakai sebagai password SMTP.

Contoh struktur `.env` berikut tidak berisi kredensial nyata:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.provider.example
MAIL_PORT=465
MAIL_USERNAME=notifikasi@domain-anda.example
MAIL_PASSWORD="password-atau-app-password-dari-provider"
MAIL_FROM_ADDRESS=notifikasi@domain-anda.example
MAIL_FROM_NAME="Nama Toko"
```

Sesuaikan scheme/port dengan provider dan konfigurasi Laravel yang digunakan. Jangan mengirim password melalui chat atau memasukkannya ke Git. Setelah mengisi environment hosting, jalankan `php artisan config:cache`, lalu uji verifikasi dan reset dengan akun uji sendiri. Keberhasilan test notification fake bukan bukti email diterima inbox. Kredensial/provider belum disediakan pada implementasi ini, sehingga pengiriman email nyata belum dinyatakan selesai.

## Development

Dev server bind loopback secara default. Jika memang membutuhkan pengujian LAN, set `VITE_DEV_HOST`, `VITE_HOST`, dan `VITE_DEV_ORIGINS` secara eksplisit serta batasi akses jaringan. Audit CI sekarang mencakup seluruh npm dependencies dan tetap wajib berhasil.

## Pemulihan

Backup deploy dan prosedur rollback tetap dipertahankan. Untuk restore drill, gunakan database sementara yang terpisah; jangan mengimpor SQL ke database usaha aktif. Verifikasi konsistensi kode/skema serta salinan upload, kemudian uji login, katalog, transaksi dan receipt. Salinan di luar hosting dan target kehilangan data/waktu pemulihan perlu ditetapkan sebelum rotasi backup otomatis diaktifkan.

## Hasil verifikasi lokal

- PHPUnit: **486 tes, 4.791 assertions**, seluruhnya lulus pada MySQL 8 sementara yang terpisah dari database usaha.
- JavaScript: **113 tes**, seluruhnya lulus. Build produksi, Laravel Pint, dan validasi Composer berhasil. Audit Composer dan seluruh dependency npm melaporkan **0 temuan** saat pemeriksaan.
- Regresi health check dan cleanup deployment lulus di Ubuntu, termasuk penolakan symlink, path tidak valid, data persisten, dan deployment yang masih memegang lock.
- Browser dengan akun/data fiktif: login owner dan pelanggan; simpan telepon/alamat lalu reload; POS memuat produk berikutnya dan mencari item di luar halaman awal; transaksi tunai hingga invoice; lebar mobile 390 px tanpa overflow horizontal; pilihan periode melalui End/Enter mengembalikan fokus ke tombol filter. Logo fixture yang menunjuk file usaha lain ditolak 403 dan menggunakan fallback. Tidak menguji OAuth Google nyata, inbox email, atau instalasi PWA pada perangkat fisik.
- Manifest HTTP dua konteks usaha dan penolakan slug tidak dikenal diverifikasi oleh regression test. Uji pemasangan PWA pada perangkat tetap diperlukan setelah staging tersedia.

Benchmark controller/serialisasi pada 2.000 produk fiktif, 12 motor, dua mapping per produk, satu warmup dan lima pengukuran: payload katalog awal turun dari **1.782.003 menjadi 55.292 byte**, dan POS dari **1.524.744 menjadi 55.633 byte**. Produk selanjutnya tersedia melalui tombol muat berikutnya dan pencarian server; katalog tidak dipotong diam-diam. Harga dan stok keranjang diperiksa melalui lookup ID, terpisah dari halaman katalog.

Pengukuran akhir mencatat median lokal katalog 21,19 ms, POS 20,99 ms, dan pencarian luas 640,17 ms. Ini hanya controller/serialisasi pada fixture warm, bukan latensi hosting, hasil Lighthouse, atau jaminan p95 produksi. Pencarian masih memindai metadata kandidat hingga batas 10.000; pertumbuhan di atas itu memerlukan indeks pencarian tersendiri. MySQL 8.0.4+/MariaDB 10.6+ memakai relasi skor JSON yang dimaterialisasi, sementara versi lama memakai pengurutan numerik CASE.

Tidak ada schema migration baru. Pengujian tidak mereset data usaha, mengaktifkan penghapusan backup, atau mengirim email sungguhan. Perubahan perlu melalui CI dan staging sebelum rilis production.
