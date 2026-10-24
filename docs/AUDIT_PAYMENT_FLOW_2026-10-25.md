# Audit alur pembayaran pelanggan Motorku — 25 Oktober 2026

> Status tindak lanjut: bagian temuan di bawah merekam audit commit `4fe8449`. Perbaikan diterapkan sesudah audit dalam PR yang sama. Lihat bagian "Tindak lanjut perbaikan" di akhir untuk hasil terkini.


**Hasil: 10 temuan, terdiri dari 2 P1 dan 8 P2.** Fondasi pencatatan pembayaran, akses toko, transisi pesanan dan stok cukup kuat, tetapi alur QRIS pelanggan serta konsistensi riwayat belum lengkap. Prioritas pertama adalah memisahkan limiter polling dari checkout dan menyediakan tahap verifikasi transfer sebelum pembatalan/kedaluwarsa boleh berjalan.

Objek audit: branch `fix/customer-cart-price-refresh`, commit `4fe8449`, PR #130. Cakupan mencakup katalog/keranjang → checkout → QRIS → konfirmasi kasir → penyiapan/pengambilan → pembatalan/kedaluwarsa → riwayat/retur. Audit ini menghasilkan laporan dan probe; source aplikasi tetap sama dengan commit tersebut. File `docs/AUDIT_2026-10-23.md` yang sudah ada tidak diubah.

## Bukti pengujian

| Pemeriksaan | Hasil | Bukti |
| --- | --- | --- |
| Suite Laravel modul Order, Payment, dan konkurensi checkout | **77 passed, 606 assertions** | `storage/app/audit-payment-flow-20261025/domain-tests.log` |
| Suite JavaScript | **90 passed** | `storage/app/audit-payment-flow-20261025/js-tests.log` |
| Probe API/service khusus audit | **7 passed, 42 assertions** | `scratch/PaymentFlowAuditProbeTest.php`, `storage/app/audit-payment-flow-20261025/php-probes.log` |
| Probe handler JavaScript aktual dan utility asli | **3 kelompok temuan terbukti** | `scratch/payment-flow-audit-js.mjs`, `storage/app/audit-payment-flow-20261025/js-probes.json` |
| Browser, data demo terisolasi | Riwayat dua tab, pembatalan setelah QRIS dibuka, dan retur penuh | Screenshot pada bagian bukti visual |

**Arti probe lulus:** probe sengaja mengassert perilaku kode saat ini, termasuk perilaku yang bermasalah. Hasil hijau probe bukan berarti bug sudah diperbaiki. Dua kendala awal pada helper probe—nama method PHPUnit dan kategori fixture yang bentrok—sudah diperbaiki sebelum run final di atas; keduanya bukan temuan aplikasi.

Semua perubahan data pengujian menggunakan **MySQL `sparepart_testing`**, dengan penjagaan nama database. Probe API khusus audit memakai transaksi yang di-rollback. Suite standar kemudian menjalankan reset database pengujian sesuai konvensi repo. Server dan tab demo audit sudah ditutup. Tidak ada transfer bank nyata, pengujian gateway nyata, ataupun perubahan data operasional.

## Temuan berprioritas

### F01 — P1: polling status menghabiskan kuota membuat pesanan

**Lokasi:** [routes/api.php:17](D:/Project/Webs/Motorku/routes/api.php:17), `:20`, `:23`, `:28`; [vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:96](D:/Project/Webs/Motorku/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:96), `:227`; `bootstrap/app.php` penanganan exception API.

Keempat route publik memakai limiter numerik tanpa prefix terpisah. Implementasi Laravel yang terpasang membentuk key dari domain/IP untuk guest, sehingga checkout, status, QRIS, dan cancel berbagi counter dengan batas berbeda.

**Reproduksi API terverifikasi:** buat pesanan → `201`; polling status dua kali → `200, 200`; buat pesanan sah kedua → **`429`**. Customer tidak perlu benar-benar membuat tiga pesanan untuk mencapai batas tiga kali checkout. Polling dari tab lain atau pelanggan di IP yang sama ikut memengaruhi batas ini. Probe juga membuktikan response `429` tidak membawa `Retry-After`, karena renderer exception API membangun response baru tanpa meneruskan header tersebut.

**Dampak:** checkout yang sah tertolak; refresh status dapat membeku tanpa petunjuk kapan mencoba lagi.

