# Notifikasi admin

Lonceng pada header membuka panel daftar. Notifikasi disimpan memakai channel database Laravel; tidak memerlukan SMTP, queue worker, atau server WebSocket.

## Isi dan hak akses

| Kejadian | Penerima |
|---|---|
| Pesanan dibuat; status persiapan, siap, selesai atau dibatalkan berubah | Owner dan kasir aktif yang sudah memverifikasi email |
| Pembayaran diterima | Owner dan kasir |
| Retur dicatat | Owner dan kasir |
| Produk aktif mencapai batas stok minimum atau habis | Owner dan kasir |
| Staf diundang, menerima undangan, diperbarui atau dihapus | Owner |
| Kas harian ditutup, dengan atau tanpa selisih | Owner |

Perubahan pesanan dari pelanggan dan scheduler menggunakan event model yang sama. Pesanan POS mencatat pesanan baru dan pembayaran, tanpa notifikasi selesai tambahan sebelum pembayaran. Retry checkout/retur yang sudah berhasil tidak mencatat notifikasi kedua. Notifikasi database di dalam transaksi ikut rollback bila transaksi gagal. Stok yang terus menurun di bawah batas minimum tidak menghasilkan peringatan berulang; peringatan baru muncul ketika habis, atau setelah restock kemudian kembali menipis.

Riwayat dimulai setelah fitur diaktifkan; transaksi lama tidak diubah atau dibuat ulang menjadi notifikasi. Ringkasan **Perlu perhatian saat ini** tetap menghitung pesanan aktif, stok habis, dan stok menipis yang sudah ada. Tanda dibaca bersifat per akun, bukan menyelesaikan pesanan atau mengubah stok. Riwayat khusus owner disembunyikan bila akun kemudian menjadi kasir. Penghapusan akun membersihkan notifikasi akun tersebut.

## API dan frontend

Semua endpoint memakai `web`, `auth`, `verified`, dan `role:owner|cashier`; aksi PATCH memakai CSRF. ID notifikasi harus UUID dan hanya notifikasi milik akun yang dapat ditandai dibaca.

- `GET /api/notifications/summary`: badge belum dibaca dan ringkasan pekerjaan aktif.
- `GET /api/notifications?page=1&unread=0`: 10 notifikasi per halaman, terbaru dahulu. `unread=1` hanya yang belum dibaca.
- `PATCH /api/notifications/{id}/read`: tandai satu dibaca.
- `PATCH /api/notifications/read-all`: tandai semua yang dapat diakses akun dibaca.

Ringkasan diperbarui setiap 30 detik saat tab terlihat, memakai cache per identitas dan role agar navigasi tidak menambah polling. Daftar dimuat saat panel dibuka, halaman/filter berubah, atau pengguna menekan muat ulang; polling badge tidak mereset halaman/filter daftar. Tidak ada loading global untuk request notifikasi. Kesalahan koneksi menampilkan tombol coba lagi. Waktu memakai zona waktu toko.

Panel selalu dibuka pada filter **Belum dibaca** dan halaman pertama. Tab **Semua** tetap menampilkan riwayat yang masih tersimpan. Membuka panel atau halaman Produk/Pesanan dari sidebar tidak menandai notifikasi dibaca; klik notifikasi menandai hanya notifikasi tersebut, atau gunakan **Tandai semua dibaca**.

## Retensi

Command `php artisan notifications:prune-read` menghapus hanya notifikasi `StoreActivity` yang `read_at`-nya sudah berumur setidaknya 7 hari. Umur dihitung sejak dibaca, bukan sejak dibuat. Membaca ulang notifikasi tidak memperpanjang masa simpannya. Notifikasi belum dibaca dan jenis notifikasi lain tetap disimpan. Pembersihan tidak mengubah pesanan, stok, pembayaran, atau ringkasan pekerjaan aktif.

Scheduler menjalankan command setiap hari pukul 03:00 dalam zona waktu aplikasi. Penghapusan terjadi pada jadwal pertama setelah batas 7 hari, sehingga dapat tertunda sampai sekitar 24 jam. `composer dev` sudah menjalankan `schedule:work`; staging/production harus menjalankan `php artisan schedule:run` setiap menit melalui cron/scheduler hosting, seperti scheduler pesanan kedaluwarsa yang sudah ada. Tidak diperlukan migration tambahan.

## Instalasi dan verifikasi

Jalankan `php artisan migrate` sebelum menggunakan kode fitur ini. Migration `2026_10_07_000002_create_notifications_table` hanya menambah tabel `notifications`: UUID, type, UUID polymorphic recipient, data JSON dalam kolom text, read_at, created_at dan updated_at. Tidak ada perubahan data katalog/transaksi lama.

Tes: `php artisan test --filter=NotificationCenterTest`, `npm test`, `npm run build`.

Uji manual setelah merge: buka lonceng pada owner/kasir; buat pesanan pelanggan; konfirmasi pembayaran; batalkan pesanan lain; lakukan retur; turunkan dan isi ulang stok; undang/aktifkan staf dengan pengirim email yang dikonfigurasi; tutup kas. Pastikan riwayat dan aksesnya sesuai tabel di atas, panel dimulai pada Belum dibaca, tab Semua tetap tersedia, dan scheduler pembersihan aktif.
