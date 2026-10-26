# Akses toko publik

Domain utama `/` adalah halaman masuk netral TokoM. Halaman ini tidak memuat katalog, logo, kategori, modul referensi, atau pengaturan toko bawaan, termasuk ketika owner sedang login. `/?shop=slug-valid` mengarahkan ke alamat kanonis `/s/slug-valid`.

Setiap katalog dibuka lewat `/s/{businessSlug}`. Query `shop={businessSlug}` wajib dikirim pada `/catalog/products`, `/payment`, `/order/waiting`, `/order/status`, `/customer/checkout`, riwayat pesanan akun, API pesanan pelanggan, dan Motor Saya. Slug harus menunjuk usaha yang aktif. Slug kosong, tidak dikenal, atau tidak valid menghasilkan 404 pada alur yang membutuhkan toko, sebelum pembacaan katalog atau mutasi transaksi/stok. Cookie login owner tidak menggantikan pilihan toko publik.

Akun pelanggan tetap global. Login, Google, profil, verifikasi email, dan reset password dapat digunakan tanpa pilihan toko dengan tampilan TokoM netral. Akses pesanan tetap memerlukan toko yang dipilih dan autentikasi/token yang sesuai. Login tanpa pilihan toko tidak meneruskan pelanggan ke checkout lama yang tersimpan di sesi.

Admin tetap mengikuti `business_id` akun yang login. Parameter `shop` pada URL admin tidak mengalihkan kepemilikan data. Pengaturan bagian Katalog menampilkan link toko, tombol salin/buka, serta QR PNG yang dapat diunduh. QR dibuat di browser dari `business.public_url` menggunakan paket `qrcode` yang sudah ada. Tidak memakai layanan QR pihak ketiga dan tidak menambah file upload di server.

Manifest PWA dengan `?shop=slug` membuka `/s/slug`. Manifest tanpa toko menggunakan identitas TokoM dan membuka halaman netral. Sitemap tanpa toko hanya memuat halaman netral; sitemap dengan toko memuat halaman publik toko tersebut.

Tidak ada migrasi, penghapusan data, atau perubahan akun owner. Link lama tanpa identitas toko dan PWA yang membuka `/` perlu masuk kembali lewat link/QR toko. Riwayat browser tidak dihapus; data toko bawaan tetap dapat dibaca pada alamat eksplisitnya dengan aturan akses yang sama.
