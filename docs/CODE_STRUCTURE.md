# Batas modul dan kontrak refactor

## Frontend

- `Pages/Product/Index.jsx` mengatur halaman produk dan state form. Form, preview, konfirmasi hapus dan penyesuaian stok berada di `Components/Product/`.
- `Hooks/useProductNavigation.js` mengatur kunjungan Inertia dan debounce pencarian produk. `Utils/productQuery.js` menyusun parameter filter tanpa menghilangkan pilihan lain.
- `Pages/Motorcycle/Index.jsx` mengatur daftar motor dan pemetaan. Modal ada di `Components/Motorcycle/`; pengambilan data parts, state per motor, debounce serta penjagaan urutan respons ada di `Hooks/useMotorcycleParts.js`.
- `Components/POS/` memegang markup pembayaran dan bantuan shortcut. State transaksi, shortcut dan keranjang tetap dimiliki halaman POS, sehingga lifecycle yang sudah ada tetap sama.
- `Api/customerOrders.js`, `Api/cashReports.js` dan `Api/posSales.js` mengembalikan entity dari endpoint terkait. Adapter menerima envelope HTTP yang sekarang maupun hasil unwrap Axios. Jangan gunakan `entityPayload` untuk paginator: array `data`, metadata dan total harus tetap utuh.

Komponen modal memakai controlled props; kondisi mount, callback, class CSS dan susunan DOM tetap mengikuti halaman semula. Pemisahan file bukan alasan memindahkan state, mengubah fokus, atau mereset form saat modal ditutup.

## Backend

- `ProductSheetService` mengatur draft, preview, pencocokan dan transaksi commit.
- `ProductSheet/ProductSheetReader` membaca CSV/XLSX serta memeriksa batas ZIP/XML, formula cache dan ukuran isi sel.
- `ProductSheet/ProductSheetExporter` menghasilkan template dan ekspor, termasuk neutralisasi formula CSV dan literal string XLSX.
- `ProductImportCategoryService` mencocokkan kategori untuk impor aktif. Repair historis dibekukan pada `Migrations/ReconcileImportedBrakeCategories20261012`; perubahan alias impor baru tidak boleh mengubah repair tersebut. Migrasi yang sudah tercatat tidak dijalankan ulang oleh refactor ini.
- `OrderCancellationService` menangani pembatalan customer, expiry dan pengembalian reservasi bersama. Operasi bersama yang menerima model order dipanggil dalam transaksi yang memegang lock baris order. Otorisasi owner dan transisi admin tetap berada pada jalur OrderService.
- `MotorcyclePart` menyimpan relasi serta kamus kategori berkelompok. Label datar diturunkan dari kamus itu. Aturan klasifikasi nama produk berada di `MotorcyclePartClassifier`; urutan aturan merupakan bagian dari kontrak mapping.

## Kontrak yang tetap dipertahankan

1. Route, permission, props Inertia, label tampilan dan desain responsif.
2. Parameter pagination dan filter, reset halaman saat filter berubah, serta debounce 400 ms untuk produk dan 300 ms untuk parts.
3. Stok kembali sekali, inventory log dan aktornya, lock order serta transaksi atomik. Expiry menandai pembayaran pending sebagai `expired`; pembatalan sebagai `cancelled`.
4. Harga dihitung server, QRIS tetap manual, checkout idempotent dan shortcut POS tetap berlaku.
5. Impor 10 MB, pembatasan ekstraksi dan jumlah barang/tab/kolom, expiry/revision preview, fingerprint, rollback batch dan perlindungan stok/gambar ketika harga diperbarui.
6. Public registration tetap tidak tersedia; undangan staf dan konfigurasi Role Spatie tetap dipakai.

## Verifikasi

Jalankan tes Laravel pada `sparepart_testing`, tes JavaScript, `posCategoryFilter.test.mjs`, build Vite dan Pint. Perubahan halaman juga diperiksa melalui browser: filter gabungan, parts motor atas/bawah, modal produk/pemetaan, keranjang, pembayaran dan shortcut pada mobile/tablet/desktop. Tes backend dan build tidak menggantikan pemeriksaan interaksi tersebut.
