# Akun Owner dan Staf

## Alur akun

1. Owner pertama dibuat dari terminal dengan `php artisan app:create-owner email@domain.com --name="Nama Anda"`. Gunakan email yang benar-benar Anda miliki. Password dimasukkan lewat prompt tersembunyi.
2. Owner masuk, membuka halaman verifikasi, mengirim email verifikasi, lalu membuka tautannya. Akun yang belum terverifikasi hanya dapat mengakses verifikasi, profil, dan logout.
3. Owner membuka Kelola Staf, mengisi nama serta email milik penerima, dan memilih peran. Peran awal adalah Kasir.
4. Penerima membuka undangan dan membuat password sendiri. Aktivasi sekaligus memverifikasi kepemilikan email. Setelah itu penerima masuk melalui halaman login.

Toko boleh memiliki beberapa owner. Semua owner memiliki akses penuh yang sama, termasuk laporan keuangan, pengaturan, dan pengelolaan staf. Saat mengundang atau mempromosikan akun menjadi Owner, pembuat harus mengonfirmasi dengan password akunnya sendiri. Mengubah email staf atau password akun yang sudah aktif juga memerlukan konfirmasi ini. Perubahan email profil sendiri memerlukan password saat ini dan verifikasi alamat baru.

Perubahan email/password lewat Kelola Staf serta perubahan email profil mencabut sesi lama dan token akses akun tersebut. Saat memperbarui akun sendiri, sesi browser yang sedang digunakan tetap tersedia untuk menyelesaikan verifikasi.

Owner tidak dapat menghapus, menonaktifkan, atau mengubah peran dirinya melalui Kelola Staf. Penghapusan akun sendiri dari profil memerlukan password dan tetap melindungi owner terakhir. Menghapus, menonaktifkan, atau menurunkan peran owner tidak boleh meninggalkan toko tanpa owner aktif yang sudah terverifikasi dan selesai aktivasi. Owner yang baru diundang belum dapat menjadi pengganti.

## Undangan dan data lama

- `users.invitation_pending` membedakan akun yang menunggu aktivasi. Migration hanya menambah kolom ini; tidak mengubah password, peran, atau status verifikasi akun lama.
- Token undangan menggunakan broker Laravel `staff_invitations` dan tabel `password_reset_tokens` yang sudah ada. Token disimpan sebagai hash, berlaku 24 jam, dan dikonsumsi setelah aktivasi. Tidak ada tabel undangan tambahan.
- Kirim ulang undangan tersedia untuk akun aktif yang masih menunggu aktivasi, dengan jeda minimal satu menit. Undangan baru membatalkan tautan lama. Mengubah email undangan atau menghapus akun juga membatalkan tautan lama.
- Akun yang sudah selesai aktivasi tidak dapat menggunakan jalur undangan untuk reset password. Fitur publik lupa password tetap tidak tersedia.
- Jika layanan email gagal, pembuatan akun, perubahan email, atau penggantian token dibatalkan. Untuk pengiriman undangan, SMTP dibatasi timeout 10 detik. Penerimaan email oleh penyedia dan commit database tidak dapat dibuat atomik; jika terjadi kegagalan commit setelah email diterima penyedia, kirim ulang undangan dari Kelola Staf.

## Pengiriman email

SMTP adalah layanan yang mengirim email aplikasi ke inbox penerima. Contohnya, undangan staf dan tautan verifikasi. Pengembangan lokal memakai `MAIL_MAILER=log`: isi email dicatat di log Laravel, **tidak dikirim ke inbox**. Log berisi tautan rahasia; jangan dibagikan atau disimpan sebagai dokumentasi publik.

Untuk pemakaian sungguhan, atur variabel berikut di lingkungan server sesuai penyedia email, tanpa memasukkan kredensial ke Git:

```dotenv
APP_URL=https://alamat-web-anda
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=host-dari-penyedia
MAIL_PORT=465
MAIL_USERNAME=username-dari-penyedia
MAIL_PASSWORD=password-dari-penyedia
MAIL_FROM_ADDRESS=alamat-pengirim-terverifikasi
MAIL_FROM_NAME=Motorku
```

Nilai scheme, port, dan identitas pengirim harus sesuai dokumentasi penyedia. Untuk STARTTLS biasanya gunakan scheme `smtp` dan port `587`; Symfony Mailer melakukan negosiasi TLS. Pastikan `APP_URL` bisa dibuka dari perangkat penerima, bukan `localhost` milik komputer lain. Terapkan konfigurasi dengan `php artisan config:cache` pada deployment, atau `php artisan config:clear` saat pengembangan.

Setelah merge/deploy, jalankan `php artisan migrate --force` sebelum menerima request aplikasi. Migration baru hanya menambah status undangan; akun lama yang sudah terverifikasi tetap bisa masuk. Akun lama yang belum terverifikasi akan diminta memverifikasi emailnya.

## Pemeriksaan manual

Uji pengiriman nyata ke inbox/spam, aktivasi dari perangkat lain, tautan kedaluwarsa dan kirim ulang, serta alur owner pertama. Pengujian otomatis menggunakan notifikasi palsu dan database `sparepart_testing`, sehingga tidak mengirim email ke pengguna sungguhan.
