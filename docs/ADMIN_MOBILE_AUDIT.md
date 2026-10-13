# Audit tampilan admin — 13 Oktober 2026

## Lingkup dan cara pemeriksaan

Audit pada branch `fix/admin-mobile-layout`, dari `develop` (`dfde51f`), menggunakan build produksi lokal dan akun owner fiktif. Database pengujian terpisah `sparepart_testing`; katalog dan transaksi hosting tidak digunakan.

Data uji mencakup nama produk sekitar 100 karakter, kategori/SKU/catatan panjang, harga jutaan rupiah, stok habis, 7 motor, 28 produk dalam empat kelompok katalog, 15 staf, serta 14 pesanan.

| Halaman | 320 px | 375 px | 414 px | 768 px | 1440 px |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Produk dan stok | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Pesanan | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Detail pesanan | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Data motor | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Laporan keuangan | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Kelola staf | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Pengaturan | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| Profil | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |
| POS | Diperiksa | Diperiksa | Diperiksa | Diperiksa | Diperiksa |

Rute inventory mengarah ke produk. Destinasi otomotif, elektronik, alat bangunan, dan sepeda diperiksa terpisah pada 320 px. Halaman panjang digulir hingga bawah; mode terang dan gelap diperiksa. Pengukuran DOM mencakup lebar halaman, elemen di luar viewport, tombol terpotong, dan perpotongan kontrol. Hasil ditinjau secara visual agar tabel yang sengaja bergulir, tombol di dalam input, dan tautan yang melapisi kartu tidak dianggap tabrakan secara keliru.

Interaksi yang diperiksa meliputi tambah/edit produk, pengaturan stok, kategori, filter, awal impor/ekspor, pratinjau foto produk, tambah motor, mapping sparepart, mapping massal, tambah/edit staf, konfirmasi hapus akun, sidebar, notifikasi, serta keranjang dan dialog pembayaran tunai POS. Form utama juga diperiksa pada 320 × 480 px. Mapping dibuka pada motor pertama dan motor di bawahnya, serta dibandingkan pada tablet dan desktop.

## Temuan dan perbaikan

| Temuan | Perbaikan |
| --- | --- |
| Kontrol bersama 44 px/teks 14 px bercampur dengan kontrol lama 28–34 px/teks 12 px | Tombol utama mobile 40 px/12 px, ikon 36 px, dan input 40 px. Input mobile tetap 16 px. |
| Tambah Produk dan Tambah Mapping membungkus; footer mencapai 50–58 px | Padding/teks tombol dirapikan; label tambah dan simpan pada form diuji tetap satu baris. |
| Padding halaman dan kartu membuat input pengaturan/profil hanya 222 px pada viewport 320 px | Padding halaman 12 px dan kartu 16 px pada mobile; input menjadi 262 px. |
| Avatar/header memakai banyak ruang; judul panjang memenuhi tinggi header | Avatar mobile 36 px, padding trigger lebih kecil, judul dapat membungkus dalam ruang yang tersedia. |
| Filter produk melebar hingga sisi kanan 861 px pada viewport 768 px | Toolbar dapat membungkus menjadi baris berikutnya. Filter tetap bisa digunakan. |
| Filter mapping terpotong dan kategori menimpa harga pada tablet | Bagian sparepart memakai susunan kartu di bawah 1280 px; kategori desktop dapat membungkus; ruang aksi desktop 160 px. |
| Harga sparepart terpisah antara Rp dan angka pada mobile sempit | Nominal tidak membungkus; aksi dipindah ke baris tersendiri di bawah 360 px. |
| Konten form mapping massal menimpa kontrol berikutnya pada layar pendek | Tinggi minimum section tidak dipaksa nol; isi modal bergulir tanpa menekan bagian form. |
| Opsi tambahan mapping dapat melampaui area isi | Area isi dapat bergulir, dengan daftar produk dibatasi tingginya dan footer tetap tersedia. |
| SKU di samping nama pada daftar pilihan sparepart membuat nama terlalu sempit di tablet | SKU ditempatkan di bawah nama agar baris lebih mudah dibaca. |
| Tombol upload membungkus dalam kolom kecil di samping foto | Kontrol upload dapat berpindah ke baris penuh pada produk, motor, dan profil. |
| Tombol stok/edit/hapus produk hanya sekitar 17 px; ikon hapus staf berbeda ukuran | Aksi produk 32 px, ikon staf konsisten 36 px. |
| Tombol lihat password 16 × 16 px | Area sentuh 36 × 36 px dan label aksesibel ditambahkan. |
| Tombol hapus keranjang 22 px dan input pelanggan kecil | Tombol menjadi 32 px; input pelanggan mengikuti ukuran input admin. |
| Tombol hapus pencarian dapat menutupi teks input | Padding kanan input disediakan untuk tombol ikon. |
| Pratinjau foto dapat melampaui layar pendek dan nama terpotong | Tinggi pratinjau dibatasi viewport, dapat digulir, judul membungkus; footer motor/sparepart dapat membungkus. |
| Detail pesanan masih menampilkan kartu putih di mode gelap | Warna kartu, teks, border, dan ringkasan mengikuti tema; nominal dan nama disusun untuk mobile. |
| Tombol simpan pengaturan sticky dapat menimpa field saat halaman digulir | Tombol berada dalam aliran form di bagian bawah. |
| Nama barang POS dibatasi dua baris sehingga ukuran/varian pada nama panjang hilang | Nama tampil lengkap pada daftar dan grid. Harga berada di bawah nama supaya tidak menyempitkan ruang teks; kata tanpa spasi juga dapat membungkus. |
| Tinggi kartu POS dan jarak nama ke harga berubah ketika kategori difilter | Tinggi kartu mengikuti isinya sendiri. Jarak nama ke harga tetap 8 px; harga dan stok berada pada satu baris di daftar. Area foto dan ruang info kecocokan konsisten, scrollbar disediakan tetap, serta tanda barang di keranjang tidak mengubah lebar kartu. Nama panjang tetap membungkus penuh dan hanya menambah tinggi kartu tersebut. |
| Subkategori POS terpisah dari kategori utama oleh jumlah produk dan tombol tampilan | Kategori utama berada di baris atas. Baris berikutnya menempatkan subkategori di kiri serta jumlah produk/pilihan daftar-grid di kanan; subkategori dapat digulir tanpa menggeser kontrol tampilan. |
| Nama ban mencampur identitas barang dengan peruntukan seperti Nouvo/Skywave | Akhiran yang dikonfirmasi oleh `Peruntukan:` pada deskripsi dipindah ke informasi bawah pada daftar/grid/keranjang. Ukuran, TR, jenis ban, dan volume tetap bagian nama. Data katalog dan pencarian tetap memakai nama asli. Pedoman ada di [PRODUCT_NAMING.md](PRODUCT_NAMING.md). |

