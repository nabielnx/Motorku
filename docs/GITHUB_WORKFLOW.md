# Alur GitHub Motorku

```text
feat/* atau fix/* → PR ke develop → staging → PR develop ke main
                  → deploy production manual → tag vX.Y.Z
```

## Peran branch

- `main`: kode yang siap dirilis ke production. Tidak dipakai untuk pekerjaan harian.
- `develop`: kumpulan fitur yang siap dites bersama. Jika deploy aktif, setiap push ke branch ini dikirim ke staging.
- `feat/*` atau `fix/*`: satu pekerjaan per branch. Buat dari `develop`; hapus setelah PR digabungkan.
- Hotfix production: buat `fix/*` dari `main`, gabungkan ke `main`, rilis, lalu bawa fix yang sama kembali ke `develop`.

Hanya gabungkan fitur yang siap ikut rilis ke `develop`: PR `develop` ke `main` akan membawa seluruh isi `develop`.

## Alur harian dan rilis

1. Buat branch fitur dari `develop`, implementasikan perubahan, lalu commit dan push.
2. Buka Pull Request ke `develop`. CI menjalankan tes PHP dengan MySQL dan build frontend. Setelah lulus, gabungkan PR.
3. Cek aplikasi di staging, termasuk migrasi dan alur yang berubah.
4. Saat semua perubahan di `develop` siap dirilis, buka PR `develop` ke `main`. Pastikan CI lulus, lalu gabungkan.
5. Cadangkan database production. Jalankan workflow **Deploy production** secara manual dari branch `main` dengan versi seperti `v1.0.0`. Tag dibuat setelah health check berhasil.

Contoh memulai pekerjaan baru:

```bash
git switch develop
git pull origin develop
git switch -c feat/nama-fitur
# setelah perubahan selesai dan dites:
git add .
git commit -m "feat: jelaskan perubahan"
git push -u origin feat/nama-fitur
```

Di GitHub, buat PR dari `feat/nama-fitur` ke `develop`. Setelah PR digabungkan, ambil ulang `develop` sebelum membuat branch fitur berikutnya.

Jadikan job CI `test-and-build` sebagai required status check untuk PR ke `develop` dan `main` setelah job pertama terlihat di GitHub. Jangan aktifkan auto-merge atau auto-deploy production sebelum proses rilis terbukti berjalan.

## Menyiapkan server

Deploy staging dan production nonaktif secara default. Masing-masing butuh instalasi Laravel sendiri dengan domain HTTPS, `.env`, `APP_KEY`, database MySQL, dan storage terpisah. Web server menunjuk ke direktori `public`. Direktori project harus sudah ada dengan `.env` dan `storage` sebelum workflow deploy pertama dijalankan. Server perlu akses SSH, Bash, rsync, mysqldump, PHP 8.3 dengan PDO MySQL dan GD yang mendukung WebP, serta perintah Artisan. Pembayaran yang digunakan saat ini adalah tunai dan QRIS manual. Jangan commit `.env`.

Isi repository variables di GitHub Settings → Secrets and variables → Actions:

| Staging | Production | Isi |
| --- | --- | --- |
| `STAGING_DEPLOY_PATH` | `PRODUCTION_DEPLOY_PATH` | Path absolut direktori project Laravel di server |
| `STAGING_URL` | `PRODUCTION_URL` | URL HTTPS untuk health check |
| `STAGING_SSH_PORT` | `PRODUCTION_SSH_PORT` | Opsional; default 22 |
| `STAGING_DEPLOY_ENABLED` | `PRODUCTION_DEPLOY_ENABLED` | Set `true` hanya setelah server dan secret siap |

Isi repository secrets terpisah untuk tiap server:

| Staging | Production |
| --- | --- |
| `STAGING_SSH_HOST` | `PRODUCTION_SSH_HOST` |
| `STAGING_SSH_USER` | `PRODUCTION_SSH_USER` |
| `STAGING_SSH_KEY` | `PRODUCTION_SSH_KEY` |

