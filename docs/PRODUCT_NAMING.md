# Penamaan barang

Gunakan susunan **jenis barang + merek + seri/ukuran + varian penting**. Cantumkan detail yang membedakan barang yang dijual: ukuran ban, kode pola/TR, tubeless atau non-tubeless, volume oli, tegangan, dan posisi depan/belakang jika barangnya berbeda.

| Barang | Nama | Informasi terpisah |
| --- | --- | --- |
| Ban motor | Ban Luar IRC Ring 16 - 70/90 Non-Tubeless | Peruntukan: Matic Ring 16 (Nouvo/Skywave) |
| Ban varian TR | Ban Luar IRC Ring 14 - 80/90 TR Non-Tubeless | Peruntukan: Matic Trail / Semi |
| Oli | Oli Gardan AHM (120 ml) | Kecocokan motor melalui mapping |
| Alat bangunan | Bor Bosch GSB 18V-50 | Spesifikasi tambahan di deskripsi |

Model motor yang cocok ditempatkan pada mapping Data Motor. Untuk keterangan umum dari daftar harga, deskripsi dapat memakai kalimat `Peruntukan: Matic Ring 16 (Nouvo/Skywave).` Keterangan umum ini belum menjadi mapping kecocokan motor.

POS memisahkan akhiran dalam kurung hanya jika cocok dengan keterangan `Peruntukan:` pada deskripsi. Keterangan ditampilkan di bawah nama pada daftar, grid, dan keranjang. Daftar memprioritaskan baris `Cocok:` dari mapping motor jika tersedia; peruntukan umum menjadi informasi pengganti saat belum ada mapping. Kurung berisi volume, ukuran alternatif, varian, atau keterangan yang belum bisa dipastikan tetap ditampilkan lengkap.

Pemisahan ini mengatur tampilan POS. Nama tersimpan, SKU, harga, pencarian, impor/ekspor, dan snapshot nama pada transaksi tetap menggunakan data katalog asli. Perubahan nama katalog dilakukan saat mengedit barang atau melalui pratinjau impor yang ditinjau terlebih dahulu.