## Verifikasi dan batas pemeriksaan

- Build produksi berhasil.
- 63 tes JavaScript lulus, termasuk perlindungan ukuran/volume/varian, peruntukan bertingkat, pencarian model motor, dan identitas keranjang.
- Nama POS diperiksa ulang pada daftar dan grid di 320, 375, serta 768 px menggunakan 28 nama panjang. Tidak ada nama terpotong, nominal bertabrakan, atau halaman melebar. Pencarian dengan frasa di bagian akhir nama juga menampilkan hasil dengan nama lengkap.
- Konsistensi kartu diuji dengan campuran nama pendek dan panjang, barang dalam keranjang, stok habis, serta informasi kecocokan yang ada/kosong. Barang yang sama dibandingkan antara semua produk dan filter kategori pada daftar/grid di 375 dan 768 px: ukuran dan jarak nama ke harga tetap sama, tidak ada nama terpotong. Nama panjang dapat menambah tinggi kartunya sendiri tanpa meregangkan kartu lain.
- Pemisahan peruntukan diperiksa memakai tiga nama ban dari katalog (Matic Ring 14, TR, Nouvo/Skywave). Pada daftar 375/768 px, ketiganya setinggi 128 px; nama lengkap dan informasi motor berada di bawahnya. Mapping `Cocok:` tetap diprioritaskan jika tersedia. Grid 320 px serta pencarian `skywave` diperiksa tanpa nama terpotong atau overflow halaman.
- Pemeriksaan binding seluruh frontend berhasil; tidak ada identifier tanpa deklarasi yang baru.
- Perbandingan AST menunjukkan 266 handler interaksi tetap sama pada 19 file React yang berubah.
- Tidak ada perubahan controller, service, database, route, atau validasi bisnis.
- Temuan overflow dan tabrakan di atas diperiksa ulang setelah diperbaiki. Pada skenario yang diperiksa tidak ada overflow horizontal halaman atau tabrakan kontrol yang belum ditangani. Tabel desktop tetap mendukung gulir horizontal di dalam area tabel.
- Ada request logo fixture lokal yang mengembalikan 403; fallback logo tampil. Fixture tidak membawa file logo hosting. Tidak ditemukan error JavaScript aplikasi saat pemeriksaan halaman tersebut.

Pemeriksaan memakai emulasi Chromium, bukan seluruh perangkat fisik. Layar pendek menguji ruang tersedia, bukan keyboard iOS/Android secara langsung. Belum ada baseline screenshot yang disimpan untuk regresi piksel otomatis, sehingga status regresi piksel **INCONCLUSIVE**. Checkout QRIS aktif tidak diuji karena fixture tidak memiliki gambar QRIS; tidak ada pembayaran, penghapusan, atau penyimpanan bisnis yang dijalankan selama pemeriksaan UI.
