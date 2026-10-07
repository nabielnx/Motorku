# Audit keamanan Motorku — 7 Oktober 2026

## Status setelah perbaikan

Perbaikan diterapkan di branch `fix/customer-promo-banners`. Setelah tes otomatis dan uji manual localhost lolos, pengguna menyetujui commit, push, dan pembaruan PR ke `develop`. Tidak diperlukan migration. Bagian temuan di bawah mencatat kondisi **sebelum perbaikan** pada HEAD `a073531`.

| Temuan | Perbaikan dan status |
|---|---|
| S01 | Pergantian password melalui `UserService` memakai transaksi dan row lock, memeriksa ulang password pada akun terkunci, menghapus sesi perangkat lain serta token API, dan mengosongkan remember token. Controller mengganti ID sesi dan CSRF token dengan `regenerate(true)`, sehingga cookie lama perangkat saat ini juga dibuang. Tes memakai cookie browser asli, termasuk sesi lama tanpa `password_hash_web`; perangkat saat ini tetap login dan akses akun lain tidak berubah. |
| S02 | Limiter Laravel bersama pada konfirmasi password, perubahan password/email profil, penghapusan akun sendiri, serta tambah/edit staf: maksimum 5 request yang menyertakan field password per akun per menit dan 15 per IP per menit. Percobaan valid juga dihitung. Berpindah endpoint atau IP tidak menghapus batas akun; edit biasa tanpa field password tetap berjalan. Setelah batas tercapai, respons 429 sampai jendela limiter berakhir. |
| H01 | Middleware bawaan Laravel `FrameGuard` menambahkan `X-Frame-Options: SAMEORIGIN`. Tes halaman login/profil memverifikasi header. CSP menyeluruh dan konfigurasi server produksi belum diverifikasi. |
| S03 | Override dependency menaikkan `shell-quote` ke versi terkunci 1.12.0 dan `postcss-selector-parser` ke 7.1.6. Build lolos dan hash SHA-256 kedua file CSS identik dengan sebelum pembaruan. Advisory critical dan moderate hilang. |

