# Optimasi metadata pencarian katalog

Tanggal pengukuran: 26 Oktober 2026.
Baseline: develop setelah PR #152, commit `30a0b523a6bcf8a0c58e22216732e79b63d02821`.

## Perubahan

- Metadata produk dibaca per 1.000 kandidat, dengan batas maksimum pencarian 10.000 kandidat yang sudah ada tetap berlaku.
- Mapping mengambil ID/nama/tipe motor melalui query terlingkup usaha, tanpa membuat model pivot untuk setiap pasangan. Produk dan kategori tetap mengikuti scope query awal. Kedua sisi mapping diperiksa kepemilikan usahanya.
- Prefix dokumen cache dihitung sekali per batch. Harga dan stok tetap dibaca langsung dari produk terbaru, bukan dokumen cache.
- Pembacaan cache dibatasi 100 key per panggilan. Ini terpisah dari batch metadata. Pada versi Laravel yang diuji, `DatabaseStore::many()` mencari setiap key dalam koleksi hasil menggunakan `firstWhere`, sehingga satu panggilan dengan banyak key memperbesar kerja pencocokan. Kandidat 1.000 key per panggilan ditolak karena memperlambat cache database meskipun cache array lebih cepat.
- Join JSON_TABLE sudah membatasi hasil ke ID yang cocok. Daftar `WHERE IN` kedua dihilangkan pada jalur tersebut. Filter ID tetap dipakai pada sort eksplisit tanpa peringkat dan fallback server lama. Skor dan kosakata pencarian tidak diubah.

Tidak memerlukan migration, Redis, perubahan konfigurasi, atau penggantian frontend. Untuk membatalkan optimasi, revert commit perbaikan ini. Tidak perlu mengembalikan data atau skema.

## Metode pembandingan

Benchmark lokal menggunakan 2.000 produk sintetis, 12 motor, dan 4.000 mapping. Baseline dan kandidat memakai fixture yang sama dalam satu transaksi. Satu warmup lalu lima sampel untuk tiap kasus dan cache store. Cache baseline dan kandidat memakai namespace berbeda. Script membandingkan ID, urutan dan total hasil, lalu memverifikasi rollback fixture.

Waktu mengukur controller/service dan serialisasi JSON dengan aplikasi warm, termasuk pengumpulan query untuk profil. Tidak mencakup seluruh middleware HTTP, jaringan, render React, atau perangkat pelanggan. Database cache diuji terpisah karena perilakunya berbeda dari array cache. Hasil 4,8 detik dari audit sebelumnya tidak dipakai sebagai baseline peningkatan ini, sebab kondisi lokal saat pengukuran ulang berbeda.

## Hasil akhir

Median lima sampel, milidetik:

| Cache | Kasus | Baseline | Perbaikan | Jumlah query baseline → perbaikan |
| --- | --- | ---: | ---: | --- |
| array | Admin, kata umum | 605,15 | 239,74 | 38 → 14 |
| array | Admin, kecocokan motor | 492,59 | 237,81 | 38 → 14 |
| array | Admin, urut harga | 586,55 | 335,47 | 38 → 14 |
| array | Katalog, kecocokan motor | 510,66 | 267,24 | 39 → 15 |
| database | Admin, kata umum | 994,87 | 436,19 | 46 → 34 |
| database | Admin, kecocokan motor | 907,44 | 435,35 | 46 → 34 |
| database | Admin, urut harga | 981,72 | 534,29 | 46 → 34 |
| database | Katalog, kecocokan motor | 919,46 | 457,31 | 48 → 36 |

Kata umum cocok ke 2.000 produk; kecocokan motor cocok ke 335 produk. ID, urutan, total dan ukuran payload tetap sama di kedua versi untuk setiap kasus.

Peak memori proses benchmark, termasuk fixture dan class baseline yang dimuat, mencapai 58 → 64 MiB pada array cache dan 56 → 60 MiB pada database cache. Ini menunjukkan tradeoff batch lebih besar, bukan ukuran memori request production yang terisolasi. Batas kandidat dan pembacaan per batch tetap dipertahankan. Dataset dengan deskripsi panjang atau mapping jauh lebih padat belum diukur.

## Kandidat yang diuji

| Kandidat | Hasil | Keputusan |
| --- | --- | --- |
| Hilangkan filter ID duplikat | Mengurangi waktu SQL pencarian luas | Dipertahankan |
| Batch metadata 1.000 | Query metadata turun, hasil konsisten | Dipertahankan |
| Mapping minimal | Mengurangi hidrasi model/pivot dan waktu PHP | Dipertahankan |
| Cache dibaca 1.000 key sekaligus | Cache database sekitar 1,6 detik, lebih lambat dari baseline sekitar 1 detik | Ditolak |
| Cache dibaca 250 key | Menghilangkan regresi, sekitar 629 ms untuk kata umum | Lebih lambat dari pilihan akhir |
| Cache dibaca 100 key | Lima sampel mengonfirmasi hasil tabel di atas | Pilihan akhir |

## Reproduksi

Gunakan database MySQL lokal `tokom_testing` yang skemanya sudah disiapkan oleh tes dan katalog tesnya kosong. Script tidak menjalankan migration/reset dan menolak katalog tes yang berisi produk. Jangan jalankan bersamaan dengan suite tes lain yang memakai database yang sama.

```bash
php scripts/benchmark-catalog-search.php --baseline-ref=30a0b523a6bcf8a0c58e22216732e79b63d02821 --samples=5 --cache=array
php scripts/benchmark-catalog-search.php --baseline-ref=30a0b523a6bcf8a0c58e22216732e79b63d02821 --samples=5 --cache=database
php artisan test --filter='SearchMetadataTest|CatalogPagingTest|CatalogSearchTest|ProductSearchTest|CatalogPayloadTest'
```

Commit baseline harus tersedia pada Git lokal. Script menyimpan salinan class baseline yang berganti nama di `storage/app/private` yang diabaikan Git. Semua perubahan fixture dan cache database di-rollback. Email menggunakan array transport. Script hanya menerima koneksi MySQL lokal dan database testing yang ditetapkan.

Regresi mencakup pembaruan/penghapusan mapping, perubahan nama motor/kategori setelah cache warm, harga/stok terbaru, cache array/database, scope kedua sisi join termasuk link historis tidak konsisten, lebih dari satu batch, batas query/cache lookup, dan pagination tanpa tumpang tindih.

Perubahan ini belum membuktikan latensi production, beban kasir serentak, performa browser mobile/desktop, atau katalog lebih besar dari fixture. Rilis ke production tetap melalui develop → main dan deploy manual setelah CI lulus.
