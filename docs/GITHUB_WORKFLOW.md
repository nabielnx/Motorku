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

Deploy staging dan production nonaktif secara default. Masing-masing butuh instalasi Laravel sendiri dengan domain HTTPS, `.env`, `APP_KEY`, database MySQL, dan storage terpisah. Web server menunjuk ke direktori `public`. Direktori project harus sudah ada dengan `.env` dan `storage` sebelum workflow deploy pertama dijalankan. Server perlu akses SSH, PHP 8.3 dengan ekstensi GD untuk konversi gambar produk ke WebP, dan perintah Artisan. Gunakan DOKU sandbox di staging. Jangan commit `.env`.

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

Staging deploy otomatis setelah CI untuk push ke `develop` sukses dan `STAGING_DEPLOY_ENABLED=true`. GitHub mengharuskan workflow yang dipicu oleh `workflow_run` tersedia di default branch (`main`), jadi gabungkan PR setup awal ke `main` sebelum mengaktifkan deploy staging. Production hanya deploy lewat tombol **Run workflow** pada branch `main` setelah `PRODUCTION_DEPLOY_ENABLED=true`. Workflow production mengaktifkan maintenance mode selama upload dan migrasi, lalu mencoba mematikan maintenance mode jika deploy gagal. Deploy menimpa direktori project server secara langsung; strategi rilis berbasis symlink dan rollback otomatis baru bisa diputuskan setelah hosting tersedia.