Staging deploy otomatis setelah CI untuk push ke `develop` sukses dan `STAGING_DEPLOY_ENABLED=true`. GitHub mengharuskan workflow yang dipicu oleh `workflow_run` tersedia di default branch (`main`), jadi gabungkan PR setup awal ke `main` sebelum mengaktifkan deploy staging. Production hanya deploy lewat tombol **Run workflow** pada branch `main` setelah `PRODUCTION_DEPLOY_ENABLED=true`. Workflow production memeriksa CI sukses untuk SHA yang sama di `main`. Artefak diunggah ke `.incoming-<SHA>` sebelum maintenance diaktifkan. Script aktivasi membuat backup SQL dan kode di `.deploy-backups`, lalu menyinkronkan direktori release dengan `rsync --delete` agar file yang dihapus di Git juga hilang dari server. `.env`, `storage`, dan `public/storage` tetap dipertahankan.

Saat migrasi atau pemeriksaan konfigurasi gagal, maintenance tetap aktif. Kegagalan health check setelah aktivasi juga mengaktifkan maintenance. Database tidak dipulihkan otomatis: pemulihan harus mempertimbangkan perubahan skema dan transaksi yang mungkin sudah tercatat. Backup berada di luar `public`, dengan direktori izin 700 dan file privat. Jadwalkan penghapusan backup lama sesuai kapasitas server; salinan backup terpisah dan uji restore tetap diperlukan.


## Instalasi pertama

Siapkan `.env` terpisah untuk staging/production, `APP_KEY` tetap, URL HTTPS, debug nonaktif, session cookie aman, database, dan storage yang dapat ditulis. Batas upload PHP: `upload_max_filesize=4M`, `post_max_size=8M`; samakan batas request web server/proxy dengan dokumentasi upload.

Setelah kode/dependency dan skema tersedia pada instalasi pertama:

```bash
php artisan migrate --force
php artisan db:seed --class=RoleSeeder --force
php artisan db:seed --class=SettingSeeder --force
php artisan app:create-owner owner@domain-toko.example --name="Owner"
php artisan storage:link
php artisan app:check-deployment
```

`app:create-owner` meminta password secara tersembunyi dan hanya dipakai sebelum ada owner aktif. Seeder utama di staging/production hanya mengisi role dan pengaturan yang belum ada; katalog dan akun demo tidak dibuat. Pengaturan toko yang sudah tersimpan tidak ditimpa. Jangan jalankan `UserSeeder` di production.

Aktifkan scheduler setiap menit untuk melepaskan stok pesanan kedaluwarsa, worker antrean jika dipakai, HTTPS/proxy yang sesuai, serta mail delivery. Pemeriksaan `app:check-deployment` tidak menggantikan uji layanan ini.

## Pemulihan deploy gagal

1. Pertahankan maintenance dan identifikasi fase kegagalan dari log. Jika backup belum dibuat, kode/database belum diganti oleh script.
2. Salin backup keluar server sebelum tindakan pemulihan; simpan `.env`, storage upload, dan database terkini untuk mencegah kehilangan transaksi baru.
3. Cocokkan versi kode dan skema. Untuk kegagalan tanpa perubahan skema, pulihkan direktori kode dari `*-code.tgz` dengan menghapus file release baru yang sudah tidak ada di backup; pertahankan `.env` dan storage.
4. Bila skema perlu dipulihkan, uji restore `*.sql` ke database sementara dahulu, lalu putuskan rekonsiliasi transaksi setelah waktu backup. Migrasi hard delete lama memang tidak dapat di-rollback dengan `migrate:rollback`.
5. Sesudah versi kode dan skema cocok, bersihkan cache, periksa konfigurasi, restart worker, jalankan `php artisan up`, dan cek `/up` serta alur penjualan secara manual.

Prosedur SSH/backup/restore ini masih harus diuji di staging sebelum deploy production diaktifkan.
