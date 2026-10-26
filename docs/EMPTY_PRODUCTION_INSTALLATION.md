# Production baru tanpa data usaha

Target deployment awal: `https://tokopojok.shop`. Staging tetap terpisah.

## Persiapan server

- Folder Laravel: `/home/u547702003/domains/tokopojok.shop/tokom`.
- `.env` privat berada pada folder tersebut, bukan `public_html`.
- Database MySQL production harus baru dan tidak memiliki tabel atau view. Jangan menyalin database staging.
- Isi DB_DATABASE, DB_USERNAME, dan DB_PASSWORD langsung di File Manager. Nama database/user harus memakai prefix lengkap dari hPanel. Jangan kirim password ke chat atau commit Git.
- APP_KEY dibuat baru. Konfigurasi SMTP/OAuth boleh digunakan ulang hanya sesuai persetujuan pemilik; QRIS, gambar, sesi, akun dan data toko tidak disalin.
- Atur callback Google menjadi `https://tokopojok.shop/auth/google/callback` pada OAuth client di Google Cloud. Pertahankan callback staging dan localhost jika masih digunakan.
- Setelah kode siap dan sebelum deploy health check, arahkan document root/symlink `public_html` ke `tokom/public`. Pertahankan halaman placeholder sampai cutover. Pastikan DNS dan SSL benar terlebih dahulu.
- Jalankan scheduler setiap menit dan worker database queue dengan PHP hosting yang sama. Periksa kemampuan WebP serta batas upload 4 MB/post 8 MB.

## GitHub

Variables: `PRODUCTION_URL=https://tokopojok.shop`, `PRODUCTION_DEPLOY_PATH=/home/u547702003/domains/tokopojok.shop/tokom`, `PRODUCTION_SSH_PORT=65002`. Secrets: `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_USER`, `PRODUCTION_SSH_KEY`.

Biarkan `PRODUCTION_DEPLOY_ENABLED=false` selama database/DNS/SSL belum siap. Production tidak boleh memakai folder yang sama, induk, atau anak folder staging.

Gabungkan PR ke develop, lalu rilis perubahan lewat PR develop ke main. Setelah CI push main sukses, jalankan Deploy production manual dengan versi baru dan `first_install=true` hanya untuk instalasi pertama. Deployment berikutnya memakai `first_install=false`.

Mode pertama menolak folder yang sudah memiliki Artisan, file aplikasi lain, upload, atau data storage. Setelah menyalin kode, command `app:initialize-production DATABASE_LENGKAP` memverifikasi environment production, debug nonaktif, HTTPS dan database tanpa tabel/view sebelum menjalankan migration. Tidak menjalankan migrate:fresh, db:wipe, UserSeeder atau DatabaseSeeder.

Hanya RoleSeeder yang dijalankan. Lima jenis bawaan yang dibuat migration historis dihapus setelah pemeriksaan seluruh tabel operasional kosong. Pengaturan kontak kosong, QRIS nonaktif, pajak nonaktif. Satu record usaha internal kompatibilitas tetap dibutuhkan oleh rute beranda yang ada; tidak ada akun owner untuk record tersebut.

Hasil: nol akun, produk, kategori, jenis, referensi, supplier, pesanan, pembayaran, mutasi dan upload. Owner mendaftar melalui /register atau Google; usaha baru juga dimulai kosong.

`app:check-deployment --allow-empty-installation` hanya menerima instalasi yang terverifikasi belum memiliki data. Tanpa opsi ini, pemeriksaan owner aktif tetap berlaku. Jika instalasi pertama terputus, database parsial tidak otomatis dihapus. Periksa fase kegagalan sebelum pemulihan; jangan menyalakan ulang opsi first_install secara buta.

## Pemeriksaan

- Tes instalasi dari database tanpa tabel, lalu pendaftaran owner pertama.
- Penolakan database berisi tabel, salah database/environment, akun/data usaha lain, dan preset yang sudah diubah.
- Tes shell memastikan mode awal tidak memakai jalur backup/update dan menolak folder/upload yang sudah berisi.
- Lint PHP, tes deployment yang ada, dan CI wajib lulus sebelum rilis.