**Perbaikan minimum:** beri limiter bernama/prefix berbeda per operasi, pisahkan identitas toko sesuai konteks route, pertahankan header `Retry-After`, dan tampilkan pemulihan yang jelas saat `429`. Acceptance: polling yang sah tidak mengurangi kuota pembuatan order.

### F02 — P1: belum ada tahap transfer menunggu verifikasi yang melindungi pesanan

**Lokasi:** [app/Services/QrisService.php:115](D:/Project/Webs/Motorku/app/Services/QrisService.php:115), [app/Services/OrderCancellationService.php:19](D:/Project/Webs/Motorku/app/Services/OrderCancellationService.php:19), `:44`; [app/Models/Order.php:129](D:/Project/Webs/Motorku/app/Models/Order.php:129); [app/Services/PaymentService.php:42](D:/Project/Webs/Motorku/app/Services/PaymentService.php:42).

Membuka QRIS hanya menghasilkan kode; tidak ada intent/permintaan pemeriksaan pembayaran yang tercatat. Sampai kasir mengonfirmasi, pesanan tetap `pending + unpaid`. Dalam keadaan itu pelanggan masih dapat membatalkan, dan scheduler masih dapat meng-expire pesanan.

**Reproduksi service/API terverifikasi:** QRIS berhasil dibuka → expire atau cancel berhasil → stok dikembalikan → konfirmasi QRIS oleh kasir sesudahnya ditolak **`422`** karena pesanan telah dibatalkan.

**Dampak bersyarat:** bila transfer benar-benar terjadi di bank sebelum kasir memverifikasi, aplikasi dapat lebih dahulu membatalkan order dan melepas stok. Aplikasi kemudian tidak mempunyai jalur rekonsiliasi yang jelas untuk dana tersebut. Audit tidak mengirim uang nyata; yang terbukti adalah gap state dan penolakan konfirmasi berikutnya.

**Perbaikan minimum:** simpan metode pilihan secara terstruktur; sediakan aksi “Saya sudah membayar” yang hanya membuat **permintaan verifikasi**, bukan status lunas. Pesanan dalam pemeriksaan harus punya aturan terpisah untuk cancel, expiry, dan rekonsiliasi kasir. Konfirmasi lunas tetap memerlukan pemeriksaan kasir atau sumber pembayaran tepercaya. Acceptance: klaim pelanggan tidak dapat menandai lunas, tetapi transfer yang menunggu pemeriksaan tidak hilang melalui expiry biasa.

### F03 — P2: tab riwayat lama dapat menimpa dan menyembunyikan pesanan baru

**Lokasi:** [resources/js/Pages/Order/Status.jsx:438](D:/Project/Webs/Motorku/resources/js/Pages/Order/Status.jsx:438), `:458`, `:478`; [resources/js/Utils/orderHistory.js:2](D:/Project/Webs/Motorku/resources/js/Utils/orderHistory.js:2).

Polling menulis ulang seluruh `HISTORY_KEY` dari `ordersRef` tab tersebut. Tidak ada penggabungan dengan data terbaru di storage atau sinkronisasi antar tab. Initial loader juga mengabaikan `CURRENT_ORDER_KEY/PAYMENT_KEY` apabila history sudah berisi satu order.

**Reproduksi browser terverifikasi:** tab B membuka riwayat berisi `ORD-20261025-0001`; tab A membuat `...0002` dan menerima struk sukses; tab A kembali ke katalog; polling tab B menulis ulang daftar lama. Tab riwayat baru kemudian hanya menampilkan **`...0001`**, meskipun `...0002` masih ada di server. Probe JavaScript menjalankan callback polling asli dan initial loader asli, dan membuktikan backup current order ikut diabaikan.

**Dampak:** pesanan aktif dan akses ke QRIS/status dapat hilang dari tampilan. Ini bukan penghapusan order di database, tetapi pelanggan kehilangan jalur normal untuk menemukannya.

**Perbaikan minimum:** pusatkan penyimpanan riwayat, simpan/merge berdasarkan ID pesanan dengan versi server, sinkronkan antar tab, dan gabungkan backup current/payment saat load. Hindari menimpa keseluruhan daftar dari snapshot tab lama. Acceptance: order yang dibuat di tab A tetap terlihat setelah tab B melakukan polling.

### F04 — P2: pesanan batal tetap ditampilkan sebagai menunggu konfirmasi kasir

