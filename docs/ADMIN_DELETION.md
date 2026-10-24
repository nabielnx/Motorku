# Pengaturan penghapusan admin

Owner mengatur **Pengaturan → Sistem → Izinkan Penghapusan Data Admin**. Simpan pengaturan untuk menerapkannya. Instalasi yang belum memiliki pengaturan ini mengikuti perilaku sebelumnya: penghapusan diizinkan. Tidak ada migrasi baru untuk sakelar ini.

Saat dinonaktifkan, tombol hapus data/foto admin dikunci dan server menolak semua request DELETE admin, termasuk produk, kategori, supplier, jenis, referensi, motor, mapping motor, akun, avatar, serta gambar Pengaturan. Penghapusan gambar melalui flag `remove_image` pada form tambah/edit juga ditolak. Server membaca nilai terbaru langsung dari database, sehingga tab lama tidak dapat melewati kunci.

Tambah/edit tetap tersedia, tetapi menghilangkan subkategori tersimpan melalui form edit kategori juga ditolak saat terkunci. Keranjang POS/pelanggan dan perubahan isi form yang belum disimpan merupakan data sementara; mengosongkannya tetap diperbolehkan. Pembersihan file lama saat mengganti gambar serta pembersihan internal sistem tidak diatur oleh sakelar ini.

## Jenis bawaan dan buatan sendiri

- `is_system` hanya menandai asal jenis, bukan larangan hapus.
- Semua jenis mengikuti syarat yang sama: penghapusan diizinkan oleh Pengaturan, dan jenis tidak memiliki data/kategori.
- Untuk jenis Motor bawaan, jumlah data dihitung dari tabel `motorcycles`, bukan `reference_entries`.
- Hapus/pindahkan data dahulu, kemudian hapus jenis. Menghapus jenis tidak melakukan penghapusan massal produk atau referensi.
- Jenis Motor yang telah dihapus tidak dapat menerima record motor baru melalui endpoint lamanya.

Sakelar ini tidak menghapus aturan integritas lain, seperti larangan menghapus owner terakhir, data transaksi tertentu, atau log inventori yang memang wajib diperbaiki melalui koreksi.

## Implementasi dan verifikasi

- `DeletionControlService` membaca pengaturan; `ControlAdminDeletion` melindungi endpoint pada grup web, termasuk API admin yang memakai grup tersebut.
- Prop Inertia `app_settings.deletion_enabled` dan komponen `Admin/DeleteButton` menyelaraskan tombol dengan status pengaturan.
- `php artisan test --filter=AdminDeletionControlTest` mencakup kunci global, tab lama, method override, foto, jenis bawaan, integritas jenis, akses pengaturan, dan cakupan seluruh route DELETE.
- `npm test` dan `npm run build` memeriksa frontend serta skeleton bersama.
