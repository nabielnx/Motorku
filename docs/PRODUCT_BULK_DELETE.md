# Memilih dan menghapus banyak produk

Owner dapat mencentang produk dari tampilan daftar desktop/mobile, grid, dan buku. Checkbox memakai gaya dark ink dengan centang kuning yang sama dengan keranjang POS.

## Alur penggunaan

1. Centang beberapa produk, atau gunakan **Pilih halaman** untuk halaman yang sedang terlihat.
2. Untuk seluruh hasil filter lintas halaman, tekan **Pilih semua N hasil**. Produk tertentu tetap bisa dikecualikan.
3. Tekan **Hapus (N)**. Server memeriksa pilihan dan menampilkan jumlah produk yang akan dihapus.
4. Periksa jumlahnya, kemudian konfirmasi. Produk dan foto yang tidak dipakai lagi dihapus permanen. Snapshot nota, transaksi, dan mutasi stok tetap tersimpan.

Pilihan dapat berlanjut antar halaman dan mode tampilan. Perubahan kategori, pencarian, stok, status aktif, kelompok produk, atau tab membatalkan pilihan agar tidak terbawa ke filter lain. Selama perubahan filter belum selesai diterapkan server, aksi pemilihan dinonaktifkan. Perubahan urutan dan halaman tidak mengubah scope pilihan.

## Batas dan konsistensi

- Tersedia bagi owner yang memiliki izin `product.delete` dan ketika penghapusan di Pengaturan diizinkan.
- Maksimal 5.000 produk per proses. Pilihan yang lebih besar perlu dibagi menggunakan filter.
- Konfirmasi berlaku lima menit dan terikat pada owner, usaha, ID/pengecualian, filter, jumlah, serta versi produk yang telah diperiksa.
- Jika pilihan, produk, atau stok berubah, server menolak konfirmasi lama dengan 409. Pengguna perlu memeriksa lagi dan mengonfirmasi ulang.
- Seluruh produk dikunci serta diotorisasi sebelum penghapusan. Kegagalan menggagalkan seluruh transaksi. File dibersihkan setelah commit dan foto bersama yang masih digunakan tetap disimpan.
- Pemilihan ID diperiksa dalam query yang dibatasi ke usaha aktif, tanpa pemeriksaan SQL satu per satu untuk ribuan ID. Filter penghapusan memakai query yang sama dengan daftar produk.
- File dan data transaksi usaha lain tidak menjadi target penghapusan. Tidak ada migration database untuk fitur ini.

## Endpoint

- `POST /api/products/bulk-delete/preview`: menerima `mode: ids` beserta `ids`, atau `mode: filtered` beserta `filters` eksplisit dan `excluded_ids` opsional. Mengembalikan jumlah serta token konfirmasi terenkripsi. Respons tidak di-cache.
- `DELETE /api/products/bulk`: menerima token konfirmasi. Pengaturan hapus, hak akses, scope usaha, masa berlaku, dan snapshot produk diperiksa kembali.

## Verifikasi

- 13 tes backend penghapusan massal: subset, seluruh hasil lintas halaman, pengecualian, filter gabungan, scope usaha, foto bersama, izin, penghapusan terkunci, perubahan stok/ID, expiry, replay, rollback, snapshot nota/mutasi, ukuran batch, serta akses tamu.
- Regresi produk, pencarian, kategori, penghapusan permanen, dan isolasi usaha: 60 tes lulus sebelum penyempurnaan validasi; suite bulk dijalankan ulang setelahnya.
- 123 tes JavaScript lulus, termasuk pemilihan halaman, semua hasil dengan pengecualian, scope filter, dan validasi konfirmasi.
- Build, Pint, Composer audit dan npm audit lulus; kedua audit melaporkan nol kerentanan.
- Browser memakai akun dan data fiktif di `tokom_testing`, terpisah dari database usaha. Pemilihan bertahan lintas halaman, dialog dapat dibatalkan, filter membatalkan pilihan, dan pemilihan melalui keyboard mempertahankan fokus di tampilan buku.
- Emulasi mobile 375 × 812 pada grid/buku dan tampilan desktop diperiksa. Lebar dokumen tetap 375 pada viewport 375. Pemilihan dinonaktifkan saat pencarian menunggu hasil baru.
- Uji penghapusan pada fixture: 40 produk sesuai filter, satu dikecualikan, 39 dihapus. Tujuh produk tersisa: satu pengecualian dan enam produk di kategori lain.
