# Upload gambar

Semua upload produk, motor, avatar, logo, QRIS, gambar login, dan banner menerima JPEG, PNG, atau WebP dengan ukuran masukan maksimal 4 MiB (4096 KB), dimensi maksimal 6000 × 6000, dan luas maksimal 16 megapiksel. Hasil yang baru diupload disimpan sebagai `.webp` dengan MIME `image/webp` dan ukuran **kurang dari 1.000.000 byte**. Gambar lama tidak otomatis dikonversi.

`ImageUploadService` menurunkan resolusi awal maksimal 2400 piksel, mencoba kualitas 85/75/65/55, lalu menurunkan resolusi bertahap bila hasil masih terlalu besar. Referensi database disimpan sebelum file lama dihapus; jika penyimpanan referensi gagal, file baru dibersihkan.

## Server

- Aktifkan ekstensi PHP GD dengan dukungan WebP (`php -r "var_export(gd_info());"`).
- Gunakan `upload_max_filesize = 4M` atau lebih besar dan `post_max_size = 8M` atau lebih besar agar multipart tidak ditolak sebelum validasi Laravel. Restart proses PHP setelah mengubah `php.ini`.
- Jika memakai Nginx, gunakan `client_max_body_size 8m` atau lebih besar. Jika memakai Apache/proxy lain, pastikan batas body setidaknya 8 MiB.
- Sediakan memori PHP yang cukup untuk decoding gambar; 512M digunakan pada lingkungan lokal. Batas resolusi tetap divalidasi aplikasi.
- Pastikan disk `public` dapat ditulis dan tautan `php artisan storage:link` tersedia.
- Verifikasi QRIS hasil kompresi masih dapat dipindai sebelum dipakai pelanggan.