**Sisa advisory tooling:** `braces@3.0.3` belum mempunyai patch yang dipublikasikan saat pemeriksaan. Audit npm masih melaporkan 5 package high karena satu advisory ini menyebar ke `braces`, `micromatch`, `fast-glob`, `chokidar`, dan `tailwindcss`. Jalurnya hanya tooling development/build; konfigurasi glob dan source CSS berasal dari repository, tidak dari upload/input pelanggan. Audit dependency runtime npm dan Composer bersih. Ini pembatasan dampak yang ditemukan, bukan penghapusan advisory. Saran npm berpindah ke Tailwind 4 memerlukan migrasi tersendiri dan pengujian seluruh tampilan; tidak dilakukan dalam patch keamanan ini. [Advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

**Persyaratan deployment:** pencabutan sesi menggunakan tabel `sessions` pada koneksi database utama. `.env.example` sudah memakai `SESSION_DRIVER=database`; `app:check-deployment` kini menolak driver, nama tabel, atau koneksi sesi yang tidak sesuai. Gunakan cache limiter yang dibagi antar instance jika aplikasi dijalankan di beberapa server.

File perubahan:

- [PasswordController.php](D:/Project/Webs/Motorku/app/Http/Controllers/Auth/PasswordController.php) dan [UserService.php](D:/Project/Webs/Motorku/app/Services/UserService.php): pergantian password/pencabutan akses.
- [AppServiceProvider.php](D:/Project/Webs/Motorku/app/Providers/AppServiceProvider.php), [auth.php](D:/Project/Webs/Motorku/routes/auth.php), [user.php](D:/Project/Webs/Motorku/routes/user.php): limiter bersama.
- [bootstrap/app.php](D:/Project/Webs/Motorku/bootstrap/app.php) dan [CheckDeployment.php](D:/Project/Webs/Motorku/app/Console/Commands/CheckDeployment.php): header framing dan pemeriksaan konfigurasi sesi.
- [package.json](D:/Project/Webs/Motorku/package.json) dan [package-lock.json](D:/Project/Webs/Motorku/package-lock.json): pembaruan dependency transitif.
- [SecurityRemediationTest.php](D:/Project/Webs/Motorku/tests/Feature/SecurityRemediationTest.php): tes regresi keamanan.
- Laporan ini: temuan, perbaikan, bukti, dan batas pemeriksaan.

## Lingkup dan hasil

Audit awal memakai skill ECC `security-review` dan `laravel-security` pada checkout `fix/customer-promo-banners`, HEAD `a073531`. Pemeriksaan mencakup routes, middleware, Form Requests, policies, services, models, rendering React/Blade, upload, dependency, dan aturan deployment. Temuan awal direproduksi sebelum kode/dependency diubah; perbaikan setelahnya dirangkum di atas.

Ditemukan **dua celah aplikasi yang direproduksi**, advisory dependency development/build, dan satu kebutuhan pengamanan header yang perlu dikonfirmasi pada server produksi. Hasil ini bukan sertifikat bahwa seluruh sistem bebas celah.

## S01 — Sesi perangkat lain tetap aktif setelah password diganti [Tinggi]

Lokasi: [PasswordController.php:25](D:/Project/Webs/Motorku/app/Http/Controllers/Auth/PasswordController.php:25), [bootstrap/app.php:56](D:/Project/Webs/Motorku/bootstrap/app.php:56).

Controller mengubah password lalu memanggil `Auth::logoutOtherDevices()`. Namun `AuthenticateSession` / `auth.session` tidak dipasang pada grup web. Pemanggilan tersebut mengubah hash password, tetapi sesi lain tidak memeriksa hash lama dan tidak dibuang dari penyimpanan sesi.

**Bukti:** probe membuat sesi browser A pada tabel `sessions` di database testing, memastikan cookie A bisa membuka `/profile`, mengganti password melalui sesi B, lalu memakai cookie A dengan guard baru. Password baru benar-benar tersimpan, tetapi cookie A tetap mendapat HTTP 200 dan terautentikasi sebagai akun yang sama. Tidak ada `actingAs()` pada request terakhir.

**Dampak:** sesi yang pernah diakses orang lain dapat tetap digunakan setelah pemilik akun mengganti password, hingga kedaluwarsa atau dihapus.

**Usulan minimum:** cabut sesi lain secara eksplisit ketika mengganti password, atau aktifkan middleware autentikasi sesi secara konsisten. Uji juga sesi yang sudah dibuat sebelum middleware dipasang, pertahankan sesi perangkat saat ini, dan periksa pencabutan token API apabila token memang digunakan.

Prasyarat middleware tersebut dijelaskan dalam [dokumentasi autentikasi Laravel 12](https://laravel.com/docs/12.x/authentication#invalidating-sessions-on-other-devices).

## S02 — Verifikasi ulang password dapat dicoba tanpa pembatas [Menengah]

Lokasi: [routes/auth.php:47](D:/Project/Webs/Motorku/routes/auth.php:47), [ConfirmablePasswordController.php:29](D:/Project/Webs/Motorku/app/Http/Controllers/Auth/ConfirmablePasswordController.php:29). Jalur konfirmasi tambahan berada di [routes/user.php](D:/Project/Webs/Motorku/routes/user.php) dan [ProfileUpdateRequest.php](D:/Project/Webs/Motorku/app/Http/Requests/ProfileUpdateRequest.php).

Login memiliki limiter, tetapi `POST /confirm-password` tidak memiliki throttle. Endpoint tambah/edit staf yang memeriksa `owner_password`, serta perubahan email profil yang memeriksa `current_password`, juga tidak menggunakan limiter konfirmasi password bersama.

**Bukti:** 16 request berturut-turut dengan password salah tetap diproses sebagai kesalahan password biasa; tidak muncul HTTP 429. Pembacaan route/controller memastikan tidak ada penghitung percobaan pada jalur tersebut.

**Dampak:** penyerang yang sudah memiliki sesi valid memperoleh jalur menebak password. Temuan ini membutuhkan sesi terautentikasi; bukan bypass login anonim.

**Usulan minimum:** gunakan pembatas konfirmasi berbasis akun dan IP pada seluruh jalur pemeriksaan ulang password, bukan hanya pada endpoint login atau pengiriman undangan.

## S03 — Advisory dependency alat development/build [Perlu pembaruan terencana]

Lokasi: [package-lock.json](D:/Project/Webs/Motorku/package-lock.json), versi sebelum pembaruan dependency.

`npm audit` melaporkan **9 package terdampak**: 2 critical, 5 high, 2 moderate. Angka tersebut mencakup package induk yang terdampak dependency transitif, bukan sembilan celah aplikasi berbeda. Laporan memiliki tiga advisory sumber:

- `concurrently → shell-quote@1.9.0`: advisory command injection; patch tersedia pada 1.11.0. Eksploitasi memerlukan input tertentu yang dapat dikontrol penyerang pada operasi quoting shell. Tidak ditemukan jalur input pelanggan menuju alat ini. [Advisory shell-quote](https://github.com/advisories/GHSA-pqg4-j6r4-53mv).
- Dependency Tailwind melalui `braces@3.0.3`: pemrosesan pola bersarang dapat menghabiskan stack. Advisory saat pemeriksaan belum mencantumkan versi patch. [Advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- Dependency Tailwind melalui `postcss-selector-parser@6.1.4`: advisory kompleksitas parsing selector; versi patch yang dilaporkan 7.1.6. [Advisory parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf).

**Batas dampak yang diketahui:** `npm audit --omit=dev` bersih. Tidak ditemukan jalur exploit HTTP pada Motorku dari advisory tersebut. Alat build tetap dipasang di CI, sehingga hasil audit runtime bersih tidak menghilangkan kebutuhan perawatan tooling.

**Usulan:** perbarui dependency yang memiliki patch kompatibel secara terencana dan uji build. Untuk dependency yang belum mempunyai patch kompatibel, tinjau jalur penggunaan dan penggantian dependency. Jangan langsung menjalankan `npm audit fix --force`, karena saran npm juga mencakup perpindahan mayor Tailwind.

`composer audit` bersih: tidak ada advisory atau package abandoned yang dilaporkan pada saat audit.

## H01 — Proteksi iframe belum dipasang oleh aplikasi [Pengamanan tambahan]

Lokasi: [bootstrap/app.php](D:/Project/Webs/Motorku/bootstrap/app.php).

Respons `/login` dalam pengujian tidak memiliki `X-Frame-Options` atau `Content-Security-Policy`; tidak ditemukan middleware aplikasi yang menambahkan proteksi framing. Konfigurasi web server produksi belum diperiksa, sehingga ini belum membuktikan header tersebut hilang pada domain produksi atau eksploit clickjacking berhasil.

**Usulan:** verifikasi respons HTTPS produksi. Jika belum diatur oleh server, tetapkan `frame-ancestors` atau `X-Frame-Options` sesuai kebutuhan aplikasi. Terapkan CSP lebih luas dengan pengujian, karena font eksternal, inline style, dan Vite development perlu dipertimbangkan.

## Proteksi yang sudah diverifikasi

| Area | Bukti yang diperiksa |
|---|---|
| Login dan akun | Pembatas login, password hashing, regenerasi sesi, logout, akun nonaktif dan undangan pending ditolak; tes autentikasi lolos |
| Role dan izin | Guest/kasir ditolak dari endpoint owner; perubahan role owner memerlukan password; owner terakhir dilindungi |
| Undangan/verifikasi | Token undangan di-hash, kadaluwarsa dan sekali pakai; signed verification link; pergantian identitas mencabut akses lama |
| CSRF admin | Probe mengaktifkan pemeriksaan CSRF yang biasanya dilewati PHPUnit: token hilang/lama mendapat 419, token sesuai melewati CSRF; tidak tercipta pesanan |
| CSRF Axios | Tes JS memeriksa satu refresh bersama, pembuangan header lama, dan retry terbatas; tidak ada retry network/5xx |
| Isolasi pelanggan | Token pesanan A tidak dapat membaca atau membatalkan pesanan B; token benar dapat membaca pesanan |
| Harga/status checkout | Request publik dengan harga, diskon, total dan status lunas palsu tetap memakai harga database dan status unpaid |
| Pembayaran dan stok | Transaksi database dan row locks, pembayaran ulang ditolak, kas ditutup dilindungi, checkout konkuren menghasilkan satu sale; tes project lolos |
| Upload | MIME gambar, ukuran/dimensi, konversi WebP dan batas hasil; SVG/file JPEG palsu ditolak tanpa file; tes konversi dan rollback lolos |
| SQL injection/XSS | Query raw ditelusuri: parameter terikat atau ekspresi internal; sort dibatasi. Tidak ditemukan sink HTML mentah pada React; output Blade dinamis memakai escaping. Ini pemeriksaan kode, bukan fuzzing seluruh field |
| Secrets/deployment | `.env` tidak tracked; pencarian pola private key/token pada direktori source tidak menemukan kecocokan. Seeder akun demo diblokir di production; deployment guard tersedia. Ini bukan pemindaian seluruh Git history dengan secret scanner |

Endpoint pelanggan yang dikecualikan dari CSRF tidak menggunakan sesi owner sebagai bukti kepemilikan pesanan; status/pembatalan memakai token pelanggan. Karena itu pengecualian tersebut tidak otomatis berarti bypass CSRF admin.

## Verifikasi setelah perbaikan

- Seluruh PHPUnit: **257 tes, 1.879 assertions**, lolos pada MySQL `sparepart_testing`. Database toko tidak dimutasi.
- Lima tes regresi baru mencakup cookie sesi lama/perangkat saat ini, pencabutan token tanpa memengaruhi akun lain, limiter lintas endpoint/IP dan batas IP lintas akun, edit tanpa password, masa kedaluwarsa limiter, header framing, serta deployment guard sesi.
- JavaScript: **18 tes**, lolos.
- Uji manual localhost: pengguna melaporkan seluruh skenario yang diminta berjalan normal—dua browser setelah ganti password, pembatas percobaan password, POS/pembayaran, pesanan pelanggan, edit staf, dan upload gambar. Ini laporan pengguna; belum merupakan verifikasi host staging/production.
- Production build: `npm.cmd run build`, lolos. Hash SHA-256 kedua file CSS sebelum/sesudah pembaruan sama.
- Sintaks PHP: **243 file source**, lolos; cache bootstrap yang dihasilkan Laravel dikecualikan.
- Pint: **lolos**, pemeriksaan source mengikuti scope CI `app bootstrap/*.php config database routes scripts tests`; cache bootstrap bukan source untuk linting.
- Composer: **0 advisory, 0 abandoned**; npm runtime: **0 advisory**. npm penuh: **5 high, 0 critical, 0 moderate**, bersumber dari advisory `braces` yang masih terbuka.

Cara mengulang pada checkout setelah perbaikan:

```powershell
php vendor/phpunit/phpunit/phpunit --colors=never
php vendor/phpunit/phpunit/phpunit --filter SecurityRemediationTest --colors=never
npm.cmd test
npm.cmd run build
php vendor/bin/pint --test app (Get-ChildItem bootstrap -File -Filter '*.php').FullName config database routes scripts tests
composer audit --format=json --no-interaction
npm.cmd audit --json
npm.cmd audit --omit=dev --json
```

`npm audit` penuh masih menghasilkan exit code 1 karena advisory tersisa; ini tidak dihitung sebagai hasil bersih. Bukti verifikasi lokal ada di `storage/app/security-remediation-*` dan `security-css-before.json` / `security-css-after.json`.

## Bukti audit awal

Semua tes database dijalankan pada **MySQL `sparepart_testing`**, dengan guard pada `tests/TestCase.php`. Database toko tidak digunakan untuk mutasi audit.

- PHPUnit project: **252 tes, 1.790 assertions**, semuanya lolos.
- Probe keamanan: **6 tes, 98 assertions**, semuanya sesuai perilaku yang diamati.
- JavaScript: **18 tes**, semuanya lolos.
- Composer: 0 advisory, 0 abandoned.
- npm runtime: 0 advisory; npm termasuk development: 9 package terdampak.

**Penting:** probe historis dengan nama `test_observed_gap_*` sengaja mengharapkan perilaku celah yang ditemukan. Status PASS pada probe itu adalah bukti reproduksi awal, bukan bukti perbaikan. Jangan gunakan probe historis sebagai gate setelah patch; tes perilaku aman kini berada di `tests/Feature/SecurityRemediationTest.php`.

File bukti lokal berada di `storage/app`: `EccSecurityProbesTest.php`, `ecc-security-tests.txt`, `ecc-security-probes.txt`, `ecc-security-js-tests.txt`, `ecc-security-composer.json`, `ecc-security-npm.json`, dan `ecc-security-npm-production.json`. Tidak ada kredensial operasional dalam laporan.

## Yang masih harus diuji pada host

- HTTPS/redirect HTTP, cookie Secure/HttpOnly/SameSite dan trusted proxy pada domain sebenarnya.
- Header framing/CSP, akses langsung `.env`, log, backup dan file storage; document root harus menuju `public`.
- Pengiriman email undangan melalui SMTP dan perlindungan log lokal yang memuat link aktivasi.
- Pencabutan sesi dua browser setelah S01 diperbaiki; pembatas percobaan setelah S02 diperbaiki.
- Abuse pemesanan publik dan upload pada beban nyata; audit ini tidak melakukan load test atau serangan ke production.

S01, S02, dan H01 sudah diperbaiki pada kode lokal; sisa advisory tooling dan verifikasi konfigurasi host tetap tercatat di atas.
