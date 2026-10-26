# QRIS bernominal dengan konfirmasi kasir

Fitur POS membaca QRIS statis toko dan membuat QR baru dengan total pesanan. Pembayaran tetap memakai `qris_manual` dan `manual_qris`; kasir harus memeriksa dana masuk di aplikasi merchant sebelum mengonfirmasi lunas.

## Pengaturan

Owner mengunggah QRIS statis melalui Pengaturan → Gambar QRIS Toko. Pembacaan gambar dilakukan lokal di browser menggunakan jsQR. Payload diperiksa ulang di server: struktur TLV, checksum CRC-16/CCITT-FALSE, tipe statis, identitas QRIS, mata uang IDR, dan negara Indonesia. QR dengan nominal tetap, tip, atau biaya tambahan ditolak agar tagihan tidak berubah.

Untuk gambar lama, tombol **Aktifkan nominal otomatis** membaca gambar tersimpan tanpa perlu mengunggah ulang. Revisi gambar diperiksa agar aktivasi yang tertunda tidak diterapkan pada gambar pengganti. Penghapusan QRIS menghapus file gambar dan menonaktifkan payload tersimpan. Upload lama tanpa payload tetap didukung sebagai QRIS manual; penggantian tersebut menghapus payload sebelumnya.

## Pembayaran

`POST /api/payments/qris/quote` hanya dapat dipakai staf yang berwenang menerima pembayaran. Harga, stok, ketersediaan produk, dan pajak dibaca dari server. Nominal harus sama dengan tagihan yang dilihat kasir, lebih dari nol dan maksimal Rp10 juta. Sumber batas: [Bank Indonesia](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx).

Respons berisi payload dengan nominal, metadata penerima, dan token HMAC yang terikat pada kasir, kuantitas produk, total, serta payload QRIS toko. Gambar PNG dibuat lokal menggunakan qrcode, dengan warna hitam-putih dan quiet zone. Library decoder/generator dimuat saat dibutuhkan.

Pembuatan QR tidak membuat pesanan, pembayaran, atau reservasi stok. Saat kasir mengonfirmasi, token diperiksa terhadap total terbaru di dalam transaksi checkout. Perubahan harga, pajak, jumlah barang, kasir, atau QRIS menyebabkan penolakan dan rollback. Retry checkout yang sama tetap mengikuti mekanisme idempotensi yang sudah ada.

QR hasil konversi tidak mempunyai callback penyedia, pembatasan sekali bayar, atau masa kedaluwarsa yang ditegakkan penyedia. Memindai atau menutup dialog tidak mengubah status pembayaran. Tidak ada webhook atau pengecekan mutasi otomatis pada fitur ini.

Tidak ada migrasi database. Payload memakai penyimpanan pengaturan `store.qris_payload`. Jalankan `npm ci` dan `npm run build` saat memperbarui instalasi lokal; deployment mengikuti workflow build yang sudah ada.
