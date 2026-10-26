# Pengaturan penghapusan admin

Owner mengatur **Pengaturan → Sistem → Izinkan Penghapusan Data Admin**. Simpan pengaturan untuk menerapkannya. Instalasi yang belum memiliki pengaturan ini mengikuti perilaku sebelumnya: penghapusan diizinkan. Tidak ada migrasi baru untuk sakelar ini.

Saat dinonaktifkan, tombol hapus data/foto admin dikunci dan server menolak semua request DELETE admin, termasuk produk, kategori, supplier, jenis, referensi, motor, mapping motor, akun, avatar, serta gambar Pengaturan. Penghapusan gambar melalui flag `remove_image` pada form tambah/edit juga ditolak. Server membaca nilai terbaru langsung dari database, sehingga tab lama tidak dapat melewati kunci.

Tambah/edit tetap tersedia, tetapi menghilangkan subkategori tersimpan melalui form edit kategori juga ditolak saat terkunci. Keranjang POS/pelanggan dan perubahan isi form yang belum disimpan merupakan data sementara; mengosongkannya tetap diperbolehkan. Pembersihan file lama saat mengganti gambar serta pembersihan internal sistem tidak diatur oleh sakelar ini.

## Jenis bawaan dan buatan sendiri

- `is_system` hanya menandai asal jenis, bukan larangan hapus.
- Semua jenis mengikuti sakelar yang sama, baik kosong maupun berisi data. Tidak ada pengecualian untuk jenis bawaan.
- Untuk jenis Motor bawaan, jumlah data dihitung dari tabel `motorcycles`, bukan `reference_entries`.
- Menghapus jenis produk menghapus kategori/subkategori, produk, mapping, dan foto milik jenis itu secara permanen. Menghapus kategori/subkategori tersimpan juga menghapus isi di dalamnya.
- Menghapus jenis referensi menghapus semua entri, mapping, dan fotonya. Untuk driver Motor, data di tabel `motorcycles` beserta mapping dan fotonya dihapus. Produk yang hanya dihubungkan ke referensi tetap disimpan.
- Dialog konfirmasi menjelaskan isi yang ikut terhapus. Seluruh perubahan database dilakukan dalam transaksi; file dibersihkan setelah commit dan tidak dihapus bila masih dipakai record lain. Kegagalan sebelum commit mengembalikan seluruh perubahan dan mempertahankan file.
- Snapshot nota dan riwayat mutasi stok tetap disimpan dengan referensi produk `NULL`, termasuk pada pesanan aktif. Pembatalan pesanan hanya mengembalikan stok produk yang masih ada; retur produk terhapus memakai opsi tanpa restock.
- Jenis Motor yang telah dihapus tidak dapat menerima record motor baru melalui endpoint lamanya.

Sakelar ini tidak menghapus aturan integritas lain, seperti larangan menghapus owner terakhir, data transaksi tertentu, atau log inventori yang memang wajib diperbaiki melalui koreksi.

## Implementasi dan verifikasi

- `DeletionControlService` membaca pengaturan; `ControlAdminDeletion` melindungi endpoint pada grup web, termasuk API admin yang memakai grup tersebut.
- Prop Inertia `app_settings.deletion_enabled` dan komponen `Admin/DeleteButton` menyelaraskan tombol dengan status pengaturan.
- `php artisan test --filter='AdminDeletionControlTest|PopulatedTypeDeletionTest'` mencakup kunci global, tab lama, method override, foto, jenis bawaan/custom berisi data, penghapusan lebih dari satu batch, rollback, snapshot nota/log stok, pembatalan pesanan, akses pengaturan, dan cakupan seluruh route DELETE.
- `npm test` dan `npm run build` memeriksa frontend serta skeleton bersama.
