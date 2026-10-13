# Perapian halaman Produk pada HP

Perbaikan lanjutan dari screenshot daftar Brake Pad setelah PR #92 digabung.

## Perubahan

- Nama, harga, dan stok berada dalam kolom di sebelah foto. Harga tidak lagi terdorong ke bawah oleh tinggi foto.
- Nama tetap lengkap: 13 px dengan tinggi baris 18 px pada daftar mobile. Nama panjang membungkus tanpa ellipsis.
- Padding vertikal baris menjadi 8 px. Foto tetap 44 × 44 px.
- Judul mobile menjadi Produk/Kategori dan tombol aksi berada dalam baris yang sama. Tombol toolbar 36 px; label impor/ekspor tampil mulai 360 px. Pada HP lebih sempit, tombol memakai ikon dengan nama aksesibel dan judul penjelas.
- Skeleton mengikuti baris dan toolbar yang dirapikan.
- Aturan ukuran ini hanya berlaku pada toolbar Produk dan daftar Produk mobile. Modal serta kontrol halaman lain tetap memakai ukuran bersama.

## Verifikasi

- Emulasi Chromium pada 320, 360, 414, 768, dan 1440 px: halaman/kontrol tidak melebar di luar viewport.
- Empat contoh Brake Pad seperti pada screenshot setinggi 60–61 px pada HP. Nama sekitar 100 karakter juga diperiksa tanpa teks terpotong.
- Judul dan aksi sejajar pada 320/360/414 px. Jumlah produk tiga digit diperiksa pada 360 px tanpa bertabrakan dengan tombol aksi.
- Detail baris, impor, ekspor, filter kategori/stok, dan tab kategori dapat dibuka kembali. Tidak ada data bisnis yang disimpan.
- 63 tes JavaScript lulus, production build berhasil, dan 70 handler interaksi pada tiga file React tetap sama melalui perbandingan AST.

Pemeriksaan memakai database `sparepart_testing` dengan empat fixture milik audit. Nama/harga/stok fixture dipulihkan setelah pemeriksaan. Hasil merupakan emulasi browser, belum pemeriksaan pada perangkat HP fisik atau regresi piksel otomatis.