**Lokasi:** [resources/js/Pages/Order/Waiting.jsx:163](D:/Project/Webs/Motorku/resources/js/Pages/Order/Waiting.jsx:163), `:263`, `:302`.

Banner memilih kondisi pembayaran terlebih dahulu: `unpaid/pending` selalu masuk cabang “Menunggu Konfirmasi Kasir”. Pesanan batal memiliki kombinasi `cancelled + unpaid`, sehingga cabang “Pesanan Dibatalkan” tidak terjangkau. Judul sukses dan kalimat “pesanan sedang diproses” juga selalu ditampilkan.

**Reproduksi browser terverifikasi:** buka QRIS untuk `...0002` → konfirmasi pembatalan berhasil → tombol cancel dan QRIS hilang, tetapi **“Menunggu Konfirmasi Kasir”** tetap muncul. Reload menghasilkan tampilan yang sama.

**Perbaikan minimum:** terminal order status harus mengambil prioritas; ubah judul, penjelasan, warna, serta CTA berdasarkan gabungan order/payment state. Tampilkan alasan “dibatalkan pelanggan” atau “kedaluwarsa”, bukan hanya enum `cancelled`. Batas waktu pembayaran juga perlu terlihat untuk pilihan bayar di kasir, bukan hanya panel QRIS. Acceptance: order batal tidak lagi menyatakan sedang diproses atau menunggu pembayaran.

### F05 — P2: pemulihan checkout kehilangan bukti order dan dapat mengganti identitas retry

**Lokasi:** [resources/js/Pages/Payment/Index.jsx:24](D:/Project/Webs/Motorku/resources/js/Pages/Payment/Index.jsx:24), `:91`, `:114`; [resources/js/Utils/checkout.js:15](D:/Project/Webs/Motorku/resources/js/Utils/checkout.js:15).

Setelah server membuat order, handler menghapus request ID, snapshot checkout, dan cart **sebelum** berhasil menyimpan order/token. Probe mengeksekusi handler aktual dengan kegagalan `setItem(PAYMENT_KEY)`: satu order sudah dibuat, tetapi cart, snapshot, idempotency key, dan token pemulihan semuanya tidak tersimpan. Pesan error menyuruh menghubungi kasir, tanpa menampilkan nomor order yang sudah berhasil dibuat.

Selain itu, metode pembayaran kembali ke `kasir` setelah reload. Jika respons checkout QRIS sebelumnya hilang setelah diproses server, memilih kembali metode default mengubah `notes`/fingerprint dan menghasilkan **request ID baru**. Retry itu tidak lagi terikat pada order sebelumnya. Probe utility asli membuktikan perubahan ID tersebut; audit tidak mengklaim ada charge bank ganda otomatis.

**Perbaikan minimum:** pertahankan sesi checkout, nama, metode, dan request ID sampai receipt tersimpan; simpan hasil server sebelum membersihkan cart. Jika storage gagal, tampilkan receipt/nomor order dari memori dan jalur pemulihan yang jelas. Acceptance: timeout/reload tidak mengubah request ID untuk checkout yang sama, dan kegagalan storage tidak menghilangkan struk yang sudah dibuat.

### F06 — P2: total dapat berubah antara layar konfirmasi dan pembuatan pesanan

**Lokasi:** [resources/js/Pages/Order/Menu.jsx:268](D:/Project/Webs/Motorku/resources/js/Pages/Order/Menu.jsx:268); [resources/js/Pages/Payment/Index.jsx:77](D:/Project/Webs/Motorku/resources/js/Pages/Payment/Index.jsx:77); [app/Http/Requests/Order/StoreCustomerOrderRequest.php:29](D:/Project/Webs/Motorku/app/Http/Requests/Order/StoreCustomerOrderRequest.php:29); [app/Services/OrderService.php:239](D:/Project/Webs/Motorku/app/Services/OrderService.php:239).

Katalog sudah diperiksa saat berpindah ke checkout. Namun, halaman checkout selanjutnya memakai snapshot lokal dan tidak mempunyai pemeriksaan total akhir/versi harga ketika submit. Backend dengan benar menggunakan harga server, tetapi tidak meminta persetujuan ulang pelanggan jika total berubah.

**Probe terverifikasi:** total yang ditampilkan/snapshot `10.000`, harga server menjadi `15.000`, submit dengan `expected_total=10.000` tetap menghasilkan order **`201` dengan total `15.000`**. Ini bukan bug kalkulasi backend dan bukan bukti pemotongan uang otomatis; masalahnya adalah persetujuan terhadap tagihan yang berubah.

