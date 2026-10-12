# Impor dan ekspor daftar barang

Menu **Produk → Impor / Ekspor**, hanya untuk owner yang sudah verifikasi email.

## Dari Google Sheets

1. Buka daftar harga yang biasa digunakan.
2. Pilih **File → Download → Microsoft Excel (.xlsx)**. Seluruh tab ikut dalam file.
3. Buka **Produk → Impor**, pilih file, lalu **Baca file**.
4. Pilih tab dan periksa pencocokan kolom. Kolom berbeda bisa dicocokkan melalui dropdown.
5. Pilih cara impor: tambah baru, tambah + perbarui harga, atau perbarui harga saja.
6. Klik **Lihat pratinjau**, periksa nama hasil pencocokan, harga, dan catatan tiap baris.
7. Pilih baris valid yang ingin disimpan, lalu klik **Simpan**.

Excel `.xlsx` membaca semua tab yang terlihat; CSV UTF-8 membaca satu tab. Format lama `.xls` harus disimpan ulang sebagai `.xlsx`. Batas file 4 MB, 16 tab, 40 kolom, dan 2.000 barang. Baris kosong diabaikan. Nama/kategori/harga jual wajib dicocokkan.

## Kolom bahasa Indonesia

| Kolom | Penggunaan |
|---|---|
| Grup Barang | Otomotif, Sepeda, Elektronik, Alat Bangunan. Jika kosong menggunakan grup pilihan saat impor. |
| Kategori | Kategori dalam grup tersebut. Kategori yang belum ada dibuat saat barang baru disimpan. |
| Merek | Opsional. |
| Nama Barang | Nama lengkap. |
| Spesifikasi / Keterangan | Deskripsi umum; kecocokan motor tidak ditambahkan otomatis. |
| Estimasi Modal (Rp) | Diabaikan kecuali pilihan penggunaan estimasi dicentang. |
| Harga Beli (Rp) | Modal yang sudah dipastikan. Lebih diutamakan daripada estimasi modal. |
| Harga Jual (Rp) | Nominal rupiah bulat. Sel numerik paling aman; teks `Rp 80.000` juga diterima. |
| Stok | Stok awal barang baru; kosong berarti 0. Stok barang lama tidak berubah. |
| Satuan | Misalnya pcs, buah, botol, set, meter, sak. Kosong memakai pcs untuk barang baru. |
| Kode Barang | SKU dari sistem untuk pembaruan yang pasti. Barang baru boleh kosong; kode dibuat otomatis. |
| Margin (Rp) | Tidak diimpor. Ekspor menghitung harga jual dikurangi harga beli. |

Sheet asli dengan kolom **Estimasi Modal** tetap dapat digunakan. Template/ekspor menggunakan **Harga Beli**, karena yang diekspor adalah modal tersimpan dalam sistem. Stok, satuan, dan modal kosong terlihat sebagai catatan sebelum disimpan.

## Pembaruan barang lama

- SKU dicocokkan terlebih dahulu. Jika kosong, pencocokan memakai nama lengkap dalam grup yang sama, termasuk variasi nama dengan merek di depannya. Merek yang berbeda tetap dipisahkan. Urutan kata/tanda baca diabaikan; ukuran dan volume tetap diperhitungkan.
- Hasil pencocokan ditampilkan di pratinjau. Jika nama cocok dengan beberapa barang, isi SKU yang benar dari ekspor.
- Barang lama hanya diperbarui **harga jual dan harga beli yang terisi/diizinkan**. Stok, nama, kategori, satuan, gambar, dan kecocokan motor tetap.
- Nama barang yang sama muncul dua kali dalam tab terpilih ditandai bermasalah.
- Baris bermasalah tidak dipilih otomatis. Perbaiki file dan upload ulang jika diperlukan.
- Jika data di sistem berubah setelah pratinjau, penyimpanan dibatalkan seluruhnya dan perlu pratinjau ulang.
- Penyimpanan dan tanda terima berada dalam satu transaksi. Pengulangan permintaan yang sama tidak membuat barang ganda.

## Ekspor

Pilih seluruh katalog atau satu grup, kemudian Excel/CSV. Ekspor memuat seluruh barang pada cakupan tersebut, bukan hanya halaman tabel saat ini. File memuat harga beli dan stok, sehingga hak akses tetap dibatasi ke owner. Teks pengguna disimpan sebagai teks Excel; teks CSV yang berpotensi menjadi rumus diberi awalan apostrof.

## Deployment

- PHP 8.3+, extension `zip` (ditambah extension Laravel yang sudah digunakan).
- Jalankan migration seperti alur deployment biasa. Tabel `product_sheet_imports` menyimpan pratinjau privat selama 30 menit.
- Scheduler: `products:prune-imports` berjalan tiap jam untuk menghapus draft kedaluwarsa. Upload baru juga membersihkan draft kedaluwarsa.
- File upload sementara tidak disimpan di `public`; pratinjau terikat pada owner yang mengupload.
- Rumus Excel tidak dihitung oleh server. Nilai harga harus mempunyai hasil tersimpan dari Excel/Google Sheets; jika belum, buka dan simpan ulang workbook.
