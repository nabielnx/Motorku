# Pendaftaran usaha dan login Google

## Alur

- Satu akun pengguna terikat ke satu usaha. Owner mendaftar lewat `/register`, mengisi nama/alamat katalog usaha, lalu memverifikasi email untuk membuka dashboard dan katalog.
- Owner mengundang staf melalui Kelola Staf. Undangan hanya mengaktifkan akun di usaha asalnya; staf tidak mendaftarkan usaha baru untuk menerima undangan.
- Login email/password tetap tersedia. Login Google memakai Laravel Socialite, OAuth state dalam session, PKCE, timeout jaringan, serta ID Google stabil (`sub`). Access/refresh token Google tidak disimpan.
- Pengguna Google baru melengkapi data usaha dan membuat password cadangan untuk login email serta konfirmasi perubahan penting. Gmail terverifikasi dan Google Workspace dengan `hd` dapat langsung mengaktifkan usaha. Email pihak ketiga tetap memerlukan tautan verifikasi aplikasi.
- Akun lama tidak digabung otomatis berdasarkan kecocokan email. Masuk dengan password, buka Pengaturan Profil, konfirmasi password dan tautkan Google. Akun nonaktif/undangan tertunda tetap ditolak. Tindakan admin mengganti email/password akun staf lain juga melepas tautan Google lama.
- `/s/{slug}` adalah alamat katalog usaha; navigasi, checkout, pencarian motor dan riwayat membawa konteks toko secara eksplisit. Link katalog tersedia di Pengaturan. `/login` adalah portal bersama; `/login?shop={slug}` menampilkan identitas toko tanpa mengubah kepemilikan akun yang masuk.

## Pemisahan data

`business_id` wajib dan memiliki foreign key pada pengguna, kategori, produk, motor/mapping, pesanan/item, pembayaran, mutasi stok, retur, tutup kas, pengaturan, jenis/entri/mapping referensi, supplier, permintaan checkout, draf impor, urutan nomor dokumen, dan kunci hari kas.

Scope Eloquent, validasi ID/unik, model writes, SQL agregat, cache, kunci impor, serta job kedaluwarsa memakai konteks usaha. Akun login/token dapat dicari secara global untuk autentikasi; pengelolaan staf dan otorisasi data tetap mengikuti usaha akun tersebut. Parameter URL/form tidak dapat mengganti usaha pada route admin.

Nomor dokumen, SKU, kategori, jenis, tanggal tutup kas dan idempotency checkout unik per usaha. Email akun, slug katalog dan ID Google unik global. Produk dua usaha boleh memiliki SKU yang sama. Indeks gabungan mendukung query usaha pada tabel operasional.

Upload baru memakai `{direktori}/{business_uuid}/{file_uuid}.webp`; penghapusan memeriksa kepemilikan file. Foto katalog tetap merupakan aset publik. Riwayat pelanggan dan keranjang dipisah per usaha di browser; keranjang POS dipisah juga per akun. Service worker tidak menyimpan halaman/API privat.

Untuk kode baru, gunakan model scoped atau `BusinessContext::table()`/`attributes()` untuk SQL langsung. `Model::insert()` dan operasi pivot tidak menjalankan event model: sertakan dan validasi ownership secara eksplisit. Jangan memakai `withoutGlobalScope()` di layanan data usaha. Pekerjaan lintas usaha harus memanggil `BusinessContext::run()` untuk setiap usaha dan memulihkan timezone/locale setelahnya.

## Migrasi toko yang sudah ada

1. Backup database dan storage upload; uji pemulihan backup.
2. Jalankan deployment dalam maintenance. Hentikan worker/scheduler yang dipaksa berjalan dalam maintenance.
3. Pasang dependency dari lockfile dan build aset. Jalankan migrasi baru `2026_10_24_180000` sampai `180004`.
4. Migrasi membuat usaha `toko-utama` dengan ID tetap `00000000-0000-4000-8000-000000000001`, mengambil nama dari Pengaturan, lalu menetapkan seluruh data lama ke usaha itu. Stok, foto lama, UUID, nomor dokumen dan hubungan historis dipertahankan. Alamat katalog lama `/` tetap tersedia.
5. Periksa jumlah data, login owner lama, transaksi POS, laporan dan katalog. Perbarui cache konfigurasi/route sesuai alur deployment, restart worker, jalankan health check dan buka maintenance setelah hasil benar.

Jangan mengembalikan kode lama ke database yang sudah berisi beberapa usaha: kode lama tidak menerapkan isolasi. Setelah ada usaha baru, pemulihan memerlukan backup yang konsisten antara kode/database/storage. Migrasi constraint menolak rollback yang akan menyatukan data usaha.

Seeder/demo dan `app:create-owner` tanpa konteks khusus tetap ditujukan untuk usaha lama. Provisioning usaha baru harus melalui layanan onboarding; jangan menjalankan demo seeder untuk akun publik.

## Mengaktifkan Google

Di Google Cloud, buat OAuth Client bertipe **Web application**, lengkapi konfigurasi consent dan daftarkan callback persis untuk environment yang dipakai. Saat aplikasi Google masih dalam mode testing, tambahkan akun penguji; atur publikasi aplikasi sesuai kebutuhan akses pengguna.

Simpan kredensial di environment server, bukan repository atau frontend:

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://domain-anda/auth/google/callback
```

Lokal bisa memakai callback `http://localhost:8000/auth/google/callback` yang didaftarkan terpisah. Gunakan alamat lokal yang sama selama redirect/callback agar session cookie dan OAuth state konsisten. Setelah mengubah environment, perbarui config cache. Tombol Google hanya muncul setelah client ID dan secret tersedia. Jangan menggunakan `stateless()` untuk mengatasi kegagalan state.

SMTP/pengirim email yang berfungsi tetap diperlukan untuk pendaftaran email biasa dan email pihak ketiga. `MAIL_MAILER=log/array` hanya untuk pengembangan. Pengujian otomatis menggunakan identitas/respons Google tiruan; login Google nyata harus diuji di staging setelah kredensial tersedia.

Rujukan: [Laravel Socialite](https://laravel.com/docs/12.x/socialite), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
