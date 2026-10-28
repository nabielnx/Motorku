# Data Referensi

Navigasi admin mengelompokkan data acuan di **Data Referensi → Motor**. Menu ini mengikuti akses owner. Modul Motor tetap menangani merek, model, spesifikasi, foto, dan mapping kecocokan sparepart.

## Mengelola jenis dari admin

1. Klik nama **Produk** atau **Data Referensi** di sidebar untuk membuka kelola jenisnya. Tombol panah di sebelah nama membuka/menutup submenu secara terpisah. Hanya owner terverifikasi yang dapat mengaksesnya. Shortcut **Produk** di navigasi bawah mobile tetap membuka daftar produk.
2. Pilih tab **Produk** untuk menambah kelompok barang. Nama baru langsung tersedia pada sidebar, pilihan grup kategori, dan impor/ekspor. Mengganti nama tidak mengganti key maupun relasi kategori/produk.
3. Pilih tab **Data Referensi** untuk menambah jenis referensi. Nama data, deskripsi, foto, dan mapping produk sudah tersedia. Tambahkan kolom khusus sesuai kebutuhan, maksimal 20 kolom: teks, teks panjang, angka, tanggal, pilihan, atau ya/tidak. Pilihan mendukung maksimal 30 opsi. Kolom bisa diurutkan dan ditandai wajib.
4. Buka jenis baru dari sidebar atau klik namanya di daftar. Klik **Tambah Data** untuk mengisi form sesuai kolom yang telah diatur. Produk terkait dipilih melalui pencarian, maksimal 50 produk per data; stok tidak berubah karena mapping.

Pencarian data referensi memakai nama. Pencarian produk pada form mapping memakai nama atau SKU, 20 hasil per halaman dengan pembatalan request yang sudah tidak dipakai. Halaman referensi menampilkan 12 data per halaman. Teks dirender melalui React; definisi kolom tidak menjalankan HTML, SQL, atau skrip pengguna.

Foto mengikuti aturan upload aplikasi (maksimal 4 MB, JPEG/PNG/WebP, batas dimensi/piksel) dan dikonversi ke WebP di bawah 1 MB. **Hapus Foto** berlaku setelah form disimpan dan menghapus file penyimpanan; mengganti atau menghapus data referensi juga membersihkan foto lamanya setelah transaksi berhasil.

## Referensi untuk pelanggan

Halaman **Referensi** di admin menyatukan modul Motor dan jenis referensi lainnya. Di **Pengaturan → Katalog → Referensi**, tersedia dua toggle yang berdiri sendiri:

- **Referensi Motor** (`references.motorcycles_enabled`): saat ON, server otomatis membuat modul khusus Motor untuk usaha aktif jika belum ada. Form merek/model/tahun dan mapping `motorcycle_parts` tetap dipakai. Tidak perlu membuat jenis Motor manual, dan tidak ada contoh data motor yang ditambahkan. OFF menyembunyikan modul di submenu dan katalog pelanggan tanpa menghapus model, mapping, produk, atau stok. ON kembali memakai modul/data yang sama. Toko baru default OFF.
- **Referensi Lainnya** (`references.enabled`): mengatur submenu dan pencarian pelanggan untuk jenis dengan form fleksibel, terpisah dari Motor. Konfigurasi/data jenis tetap dapat diedit owner di halaman Referensi saat nonaktif.

Untuk jenis selain Motor, buka **Referensi → Edit**, lalu centang **Tampilkan di katalog pelanggan** pada jenis yang ingin dibuka. Jenis custom baru tersembunyi secara default. Motor mengikuti toggle khususnya dan tidak memiliki checkbox publik kedua. Menu **Referensi** di katalog muncul jika setidaknya satu jenis tersedia dan pemesanan online aktif. Menu ini membuka satu halaman pilihan Motor dan referensi lainnya.

Pelanggan memilih jenis, memilih nama referensi, lalu melihat produk tersedia yang benar-benar dimapping ke referensi tersebut. Daftar memakai pagination 12 data atau produk per halaman. Nama dan foto referensi ditampilkan; deskripsi dan nilai kolom tambahan tetap untuk admin. Harga modal dan atribut pivot tidak dikirim ke halaman pelanggan. Tombol **Lihat di katalog** mencari SKU produk di katalog toko yang sama.

Pencarian generik memakai `/cari-kecocokan/{type?}/{entry?}?shop={slug}`. Toko harus disebutkan secara eksplisit. Jenis tersembunyi, data dari jenis berbeda, dan ID usaha lain menghasilkan 404 jika pencarian aktif. Saat keduanya OFF, tautan halaman pelanggan kembali ke katalog dan API motor ditolak. Jenis Motor tetap memakai `/motor-saya?shop={slug}` beserta form dan mapping khususnya. Mematikan Referensi Motor juga menutup URL lama, menghapus tautan motor dari sitemap, dan tidak mengirim mapping motor di katalog publik. Data/mapping tetap tersimpan di admin. Menghapus jenis Motor secara eksplisit mengikuti izin hapus, menghapus data sesuai konfirmasi, dan mengubah toggle menjadi OFF; mengaktifkannya lagi membuat modul kosong.