**Perbaikan minimum:** kirim expected total atau revision quote dan minta pelanggan meninjau ulang jika harga/pajak berubah, sebelum order final/reservasi dibuat. Acceptance: perubahan harga menghasilkan tahap review, bukan order dengan total baru secara diam-diam.

### F07 — P2: pilihan metode pembayaran belum menjadi kontrak server

**Lokasi:** [resources/js/Pages/Payment/Index.jsx:78](D:/Project/Webs/Motorku/resources/js/Pages/Payment/Index.jsx:78), `:105`; [app/Http/Requests/Order/StoreCustomerOrderRequest.php:29](D:/Project/Webs/Motorku/app/Http/Requests/Order/StoreCustomerOrderRequest.php:29); `CustomerMenuController.php:162`.

Pilihan metode hanya dikirim sebagai teks `notes` dan disimpan sebagai `payment_method` di browser. Tidak ada field pilihan metode yang tervalidasi/tersimpan dan dikembalikan oleh API status.

**Probe terverifikasi:** pilih/kirim preferensi QRIS ketika QRIS dinonaktifkan → order tetap dibuat **`201`** tanpa field metode → permintaan QRIS untuk order itu ditolak **`422`**. Race ketika owner menonaktifkan QRIS setelah checkout dibuka akan menghasilkan order yang tidak sesuai pilihan semula.

**Perbaikan minimum:** field preferensi metode pada kontrak server, validasi ketersediaannya saat checkout, kembalikan melalui status, dan tampilkan pada layar kasir/pelanggan. Field ini adalah preferensi, bukan bukti pembayaran. Acceptance: metode yang sudah tidak tersedia meminta pemilihan ulang sebelum order dibuat.

### F08 — P2: riwayat menyembunyikan status dan rincian pengembalian dana

**Lokasi:** [resources/js/Pages/Order/Status.jsx:129](D:/Project/Webs/Motorku/resources/js/Pages/Order/Status.jsx:129), `:143`, `:310`, `:461`; [app/Http/Controllers/Order/CustomerMenuController.php:162](D:/Project/Webs/Motorku/app/Http/Controllers/Order/CustomerMenuController.php:162); [app/Services/OrderReturnService.php:87](D:/Project/Webs/Motorku/app/Services/OrderReturnService.php:87).

Kartu utama berfokus pada order status; payment status hanya dipakai untuk beberapa kondisi internal. API pelanggan memberikan enum `refunded`, tetapi tidak memberikan jumlah retur, nominal bersih, waktu, atau metode pengembalian. Order terminal juga tidak dipoll lagi setelah pemuatan awal, sehingga refund baru tidak selalu masuk ke tab yang sudah terbuka.

**Reproduksi browser/service terverifikasi:** demo `...0001` diretur penuh `33.300`; backend menyimpan `completed + refunded`; riwayat dan rincian pelanggan tetap hanya menampilkan **“Selesai” dan “Total Pembayaran Rp33.300”** tanpa keterangan pengembalian dana. Probe API juga membuktikan field detail retur tidak ada.

**Perbaikan minimum:** badge pembayaran terpisah dari proses pesanan; tampilkan retur sebagian/penuh beserta nominal dan waktu dari ledger server. Sediakan refresh yang juga memperbarui transaksi terminal ketika diperlukan. Acceptance: transaksi selesai yang diretur tidak tampak sama dengan transaksi selesai tanpa retur.

### F09 — P2: pesanan yang sudah hilang/tidak dapat diakses dapat terus terlihat aktif

**Lokasi:** [app/Http/Controllers/Order/CustomerMenuController.php:160](D:/Project/Webs/Motorku/app/Http/Controllers/Order/CustomerMenuController.php:160); [resources/js/Pages/Order/Waiting.jsx:122](D:/Project/Webs/Motorku/resources/js/Pages/Order/Waiting.jsx:122); `Order/Status.jsx:470`, `:560`.

API status mengembalikan `401` untuk order yang tidak ditemukan/token salah. Halaman Waiting hanya memulihkan `404`; error `401` dibiarkan sehingga snapshot lama dapat tetap aktif. Halaman riwayat lebih baik karena menampilkan pemberitahuan umum, tetapi kartu yang unavailable masih memakai status/CTA lama. Error jaringan, `429`, atau `5xx` juga tidak membedakan data segar dari snapshot lama.

