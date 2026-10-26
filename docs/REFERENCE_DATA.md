# Data Referensi

Navigasi admin mengelompokkan data acuan di **Data Referensi → Motor**. Menu ini mengikuti akses owner. Modul Motor tetap menangani merek, model, spesifikasi, foto, dan mapping kecocokan sparepart.

## Mengelola jenis dari admin

1. Klik nama **Produk** atau **Data Referensi** di sidebar untuk membuka kelola jenisnya. Tombol panah di sebelah nama membuka/menutup submenu secara terpisah. Hanya owner terverifikasi yang dapat mengaksesnya. Shortcut **Produk** di navigasi bawah mobile tetap membuka daftar produk.
2. Pilih tab **Produk** untuk menambah kelompok barang. Nama baru langsung tersedia pada sidebar, pilihan grup kategori, dan impor/ekspor. Mengganti nama tidak mengganti key maupun relasi kategori/produk.
3. Pilih tab **Data Referensi** untuk menambah jenis referensi. Nama data, deskripsi, foto, dan mapping produk sudah tersedia. Tambahkan kolom khusus sesuai kebutuhan, maksimal 20 kolom: teks, teks panjang, angka, tanggal, pilihan, atau ya/tidak. Pilihan mendukung maksimal 30 opsi. Kolom bisa diurutkan dan ditandai wajib.
4. Buka jenis baru dari sidebar atau klik namanya di daftar. Klik **Tambah Data** untuk mengisi form sesuai kolom yang telah diatur. Produk terkait dipilih melalui pencarian, maksimal 50 produk per data; stok tidak berubah karena mapping.

Pencarian data referensi memakai nama. Pencarian produk pada form mapping memakai nama atau SKU, 20 hasil per halaman dengan pembatalan request yang sudah tidak dipakai. Halaman referensi menampilkan 12 data per halaman. Teks dirender melalui React; definisi kolom tidak menjalankan HTML, SQL, atau skrip pengguna.

Foto mengikuti aturan upload aplikasi (maksimal 4 MB, JPEG/PNG/WebP, batas dimensi/piksel) dan dikonversi ke WebP di bawah 1 MB. **Hapus Foto** berlaku setelah form disimpan dan menghapus file penyimpanan; mengganti atau menghapus data referensi juga membersihkan foto lamanya setelah transaksi berhasil.

## Perubahan kolom dan keamanan data

- Jenis bawaan memakai key lama. Referensi Motor tetap memakai form, endpoint, dan mapping khusus motor yang sudah tersedia; kolom fleksibel disediakan untuk jenis referensi baru.
- Label kolom dan urutannya dapat diganti tanpa mengganti key/nilai tersimpan. Kolom yang sudah berada pada jenis berisi data tidak dapat dihapus atau diganti tipenya.
- Penambahan kolom wajib, perubahan kolom menjadi wajib, atau pengurangan opsi diperiksa terhadap data tersimpan sebelum diterapkan. Jika tidak sesuai, perubahan ditolak. Tambahkan kolom opsional lebih dahulu untuk melengkapi data.
- Versi jenis dan versi data diperiksa ketika menyimpan. Form yang sudah kedaluwarsa karena perubahan dari tab lain perlu dimuat ulang.
- Jenis bawaan tidak dapat dihapus. Jenis custom baru dapat dihapus jika tidak memiliki kategori/data; foreign key juga melindungi relasi referensi. Data Motor dan produk lama tidak dimigrasikan ke tabel generik.

## Struktur kode

`data_types` menyimpan nama/key jenis produk dan definisi kolom referensi. `reference_entries` menyimpan nilai kolom per entri. `reference_entry_product` menyimpan hubungan banyak-ke-banyak dengan produk. Seluruh tabel memakai UUID. Form Request memvalidasi struktur permintaan; `DataTypeService`, `ReferenceSchemaService`, dan `ReferenceService` menangani aturan bisnis serta transaksi.

Navigasi menerima `catalog_groups` dan `reference_modules` dari server. File frontend `referenceModules.js` dan `catalogGroupLabels.js` hanya fallback saat properti server belum tersedia. Konstanta `Category::CATALOG_GROUPS` dipertahankan sebagai alias impor file lama (misalnya Otomotif dan Alat Bangunan), bukan pembatas jenis yang bisa dibuat.

`SidebarMenuGroup.jsx` menangani buka/tutup, submenu aktif, ID aksesibilitas yang unik, dan klik navigasi mobile. Setiap grup memiliki state sendiri sehingga menu Produk dan Data Referensi tidak saling membuka atau menutup. Grup tujuan terbuka otomatis ketika salah satu halamannya aktif.

## Deployment dan rollback

Fitur pengelolaan jenis memerlukan dua migration baru: pembuatan tabel generik dan pengisian jenis lama. Migration tidak mengubah stok, transaksi, tabel motor, atau mapping motor. Key grup historis di kategori yang berada di luar preset juga dipertahankan sebagai jenis produk.

Jalankan migration sebelum menggunakan kode baru. Deploy melalui PR ke develop dan verifikasi staging sebelum produksi. Tidak ada dependency baru.

Untuk produksi gunakan perbaikan migration ke depan jika diperlukan. Menurunkan migration schema akan menghapus tabel jenis/referensi baru beserta datanya; backup diperlukan sebelum tindakan tersebut. `down()` migration pengisian preset sengaja mempertahankan konfigurasi pengguna. Rollback kode tanpa menghapus tabel mempertahankan data baru, tetapi versi lama belum menyediakan UI untuk mengelolanya.