## Perubahan kolom dan keamanan data

- Jenis bawaan memakai key lama. Referensi Motor tetap memakai form, endpoint, dan mapping khusus motor yang sudah tersedia; kolom fleksibel disediakan untuk jenis referensi baru.
- Label kolom dan urutannya dapat diganti tanpa mengganti key/nilai tersimpan. Kolom yang sudah berada pada jenis berisi data tidak dapat dihapus atau diganti tipenya.
- Penambahan kolom wajib, perubahan kolom menjadi wajib, atau pengurangan opsi diperiksa terhadap data tersimpan sebelum diterapkan. Jika tidak sesuai, perubahan ditolak. Tambahkan kolom opsional lebih dahulu untuk melengkapi data.
- Versi jenis dan versi data diperiksa ketika menyimpan. Form yang sudah kedaluwarsa karena perubahan dari tab lain perlu dimuat ulang.
- Hapus jenis mengikuti pengaturan izin hapus admin. Menghapus jenis produk menghapus kategori dan produk di dalamnya; menghapus jenis referensi menghapus entri dan mapping, tetapi mempertahankan produk terkait. Data Motor dan produk lama tidak dimigrasikan ke tabel generik.

## Struktur kode

`data_types` menyimpan nama/key jenis produk dan definisi kolom referensi. `reference_entries` menyimpan nilai kolom per entri. `reference_entry_product` menyimpan hubungan banyak-ke-banyak dengan produk. Seluruh tabel memakai UUID. Form Request memvalidasi struktur permintaan; `DataTypeService`, `ReferenceSchemaService`, dan `ReferenceService` menangani aturan bisnis serta transaksi.

Navigasi menerima `catalog_groups` dan `reference_modules` dari server. File frontend `referenceModules.js` dan `catalogGroupLabels.js` hanya fallback saat properti server belum tersedia. Konstanta `Category::CATALOG_GROUPS` dipertahankan sebagai alias impor file lama (misalnya Otomotif dan Alat Bangunan), bukan pembatas jenis yang bisa dibuat.

`SidebarMenuGroup.jsx` menangani buka/tutup, submenu aktif, ID aksesibilitas yang unik, dan klik navigasi mobile. Setiap grup memiliki state sendiri sehingga menu Produk dan Data Referensi tidak saling membuka atau menutup. Grup tujuan terbuka otomatis ketika salah satu halamannya aktif.

## Deployment dan rollback

Fitur pengelolaan jenis memerlukan dua migration baru: pembuatan tabel generik dan pengisian jenis lama. Migration tidak mengubah stok, transaksi, tabel motor, atau mapping motor. Key grup historis di kategori yang berada di luar preset juga dipertahankan sebagai jenis produk.

Visibilitas pelanggan memerlukan migration `2026_10_28_000001_add_public_visibility_to_reference_types.php`, yang menambahkan `is_public`. Jenis Motor yang sudah ada diaktifkan agar tautan pelanggan lama tetap berfungsi; jenis lain perlu diaktifkan owner. Pengaturan global yang sudah nonaktif tetap nonaktif. Migration tidak mengubah stok, harga, atau mapping. Jalankan migration saat deploy sebelum membuka kode baru. Tidak ada dependency baru.

Migration `2026_10_28_000002_split_motorcycle_reference_setting.php` menyimpan status Motor lama ke toggle khusus: hanya ON jika sebelumnya pengaturan global dan visibilitas Motor sama-sama aktif. Jenis Motor yang sudah tersembunyi tetap OFF. Migration tidak membuat modul atau data untuk usaha kosong. Menamai referensi umum “Motor” tidak mengubahnya menjadi modul khusus; jika namanya sudah dipakai, modul otomatis memakai nama alternatif tanpa mengubah jenis umum tersebut.

Pada instalasi production pertama, command yang sebelumnya sudah memverifikasi database benar-benar tanpa tabel mengizinkan satu pengaturan hasil migration ini untuk diganti menjadi default Motor OFF. Pemeriksaan usaha, akun, data operasional, preset, dan pengaturan lainnya tetap wajib lolos. Jalur persiapan biasa tetap menolak pengaturan yang sudah ada; pembaruan production biasa tidak menjalankan persiapan instalasi kosong.

Untuk produksi gunakan perbaikan migration ke depan jika diperlukan. Menurunkan migration schema akan menghapus tabel jenis/referensi baru beserta datanya; backup diperlukan sebelum tindakan tersebut. `down()` migration pengisian preset sengaja mempertahankan konfigurasi pengguna. Rollback kode tanpa menghapus tabel mempertahankan data baru, tetapi versi lama belum menyediakan UI untuk mengelolanya.
