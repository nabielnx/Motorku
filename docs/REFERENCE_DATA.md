# Data Referensi

Navigasi admin mengelompokkan data acuan di **Data Referensi → Motor**. Menu ini mengikuti akses owner. Modul Motor tetap menangani merek, model, spesifikasi, foto, dan mapping kecocokan sparepart.

## Menambahkan jenis referensi

1. Buat halaman, Form Request, service, model, dan route sesuai domainnya. Contohnya modul Motor menggunakan `Pages/Motorcycle`, `Requests/Motorcycle`, dan `Services/MotorcycleService.php`.
2. Daftarkan tujuan navigasi di `resources/js/Navigation/referenceModules.js`: `key`, `name`, `routeName`, dan `path`. Seluruh modul dalam daftar ini mengikuti akses owner dari menu induk; route backend tetap harus memiliki pembatasan akses sendiri.
3. Tambahkan judul dan skeleton halaman pada `getDestinationInfo` di `AuthenticatedLayout.jsx` bila diperlukan.

`SidebarMenuGroup.jsx` menangani buka/tutup, submenu aktif, ID aksesibilitas yang unik, dan klik navigasi mobile. Setiap grup memiliki state sendiri sehingga menu Produk dan Data Referensi tidak saling membuka atau menutup. Grup tujuan terbuka otomatis ketika salah satu halamannya aktif.

Route `/motorcycles`, nama route `motorcycles.*`, endpoint, dan kontrak data Motor tetap digunakan. Perubahan navigasi ini tidak memerlukan migration.
