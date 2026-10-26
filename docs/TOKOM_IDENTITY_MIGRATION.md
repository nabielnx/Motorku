# Transisi identitas internal TokoM

Perubahan ini meneruskan identitas tampilan TokoM ke penyimpanan browser, sesi, tooling, dan lingkungan pengujian. Implementasi dibuat bertahap pada PR yang sama.

## Tahap 1: nama yang tidak menyimpan data pengguna

- Plugin Vite menjadi `tokom-loading-skeletons`.
- User-Agent health check menjadi `TokoM-Deployment-Health/1.0`.
- Prefix file sementara exporter dan tes skeleton memakai `tokom-`.
- Seeder akun demo memakai domain `example.com`. Pemeriksaan deployment tetap mendeteksi password demo pada alamat lama maupun baru. Email akun yang sudah ada tidak diganti.

## Tahap 2: penyimpanan browser

Kode aktif menggunakan `tokom_*`. Adapter `brandStorage.js` mempertahankan alias `motorku_*` dalam scope usaha dan akun yang sama:

1. Data lama dipromosikan saat dibaca tanpa menghapus sumbernya.
2. Penulisan menyelaraskan kedua nama agar tab versi lama dan rollback frontend masih dapat membaca data terkini.
3. Selama masa transisi, alias lama dibaca terlebih dahulu karena tab versi lama hanya menulis alias tersebut.
4. Menghapus data menghapus kedua alias agar keranjang atau checkout yang sudah selesai tidak muncul kembali.
5. Daftar kunci dinormalisasi dan dideduplikasi. Event penyimpanan mengenali nama lama dan baru sesuai scope akun.
6. Kegagalan quota tetap dilaporkan sebagai kegagalan menyimpan. Akses ke receipt lama tidak dibuang saat alias baru gagal ditulis.

Keranjang tetap dibagikan antara guest dan akun dalam usaha yang sama. Receipt, token akses, dan ID retry checkout tetap terpisah menurut usaha dan akun. UUID request checkout lama dipakai kembali; pergantian nama bukan checkout baru. Sinkronisasi alias memakai ruang penyimpanan tambahan selama fase kompatibilitas.

## Tahap 3: backend, cookie, dan database pengujian

- Middleware membaca cookie `motorku-session` hanya setelah Laravel memverifikasi serta mendekripsinya, sebelum sesi dimulai. Cookie `tokom-session` yang sudah ada selalu diprioritaskan. Nama cookie kustom tidak diambil alih.
- Middleware memakai backend sesi yang sama. Mengganti cookie tidak memindahkan isi Redis atau database.
- Default baru cache/session/Redis mengikuti nama TokoM. Prefix eksplisit instalasi lama tetap dihormati.
- Database tes menjadi `tokom_testing`, termasuk guard, worker concurrency, benchmark, dan MySQL CI. Database operasional tetap mengikuti `.env`; database lama tidak dihapus atau dipindahkan.
- Migration baru hanya mengubah nama default yang persis `Motorku` pada business legacy pertama dan pengaturan nama tokonya. Perbandingan biner mencegah MySQL menyamakan nama kustom yang berbeda kapitalisasi atau spasi. Nama usaha lain dan seluruh data produk/transaksi tetap dipertahankan.
- Cache pengaturan legacy diinvalidasi hanya ketika backfill mengubah baris. Backfill aman dijalankan ulang. Migration historis tidak ditulis ulang; backfill tidak mengembalikan nama saat rollback agar tidak menimpa pilihan owner berikutnya.

## Penerapan

1. Deploy kode dan migration melalui alur staging yang biasa. Jangan menjalankan seeder demo pada database operasional.
2. Perbarui nama pengirim/aplikasi sesuai README. Untuk cookie standar, gunakan `SESSION_COOKIE=tokom-session` setelah middleware kompatibilitas tersedia.
3. Pertahankan koneksi database, backend sesi, prefix cache/Redis, dan APP_KEY yang lama. Prefix Redis dapat menampung sesi atau antrean dan memerlukan migrasi tersendiri jika akan dipindahkan.
4. Segarkan config cache dan worker seperti dijelaskan README.
5. Verifikasi login lama, keranjang lama, checkout ulang, dan riwayat pada staging. Perhatikan bahwa cache/PWA browser dapat masih memakai versi sebelumnya selama transisi.

Rollback frontend masih bisa membaca alias browser lama. Untuk rollback backend, selaraskan konfigurasi cookie dengan versi kode yang dipakai dan pertahankan backend sesi/APP_KEY; jangan menghapus alias sebelum periode kompatibilitas selesai. Backfill nama tidak membatalkan transaksi atau stok dan tidak mengembalikan nama secara otomatis.

## Verifikasi

- 118 tes JavaScript lulus, termasuk migrasi keranjang, tab versi lama, scope antar akun/usaha, retry checkout, quota penyimpanan, dan penghapusan kedua alias.
- Seluruh 494 tes PHP lulus pada `tokom_testing`. Pemeriksaan tambahan setelah memperketat pencocokan nama juga lulus untuk dua skenario backfill.
- Tes cookie membuktikan login lama berlanjut, cookie baru diprioritaskan, cookie tanpa enkripsi ditolak, dan konfigurasi kustom dipertahankan.
- Build produksi dan Pint lulus.
- Regresi shell health check dan cleanup deployment lulus di Bash Linux.
- Browser lokal: keranjang contoh dengan kunci lama menjadi tersedia pada kunci TokoM setelah reload, produk dan kuantitas tetap sama, judul katalog benar, respons halaman dan manifest 200.

Sisa nama lama yang disengaja berada pada adapter kompatibilitas, tes kompatibilitas, pemeriksaan akun demo lama, aset ikon untuk instalasi lama, dan dokumen/migration historis. Istilah sparepart tetap menjelaskan fitur khusus motor.
