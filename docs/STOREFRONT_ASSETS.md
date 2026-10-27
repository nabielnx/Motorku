# Pemisahan aset katalog dan admin

## Bukti dan batas pengukuran

Laporan [PageSpeed mobile dszy8azlq3](https://pagespeed.web.dev/analysis/https-tokopojok-shop-s-toko-pojok/dszy8azlq3?form_factor=mobile) menunjukkan Performance 85, FCP 2,8 detik, LCP 3,4 detik, TBT 20 ms, CLS 0, dan Speed Index 4,5 detik. Laporan menandai CSS yang tidak dipakai dan bagian library popup sebagai JavaScript yang tidak dipakai saat pemuatan awal. Ini satu pengujian simulasi, bukan data pengguna nyata atau bukti bahwa server lambat.

Pemeriksaan kode dan manifest build membuktikan dua dependensi awal yang dapat dipisahkan: CSS admin di `app.jsx` dan Headless UI di katalog. Pembandingan lokal memakai build production, penelusuran seluruh `imports` statis manifest, deduplikasi file, dan `gzipSync` pada file hasil build. Dependensi dinamis tidak dimasukkan sebagai aset awal. Input compiled view Tailwind pada baseline dan varian pertama dicocokkan dengan fingerprint sebelum tes Laravel dijalankan.

| Aset awal katalog | Sebelum | Setelah |
|---|---:|---:|
| CSS, estimasi gzip | 28.073 byte | 23.355 byte |
| JavaScript, estimasi gzip | 190.197 byte | 150.128 byte |

Angka setelah adalah build lokal final, bukan ukuran transfer HTTP yang diamati atau skor PageSpeed baru. Selisih CSS 4.718 byte dan JavaScript 40.069 byte. Hasil build di CI dapat sedikit berbeda karena versi toolchain dan isi cache compiled view Tailwind. Tidak ada janji skor atau waktu LCP tertentu. Belum ada pengujian PageSpeed setelah perubahan ini dirilis.

Eksperimen dibatasi pada dua varian. Varian pertama belum memenuhi tujuan JavaScript: Rollup menempatkan `clsx`, dependensi bersama, di chunk Headless sehingga katalog masih menarik library popup. Penempatan `clsx` di chunk React/Inertia memperbaiki graph statis. Tidak ada library baru, perubahan database, atau perubahan konfigurasi server.

## Perilaku pemuatan

- CSS admin menjadi entry Vite terpisah dan diimpor layout admin. HTML admin memuatnya di head sebelum skeleton. Navigasi Inertia ke admin tetap mengambil CSS melalui dependensi layout.
- Pagination umum memakai CSS kecil bersama agar kotak panah pelanggan tetap tampil. Aturan admin yang lebih spesifik tetap tersedia pada halaman admin.
- Detail produk dan keranjang memakai `React.lazy`, `Suspense`, dan dynamic import. Pointer/fokus pada pemicu menghangatkan modul. Halaman awal tidak mempunyai dependensi statis Headless UI.
- Saat modul belum tersedia, status pemuatan bisa dibatalkan atau ditutup dengan Escape. Kegagalan menampilkan opsi muat ulang. Data keranjang tetap berada pada state halaman dan penyimpanan yang sudah ada.
- Dialog tetap memakai Headless UI. Komponen lebih dulu terpasang dengan dialog tertutup agar library menemukan root aplikasi sebelum membuka. Ini diperlukan agar latar tetap `inert` setelah dialog pertama ditutup dan dialog berikutnya dibuka. `inert` mencegah interaksi dan fokus keyboard ke latar.
- Backdrop menjaga area klik di luar panel tanpa warna semi-transparan atau blur, mengikuti aturan warna proyek. Latar halaman tetap terlihat.

## Pemeriksaan yang dapat diulang

```bash
npm run build
# Build menjalankan pemeriksaan graph otomatis. Untuk daftar file dan ukuran:
node scripts/check-storefront-assets.mjs --json
php artisan test --filter='StorefrontAssetsTest|ImagePreviewTest'
npm test
```

Gate build gagal jika Headless kembali menjadi dependensi awal katalog, CSS admin masuk ke katalog, CSS admin hilang dari graph navigasi admin, atau CSS pagination bersama hilang. Tes HTML memeriksa katalog saat owner masuk dan posisi stylesheet admin sebelum skeleton. Tes aset secara eksplisit membaca manifest production, meskipun server Vite developer masih berjalan.

Smoke test browser lokal memakai dua produk fixture di `tokom_testing`, server dan konteks browser terpisah, tanpa membuat pesanan atau mengirim email. Hasil: Headless belum diunduh saat katalog awal; detail terbuka; tambah keranjang bekerja; kuantitas 1 ke 2 mengubah total Rp10.000 ke Rp20.000; keranjang bertahan setelah reload; detail lalu keranjang tetap mengunci latar; Tab tetap di dialog; Escape menutup dan mengembalikan fokus ke pemicu; kedua panah pagination 32×32 dengan border 1px; tidak ada error/warning console. Fixture dan server QA dibersihkan setelah pemeriksaan.

Setelah deployment, ulangi PageSpeed beberapa kali pada URL toko, perangkat, dan kondisi yang sama. Bandingkan median FCP/LCP dan aset yang ditransfer, bukan satu perubahan skor. Pembatalan rilis cukup mengembalikan kode; tidak ada migrasi atau file upload yang perlu dipulihkan.