**Bukti:** probe menghapus order demo melalui service yang sah, lalu status menghasilkan **`401`**, bukan `404` yang ditangani Waiting. Jejak handler membuktikan tidak ada cabang UI untuk hasil tersebut.

**Perbaikan minimum:** modelkan loading/fresh/stale/unavailable pada tiap order; tampilkan waktu update terakhir dan tombol coba lagi. Tangani `401/404` secara konsisten tanpa menghapus bukti historis, dan tahan aksi pembayaran/pembatalan yang memerlukan status sah. Acceptance: pesanan tidak tersedia tidak terus menjanjikan pemrosesan aktif.

### F10 — P2: token akses pesanan masih dikirim lewat query string polling

**Lokasi:** [resources/js/Api/customerOrders.js:15](D:/Project/Webs/Motorku/resources/js/Api/customerOrders.js:15); `CustomerMenuController.php:151`.

Polling GET menyertakan `customer_token` pada URL. Token itu juga memberikan akses ke alur QRIS dan pembatalan order terkait. URL dapat tercatat pada access log/proxy/monitoring; `Cache-Control: no-store` tidak menghapus query dari log. Audit membuktikan penempatan token di kode/request contract, **bukan** bahwa token sudah bocor. Temuan ini juga tercantum pada audit sebelumnya dan belum terselesaikan.

**Perbaikan minimum:** pindahkan token ke header khusus atau body POST status, terapkan redaksi pada logging, dan pertahankan pembatasan toko serta no-store. Acceptance: kredensial akses order tidak muncul dalam URL polling.

## Model status pelanggan yang disarankan

Status pembayaran dan status proses order harus tampil sebagai dua informasi yang berbeda.

| Keadaan | Label pembayaran | Label pesanan | Aksi pelanggan |
| --- | --- | --- | --- |
| Baru dibuat, belum membayar | Belum dibayar + batas waktu | Menunggu pembayaran | QRIS / bayar di kasir / batalkan |
| Pelanggan mengirim permintaan pemeriksaan transfer | Menunggu verifikasi kasir | Menunggu verifikasi pembayaran | Lihat status / hubungi toko |
| Dana sudah dikonfirmasi | Pembayaran diterima | Sedang diproses | Lihat rincian |
| Barang sudah siap | Lunas | Siap diambil | Tampilkan nomor pesanan, alamat, kontak toko |
| Sudah diambil | Lunas | Selesai | Lihat struk/riwayat |
| Dibatalkan sebelum pembayaran | Tidak ada pembayaran terkonfirmasi | Dibatalkan + alasan | Belanja kembali |
| Melewati batas tanpa transfer yang sedang diperiksa | Belum dibayar | Kedaluwarsa + waktu | Buat pesanan baru |
| Retur sebagian/penuh | Dikembalikan sebagian/penuh + nominal | Selesai | Lihat rincian pengembalian |
| Status tidak dapat diperbarui | Status pembayaran terakhir + waktu | Data belum diperbarui | Coba lagi / hubungi toko |

Aksi “Saya sudah membayar” tidak boleh langsung mengubah `payment_status` menjadi `paid`. Aplikasi hanya menandai permintaan pemeriksaan; kasir tetap memverifikasi dana. Aturan bagi klaim transfer yang ternyata tidak ada dana perlu eksplisit agar stok tidak tertahan tanpa batas.

Untuk riwayat, gunakan label yang jujur seperti **“Riwayat di perangkat ini”** selama sumbernya masih localStorage. Saat ini riwayat tidak otomatis tersedia di perangkat baru atau setelah data browser dihapus. Ini batas desain guest checkout, bukan klaim order server terhapus.

## Peta state dan aksi

Semua key publik di-scope per toko melalui `businessStorage`; implementasi saat ini tetap berupa beberapa blob terpisah di localStorage.

