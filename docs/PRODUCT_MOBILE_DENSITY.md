# Perapian halaman Produk pada HP

Perbaikan lanjutan dari screenshot daftar Brake Pad setelah PR #92 digabung.

## Perubahan

- Nama, harga, dan stok berada dalam kolom di sebelah foto. Harga tidak lagi terdorong ke bawah oleh tinggi foto.
- Nama tetap lengkap: 13 px dengan tinggi baris 18 px pada daftar mobile. Nama panjang membungkus tanpa ellipsis.
- Padding vertikal baris menjadi 8 px. Foto tetap 44 × 44 px.
- Judul mobile menjadi Produk/Kategori dan tombol aksi berada dalam baris yang sama. Tombol toolbar 36 px; label impor/ekspor tampil mulai 360 px. Pada HP lebih sempit, tombol memakai ikon dengan nama aksesibel dan judul penjelas.
- Skeleton mengikuti baris dan toolbar yang dirapikan.
- Padding baris dan ukuran nama hanya berlaku pada daftar Produk mobile. Toolbar, modal, serta field admin mengikuti perbaikan ukuran bersama di bawah.

## Verifikasi

- Emulasi Chromium pada 320, 360, 414, 768, dan 1440 px: halaman/kontrol tidak melebar di luar viewport.
- Empat contoh Brake Pad seperti pada screenshot setinggi 60–61 px pada HP. Nama sekitar 100 karakter juga diperiksa tanpa teks terpotong.
- Judul dan aksi sejajar pada 320/360/414 px. Jumlah produk tiga digit diperiksa pada 360 px tanpa bertabrakan dengan tombol aksi.
- Detail baris, impor, ekspor, filter kategori/stok, dan tab kategori dapat dibuka kembali. Tidak ada data bisnis yang disimpan.
- 63 tes JavaScript lulus, production build berhasil, dan 70 handler interaksi pada tiga file React tetap sama melalui perbandingan AST.

Pemeriksaan memakai database `sparepart_testing` dengan empat fixture milik audit. Nama/harga/stok fixture dipulihkan setelah pemeriksaan. Hasil merupakan emulasi browser, belum pemeriksaan pada perangkat HP fisik atau regresi piksel otomatis.

## Lanjutan: field admin dan label grup

- Input/select admin pada HP memakai teks 14 px dan tinggi minimum 36 px; padding vertikal 6 px. Tombol utama 36 px dan judul dialog 14 px. Desktop tetap memakai field 14 px/40 px.
- Pencarian POS memakai kontrol bersama yang sama dengan Produk, Data Motor, dan Staf. Pencarian yang sudah lebih kecil, seperti Pesanan, tidak diperbesar.
- Label navigasi, judul grup, dan pilihan grup admin menjadi Motor/Alat. Kunci grup `automotive`/`hardware`, data katalog, format sheet, serta alias impor lama tetap berlaku.
- Mapping Massal menempatkan pencarian/filter dalam dua kolom mulai 360 px. Kolom dropdown menyediakan minimal 150 px serta ruang untuk panah; pada 320 px kembali menjadi satu kolom.
- Header/footer dan jarak antarfield Tambah Produk lebih ringkas. Skeleton pencarian Produk mengikuti tinggi field baru.
- Diverifikasi pada Produk Motor/Alat, POS, Data Motor, Staf, dan Pengaturan di 360 px: field bersama 14 px/36 px, judul grup utuh, tanpa overflow halaman.
- Mapping Massal serta Tambah Produk diuji pada 360 × 760 dan 320 × 480 px: panel tidak melebar, isi dapat digulir, tombol footer tetap dalam viewport. Dropdown kategori yang diuji memiliki ruang teks 108 px untuk label selebar sekitar 105 px, tanpa menimpa panah.
- Pada 768 px, field tetap 14 px/40 px. Build, 63 tes JavaScript, pemeriksaan binding, dan perbandingan handler interaksi berhasil. Tidak ada form bisnis yang disimpan.

Fokus input memakai keyboard perangkat dan perilaku zoom Safari/iPhone belum diuji pada HP fisik.
