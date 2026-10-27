# Performa katalog pelanggan

## Baseline dan cakupan

Baseline berasal dari [PageSpeed mobile 8ib7x6ezaj](https://pagespeed.web.dev/analysis/https-tokopojok-shop-s-toko-pojok/8ib7x6ezaj?form_factor=mobile): Performance 86, FCP 2,7 detik, LCP 3,2 detik, TBT 10 ms, CLS 0, Speed Index 4,6 detik. LCP pada run ini adalah teks di bagian bawah halaman; laporan sebelumnya memilih banner. Hasil tersebut adalah simulasi, bukan data pengguna nyata.

Optimasi ini memakai satu varian per operasi: preload modul katalog, preview gambar yang lebih kecil, dan feed pelanggan yang berganti halaman. Batas eksperimen: fixture lokal, tiga pengulangan benchmark sintetis, tidak menulis production atau mengubah file upload operasional. Pemeriksaan kebenaran mencakup semua produk tetap dapat dijangkau, harga/stok keranjang tetap segar, isolasi usaha, serta pembersihan file ketika upload gagal/dihapus.

## Pemuatan awal

HTML awal halaman `Order/Menu` menyediakan preload modul halaman dan dependensinya melalui manifest Vite. Halaman lain tidak ikut memuat modul katalog. Preload banner menunjuk file yang sama dengan gambar pertama di React, termasuk saat preview tersedia. Banner berikutnya tidak memakai prioritas jaringan `high`. Dimensi preview disediakan untuk rasio awal; ukuran area banner di UI dipertahankan.

## Foto dan inode

File asli tetap dipakai untuk detail dan pengaturan. Kartu produk memakai preview maksimal 480×480, logo 96×96, dan banner 480×960, dengan rasio dipertahankan. Preview dibuat hanya jika sumber lebih besar dan hasil encoding lebih kecil. QRIS, avatar, dan jenis upload lain tidak diberi preview oleh fitur ini.

Maksimal satu file `.preview.webp` tambahan untuk satu file asli. Upload baru membuatnya sebelum referensi disimpan. `BusinessFiles::delete` menghapus pasangan tersebut hanya untuk usaha aktif, termasuk pembersihan setelah persistensi gagal. File asli tidak ditimpa. Halaman GET hanya memeriksa preview yang sudah ada; tidak melakukan resize atau menambahkan pekerjaan antrean.

Gambar lama tetap tampil menggunakan file asli sampai backfill dilakukan. Jalankan dari folder aplikasi, dengan UUID usaha yang benar:

```bash
# Pemeriksaan tanpa membuat file
php artisan images:previews UUID-USAHA --limit=100

# Buat preview untuk batch yang telah diperiksa
php artisan images:previews UUID-USAHA --limit=100 --apply

# Lanjutkan memakai cursor yang dicetak batch sebelumnya
php artisan images:previews UUID-USAHA --limit=100 --after=UUID-PRODUK-TERAKHIR --apply
```

Limit produk per batch 1–1000, ditambah maksimal empat gambar pengaturan. Hentikan ketika jumlah produk batch kurang dari limit. Cache pengaturan usaha yang diproses dibersihkan jika preview baru dibuat. Kegagalan konversi menghasilkan status perintah gagal dan dicatat; file asli tetap tersedia. Perintah tidak memindahkan data, tidak menghapus file asli, dan tidak memproses gambar usaha lain.

## Daftar panjang

Katalog pelanggan berganti halaman dengan maksimal 60 produk per respons dan memakai kontrol pagination bersama. Halaman berikutnya menggantikan feed sebelumnya. Keranjang dan filter tidak dibuang ketika berpindah halaman. Kartu tetap ditampilkan progresif dan foto tetap lazy-loaded. Mode append POS dipertahankan.

Uji 2.000 record sintetis, 60 per halaman, tiga pengulangan:

| Operasi | Baseline append | Pergantian halaman |
|---|---:|---:|
| Puncak record dalam feed | 2.000 | 60 |
| Puncak ukuran JSON record fixture | 371.561 byte | 11.281 byte |

Ini ukuran record fixture, bukan heap browser, total memori aplikasi, atau waktu muat jaringan. Props awal, keranjang, dan komponen lain tetap mempunyai alokasinya sendiri. Tes backend memakai 2.000+ produk untuk memeriksa halaman terakhir, pencarian, dan pembacaan harga/stok terbaru.

Satu foto sintetis, di-encode ulang tiga kali, menghasilkan hasil identik: file asli 1200×1200 sebesar 31.734 byte, preview 480×480 sebesar 14.292 byte, dua file tersimpan. Ini bukan jaminan rasio kompresi yang sama untuk semua foto.

## Reproduksi dan verifikasi rilis

```bash
node scripts/benchmark-catalog-feed.mjs
php tests/benchmarks/storefront-images.php
node --test tests/js/catalogFeedState.test.js
php artisan test --filter='ImagePreviewTest|CatalogPagingTest'
```

Benchmark gambar memakai konfigurasi testing dan disk fixture privat terpisah. Tidak memakai gambar atau tabel production. Contoh file dan log lokal bukan bagian deployment. Jalankan build sebelum tes HTML preload supaya manifest sesuai kode.

Setelah rilis, ulangi PageSpeed pada URL toko yang sama dan bandingkan beberapa run dengan kondisi perangkat/jaringan yang sama. Belum ada skor PageSpeed setelah optimasi ini. Rollback kode tetap bisa membaca file asli tanpa migrasi database; preview tambahan bukan referensi utama data produk.