| State/key | Penulis | Perubahan/risiko interaksi |
| --- | --- | --- |
| `motorku_cart`, timestamp | Menu, Payment | Kuantitas disimpan lokal; harga direkonsiliasi sebelum pindah checkout; dibersihkan setelah response order |
| `motorku_pending_order` | Menu | Snapshot cart/harga/pajak; Payment membacanya, lalu menghapus setelah order dibuat |
| `customer_checkout` | checkoutRequestId, Payment | Identitas retry berdasarkan payload; dihapus sebelum receipt disimpan |
| `motorku_order_for_payment` | Payment | Receipt terakhir untuk Waiting; polling/cancel tidak memperbarui key ini |
| `motorku_current_order` | Payment, Waiting | Receipt terakhir; dapat lebih baru dari history namun diabaikan jika history nonempty |
| `motorku_orders_history` | Payment, Waiting, Status | Beberapa penulis menulis ulang array penuh; snapshot tab lama dapat menghapus entri baru |
| State QRIS lokal | CustomerQrisPayment | Buka/retry/expiry; server total dan token diperiksa; tidak ada state transfer menunggu review di server |
| `order_status`, `payment_status`, payments, returns | Service server | Sumber kebenaran transaksi; UI belum mempresentasikan seluruh kombinasi dengan tepat |

| Touchpoint | Hasil audit |
| --- | --- |
| Lanjut bayar dari keranjang | Sudah refresh katalog dan meminta review perubahan saat perpindahan; gap masih ada setelah checkout dibuka |
| Pilih QRIS/bayar kasir | UI berfungsi; preferensi belum menjadi field server |
| Kirim pesanan | Server harga/stock authoritative; recovery storage dan identitas retry bermasalah |
| Buka QRIS / muat ulang | Token/toko/nominal/state server diperiksa; tidak menandai lunas atau mengubah stok |
| Simpan QRIS | Link download tersedia; file QR yang sudah disimpan tidak dikendalikan ulang oleh status aplikasi |
| Batalkan → konfirmasi | Server menjaga stok dan validitas cancel; tahap transfer menunggu verifikasi belum dimodelkan |
| Polling Waiting | Happy path memperbarui status; terminal banner dan 401 tidak konsisten |
| Lihat status / buka rincian | Data dapat terlihat; list multi-tab, stale state dan refund bermasalah |
| Salin nomor pesanan | Handler clipboard tersedia; tidak ditemukan konflik state pada jalur ini |
| Konfirmasi kasir | Membuat ledger paid dan memindahkan public order ke preparing; guard pembayaran ganda per order tersedia |
| Siap → selesai | Transisi server wajib sudah lunas dan mengikuti urutan status |
| Retur | Ledger, stok dan payment status server diperbarui; informasi pelanggan belum lengkap |

## Fondasi yang sudah bekerja

- Total pembayaran berasal dari server, bukan nominal arbitrer dari browser.
- QRIS pelanggan memeriksa token dan konteks toko; order lunas, dibayar sebagian, refunded, batal, selesai atau expired ditolak untuk permintaan QRIS baru.
- Membuka QRIS tidak membuat payment paid atau melakukan pengurangan stok tambahan.
- Checkout server memiliki idempotency berbasis request ID dan transaksi database. Uji dua proses membuktikan satu sale dan satu pengurangan stok untuk request yang sama.
- Pembayaran ganda pada order yang sama ditolak; transisi ready/completed memerlukan pembayaran lunas; retur dipisahkan dari pembatalan order yang belum dibayar.

## Urutan perbaikan minimum

1. Pisahkan limiter dan perbaiki response/pemulihan 429.
2. Definisikan kontrak metode pembayaran dan tahap pemeriksaan transfer, termasuk cancel/expiry serta rekonsiliasi.
3. Satukan penyimpanan riwayat dan recovery checkout; tutup race antar tab.
4. Gunakan satu resolver status pelanggan untuk Waiting dan Riwayat, dengan prioritas terminal order dan badge pembayaran terpisah.
5. Lengkapi rincian refund, status stale/unavailable, batas waktu dan refresh riwayat.
6. Pindahkan token status keluar query string dan gunakan timestamp ISO untuk sort/format yang konsisten.

Tidak perlu menambah websocket, microservice, atau payment gateway untuk membenahi inkonsistensi UI/storage di atas. Jika konfirmasi dana ingin otomatis, integrasi pembayaran tepercaya adalah pekerjaan terpisah dari QRIS manual yang diaudit ini.

## Bukti visual

- Pesanan demo baru berhasil dibuat: [Struk pesanan baru](C:/Users/NABIL/.codex/visualizations/2026/10/22/01a164d6-5177-7bb1-8b58-d9be61f16ff6/payment-audit/new-order-receipt.jpg)
- Riwayat baru kehilangan order tersebut setelah tab lama polling: [Riwayat setelah ditimpa tab lama](C:/Users/NABIL/.codex/visualizations/2026/10/22/01a164d6-5177-7bb1-8b58-d9be61f16ff6/payment-audit/history-after-stale-tab.jpg)
- Order yang sudah dibatalkan tetap “Menunggu Konfirmasi Kasir”: [Pesanan batal masih menunggu](C:/Users/NABIL/.codex/visualizations/2026/10/22/01a164d6-5177-7bb1-8b58-d9be61f16ff6/payment-audit/cancelled-still-waiting.jpg)
- Retur penuh tidak dijelaskan pada rincian riwayat: [Rincian retur penuh tidak tampil](C:/Users/NABIL/.codex/visualizations/2026/10/22/01a164d6-5177-7bb1-8b58-d9be61f16ff6/payment-audit/refund-not-shown.jpg)

## Batas verifikasi

Audit menggunakan source lokal, API/service probe, dan browser Chromium dengan data demo. Tidak ada pengujian transfer bank, settlement, gateway/webhook, log produksi, atau scheduler yang berjalan di hosting. Potensi token tercatat pada log belum dibuktikan sebagai insiden kebocoran. Format `ordered_at` saat ini adalah string tampilan yang diparse kembali sebagai Date; ini sebaiknya menjadi ISO, tetapi kegagalan lintas browser belum direproduksi. Pengujian aplikasi yang lulus tidak menutupi celah state yang diperlihatkan probe audit di atas.


## Tindak lanjut perbaikan

Semua sepuluh temuan di atas telah ditangani pada implementasi ini:

| Temuan | Perubahan |
| --- | --- |
| F01 | Limiter terpisah per operasi publik; header Retry-After dipertahankan. |
| F02 | Laporan pembayaran tersimpan, tetap unpaid sampai kasir memverifikasi. Review memblokir pembatalan, penghapusan dan expiry. Kasir dapat mengembalikan laporan dengan alasan dan batas waktu baru. |
| F03 | Rekaman per pesanan, merge berdasarkan sync_version, cadangan lama digabung, dan sinkronisasi antar tab. |
| F04 | Satu resolver status; pembatalan/kedaluwarsa mendapat prioritas atas pesan unpaid. |
| F05 | Payload serta ID checkout disimpan sebelum request; receipt/token disimpan sebelum keranjang dibersihkan; retry memakai payload yang sama. |
| F06 | expected_total dibandingkan dengan perhitungan harga/pajak server dalam transaksi sebelum membuat order atau memotong stok. |
| F07 | payment_preference divalidasi dan disimpan; pilihan QRIS diperiksa server sebelum checkout. |
| F08 | Snapshot menyertakan ledger refund dan invoice; order terminal ikut refresh manual serta polling berkala. |
| F09 | Koneksi dipisah fresh/stale/unavailable. Tindakan pembayaran bergantung pada data fresh. Salinan closed order yang tidak bisa diakses dibersihkan satu kali dari daftar dengan cadangan yang dapat dipulihkan. |
| F10 | Klien baru mengirim token status melalui header. Query legacy tetap diterima untuk kompatibilitas receipt lama. |

Dialog kasir kini mendukung QRIS dengan pemeriksaan dana masuk, bukan hanya tunai. UI pelanggan mengikuti arahan penyederhanaan: riwayat datar, satu lembar detail, rincian pembayaran tertutup, QRIS dibuka saat diperlukan. Pembersihan arsip hanya memengaruhi tampilan/penyimpanan browser; fungsi Pulihkan mengembalikan salinan yang disembunyikan.

Validasi akhir: **86 tes Laravel lulus (681 assertions)** pada modul Order, Payment dan CheckoutConcurrency; **103 tes JavaScript lulus**; build produksi dan Laravel Pint lulus. Browser memverifikasi checkout, laporan QRIS, verifikasi kasir, perubahan status, refund, kondisi kosong, salinan tanpa akses, dan koneksi terputus. Tidak ada pembayaran nyata atau pengujian bank/gateway. QRIS tetap diverifikasi manual oleh kasir.

Migrasi bersifat penambahan lima kolom nullable pada orders. Migrasi sudah diterapkan pada lingkungan lokal yang dijaga host/database-nya; deployment tetap perlu menjalankan migrasi tersebut. Data operasional tidak di-reset. Bukti pengujian dan screenshot tetap berada pada artefak lokal; laporan audit awal di atas dipertahankan untuk keterlacakan.
