# Toko Sparepart — Master Alur Sistem & Arsitektur Lengkap (Comprehensive System Flow)

> **Dokumen Arsitektur & Alur Kerja Lengkap Toko Sparepart**  
> Sistem manajemen toko sparepart berbasis web dengan katalog dan pre-order online, pencarian sparepart yang kompatibel dengan motor, POS kasir, inventaris, pembayaran tunai, dan QRIS statis yang dikonfirmasi kasir.

---

## DAFTAR ISI
1. [Ringkasan Arsitektur & Tech Stack](#1-ringkasan-arsitektur--tech-stack)
2. [Role & Hak Akses (Role-Based Access Control)](#2-role--hak-akses-role-based-access-control)
3. [Model Database & Relasi Entitas](#3-model-database--relasi-entitas)
4. [Alur Kerja Lengkap (End-to-End User Journeys)](#4-alur-kerja-lengkap-end-to-end-user-journeys)
   - [4.1 Alur Customer: Pre-Order Online via QR Katalog](#41-alur-customer-pre-order-online-via-qr-katalog)
   - [4.2 Alur Customer: Fitment Engine "Motor Saya"](#42-alur-customer-fitment-engine-motor-saya)
   - [4.3 Alur Kasir: Penjualan Langsung via POS (Point of Sale)](#43-alur-kasir-penjualan-langsung-via-pos-point-of-sale)
   - [4.4 Alur Pemenuhan Pesanan (Order Fulfillment Lifecycle)](#44-alur-pemenuhan-pesanan-order-fulfillment-lifecycle)
   - [4.5 Alur Manajemen Motor & Mapping Sparepart (Fitment Management)](#45-alur-manajemen-motor--mapping-sparepart-fitment-management)
   - [4.6 Alur Inventaris, Stock Adjustment & Audit Trail](#46-alur-inventaris-stock-adjustment--audit-trail)
   - [4.7 Alur Laporan & Analytics Owner](#47-alur-laporan--analytics-owner)
5. [Mesin Status (State Machine) & Aturan Bisnis (Business Guards)](#5-mesin-status-state-machine--aturan-bisnis-business-guards)
6. [Arsitektur Pembayaran](#6-arsitektur-pembayaran)
7. [Matriks Endpoint API & Validasi Form Requests](#7-matriks-endpoint-api--validasi-form-requests)
8. [Mekanisme Keamanan, Konkurensi & Integritas Data](#8-mekanisme-keamanan-konkurensi--integritas-data)

---

## 1. Ringkasan Arsitektur & Tech Stack

```mermaid
graph TD
    ClientCustomer[Customer Browser / Mobile] -->|Inertia.js / JSON API| WebServer[Nginx / Web Server]
    ClientStaff[Staff / Owner Browser] -->|Inertia.js SPA| WebServer
    
    subgraph Backend [Laravel 12 Application Layer]
        WebServer --> Routing[Routes: web.php / api.php]
        Routing --> Middleware[Middleware: Auth / Spatie Roles / CSRF / Throttle]
        Middleware --> FormRequests[Form Requests: Validasi Input]
        FormRequests --> Controllers[Controllers: Thin Presentation Layer]
        Controllers --> Services[Services Layer: Business Logic & Transactions]
        Services --> Eloquent[Eloquent Models: UUIDs, SoftDeletes]
    end
    
    subgraph DataStore [Database & Cache Layer]
        Eloquent --> MySQL[(MySQL Database)]
    end
    
```

- **Backend**: Laravel 12 (PHP 8.2+) dengan pola arsitektur **Controller → Service → Model**. Seluruh aturan bisnis, kalkulasi harga/pajak, transaksi database, dan mutasi stok diisolasi di `app/Services/`.
- **Database**: MySQL dengan primary key UUID (`HasUuids`), Soft Deletes pada entitas utama (`Product`, `Order`, `Motorcycle`, `Category`), dan indeks pada kolom pencarian dan tanggal.
- **Frontend**: Single Page Application (SPA) menggunakan **Inertia.js** + **React 18** + **Vite** + **Tailwind CSS**.
- **State & UI**: Ikon Feather (`react-icons/fi`) dan Game Icons (`react-icons/gi`), auto-refresh reactive state, responsive mobile-first untuk customer dan desktop-optimized untuk POS kasir.

---

## 2. Role & Hak Akses (Role-Based Access Control)

Sistem menggunakan `spatie/laravel-permission` dengan 2 role utama:

| Fitur / Modul | Owner (`owner`) | Kasir (`cashier`) | Customer (Publik / Guest) |
|---|:---:|:---:|:---:|
| **Redirect Setelah Login** | `/dashboard` | `/pos` | N/A |
| **Katalog QR & Pre-order (`/`)** | ✓ | ✓ | ✓ (Tanpa login) |
| **Pencari Part "Motor Saya" (`/motor-saya`)** | ✓ | ✓ | ✓ (Tanpa login) |
| **Tracking Pesanan (`/order/status`)** | ✓ | ✓ | ✓ (Via Customer Token) |
| **POS Kasir (`/pos`)** | ✓ | ✓ | ✗ |
| **Daftar & Status Pesanan (`/orders`)** | ✓ | ✓ | ✗ |
| **Pembayaran Pesanan (Tunai/QRIS Manual)** | ✓ | ✓ | ✗ |
| **Katalog Sparepart (`/products`)** | Read & Write (CRUD) | Read Only (Lihat & Cari) | ✗ |
| **Data Motor & Mapping (`/motorcycles`)** | Read & Write (CRUD) | Read Only | ✗ |
| **Penyesuaian Stok (`/products`) & Audit Stok (API)** | Read & Write | ✗ | ✗ |
| **Dashboard KPI & Statistik (`/dashboard`)** | ✓ | ✗ | ✗ |
| **Laporan Penjualan & Print (`/reports`)** | ✓ | ✗ | ✗ |
| **Kelola Staff & User (`/users`)** | ✓ (Minimal 1 Owner Aktif) | ✗ | ✗ |
| **Pengaturan Toko & Pajak (`/settings`)** | ✓ | ✗ | ✗ |
| **Reset Transaksi** | ✓ (Wajib Verifikasi Password) | ✗ | ✗ |

---

## 3. Model Database & Relasi Entitas

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "handles (cashier_id)"
    USERS ||--o{ INVENTORY_LOGS : "logs (created_by)"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    PRODUCTS ||--o{ INVENTORY_LOGS : "tracked in"
    PRODUCTS ||--o{ MOTORCYCLE_PARTS : "mapped as"
    MOTORCYCLES ||--o{ MOTORCYCLE_PARTS : "compatible with"
    ORDERS ||--|{ ORDER_ITEMS : "has items"
    ORDERS ||--o{ PAYMENTS : "paid with"
    
    USERS {
        uuid id PK
        string name
        string email
        string password
        boolean is_active
        string avatar_url
    }
    
    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string sku UK
        string name
        decimal price
        int stock
        int minimum_stock
        string unit
        boolean is_available
    }
    
    MOTORCYCLES {
        uuid id PK
        string brand
        string model
        string slug UK
        int year_start
        int year_end
        int engine_cc
        string engine_type
        string image_url
    }
    
    MOTORCYCLE_PARTS {
        uuid id PK
        uuid motorcycle_id FK
        uuid product_id FK
        string part_category
        string notes
        boolean is_recommended
    }
    
    ORDERS {
        uuid id PK
        string order_number UK
        uuid cashier_id FK
        string customer_name
        string customer_access_token
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total
        string order_status
        string payment_status
        string payment_method
    }
    
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string product_name
        string product_sku
        decimal unit_price
        int quantity
        decimal subtotal
        string notes
    }
    
    PAYMENTS {
        uuid id PK
        uuid order_id FK
        string payment_method
        decimal amount_paid
        decimal amount_received
        decimal change_amount
        string status
        string reference_number
    }
    
    INVENTORY_LOGS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        int quantity_change
        int stock_before
        int stock_after
        string type
        string notes
    }
```

---

## 4. Alur Kerja Lengkap (End-to-End User Journeys)

### 4.1 Alur Customer: Pre-Order Online via QR Katalog

```
[ Customer Buka Katalog / Scan QR di Banner ]
                │
                ▼
      Halaman Katalog (/)
   ├── Filter Kategori Sparepart
   ├── Filter Kompatibilitas Motor (Brand / Model)
   └── Cari Nama / SKU Produk
                │
                ▼
   [ Masukkan ke Keranjang ]
   ├── Atur Quantity (Max 200 unit/item, Max 20 item)
   └── Tambahkan Catatan Khusus
                │
                ▼
  [ Checkout / Pembayaran (/payment) ]
   ├── Isi Nama Pelanggan (Wajib)
   └── Bayar di kasir saat ambil pesanan
                │
                ▼
  POST /api/customer/order (Database Transaction + lockForUpdate)
   ├── Validasi ketersediaan & stok barang
   ├── Buat nomor pesanan (ORD-YYYYMMDD-XXXX)
   ├── Kurangi stok & catat InventoryLog (SALE)
   └── Generate customer_access_token unik (64 char)
                │
                ▼
  [ Halaman Status Pesanan (/order/status) ]
   ├── Polling status berkala tiap 5 detik
   └── Tampilkan status pesanan; kasir memastikan pembayaran sebelum memproses
                │
                ▼
  [ Customer Datang ke Toko & Ambil Barang Tanpa Antre ]
```

---

### 4.2 Alur Customer: Fitment Engine "Motor Saya"

1. Customer membuka rute `/motor-saya`.
2. Customer memilih **Brand** (Honda, Yamaha, Suzuki, Kawasaki).
3. Customer memilih **Model & Varian Motor** (misal: *Honda Beat ESP 110cc (2020-sekarang)*).
4. Sistem memanggil `GET /api/motor-saya/{motorcycleId}/parts`.
5. Halaman menampilkan sparepart yang **100% kompatibel**, terkelompok rapi per sistem motor:
   - **Pelumas & Cairan**: Oli Mesin, Oli Gardan, Air Radiator, Minyak Rem.
   - **Kaki-kaki & Roda**: Ban Luar/Dalam Depan/Belakang, Bearing Roda, Shockbreaker.
   - **Pengereman**: Kampas Rem Depan/Belakang, Piringan Cakram, Master Rem.
   - **Penggerak & Transmisi**: V-Belt CVT, Roller, Kampas Ganda, Gear Set & Rantai.
   - **Kelistrikan & Pengapian**: Busi, Aki, Kiprok, CDI/ECU, Koil.
   - **Mesin & Filter**: Filter Udara, Filter Oli, Piston Kit, Noken As.
6. Customer dapat langsung memasukkan sparepart yang tepat ke keranjang tanpa takut salah beli.

---

### 4.3 Alur Kasir: Penjualan Langsung via POS (Point of Sale)

```
[ Kasir Buka Layar POS (/pos) ] (Shortcut Keyboard: F1, F2, F8)
                │
                ▼
   [ Cari & Pilih Produk ]
   ├── Barcode / SKU Scan
   ├── Pencarian Cepat Nama Sparepart
   └── Filter Tipe Motor Pelanggan
                │
                ▼
   [ Keranjang Transaksi ]
   ├── Ubah jumlah qty
   └── Tambah diskon transaksi (opsional)
                │
                ▼
   [ Modal Pembayaran ]
   ├── Opsi 1: TUNAI
   │     ├── Masukkan uang diterima (amount_received)
   │     ├── Sistem menghitung uang kembalian (change_amount)
   │     └── Klik "Bayar Tunai" ──► Order langsung 'completed' & 'paid'
   │
   └── Opsi 2: QRIS MANUAL
         ├── Tampilkan gambar QRIS statis toko yang diunggah owner
         ├── Customer scan dan mengetik nominal pembayaran di aplikasi mereka
         ├── Kasir memastikan dana diterima, lalu klik "Konfirmasi Sudah Dibayar"
         └── Order langsung 'completed' & 'paid'; referensi pembayaran opsional
                │
                ▼
   [ Cetak Struk Thermal 58mm / 80mm Otomatis ]
```

---

### 4.4 Alur Pemenuhan Pesanan (Order Fulfillment Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> Pending : Order Dibuat (Online/POS)
    
    Pending --> Preparing : Kasir/Staff Klik "Proses Pesanan" (Wajib Paid)
    Pending --> Cancelled : Owner Batalkan Pesanan (Stok Dikembalikan)
    
    Preparing --> Ready : Staff Selesai Ambil Barang (Siap Diambil)
    
    Ready --> Completed : Customer Datang & Ambil Barang (Selesai)
    
    Completed --> [*]
    Cancelled --> [*]
```

#### Aturan Guard pada Transisi Pesanan:
- **Lunas Sebelum Disiapkan**: Backend `OrderService::updateOrderStatus` menolak perubahan ke `preparing`, `ready`, atau `completed` jika status pembayaran masih `unpaid`.
- **Hak Pembatalan**: Hanya user dengan role `owner` yang berhak membatalkan (`cancelled`) pesanan, dan hanya bisa dilakukan saat status masih `pending`.
- **Pengembalian Stok Otomatis**: Saat pesanan di-cancel, seluruh item pesanan dikembalikan ke inventaris produk secara otomatis melalui `InventoryService` dengan log audit `type = 'RETURN'`.

---

### 4.5 Alur Manajemen Motor & Mapping Sparepart (Fitment Management)

1. Owner/Staff membuka menu **Data Motor** (`/motorcycles`).
2. **Tambah / Edit Model Motor**:
   - Validasi via `StoreMotorcycleRequest` / `UpdateMotorcycleRequest`.
   - Input Brand, Model, Tahun Mulai, Tahun Akhir, CC Mesin, Tipe Mesin (Matic/Bebek/Sport), dan Foto.
   - Slug unik dibuat otomatis (misal: `honda-beat-110-2020`).
3. **Mapping Sparepart Kompatibel per Model**:
   - Klik kartu motor untuk membuka panel detail.
   - Klik **"Tambah Part Baru"** (Validasi via `AttachMotorcyclePartRequest`).
   - Pilih tipe komponen dari dropdown terstruktur `<optgroup>` (*Pelumas, Kaki-kaki, Pengereman, CVT, dll*).
   - Cari & pilih produk sparepart dari katalog.
   - Masukkan catatan khusus dan opsi centang `⭐ Rekomendasi`.
   - Validasi backend mencegah mapping duplikat untuk produk yang sama pada satu motor.
4. **Navigasi & Filter Sparepart per Motor**:
   - Pencarian instan (Live Search) nama sparepart, SKU, atau catatan.
   - Filter dropdown grup kategori & tipe spesifik.
   - Toggle tombol filter `⭐ Rekomendasi`.
   - **Paginasi Sparepart** (5, 10, 20 per halaman) menjaga layout tetap ringkas dan tidak memanjang ke bawah.
5. **Edit & Hapus Mapping**:
   - Update mapping via `UpdateMotorcyclePartRequest`.
   - Hapus mapping via `DELETE /motorcycles/{motorcycleId}/parts/{partId}`.

---

### 4.6 Alur Inventaris, Stock Adjustment & Audit Trail

Setiap pergerakan fisik stok sparepart memiliki catatan mutasi permanen di tabel `inventory_logs`:

```
        MUTASI STOK (InventoryLog)
 ┌───────────────────┬────────────────────────────────────────────────────────┐
 │ Tipe Mutasi       │ Pemicu / Trigger                                       │
 ├───────────────────┼────────────────────────────────────────────────────────┤
 │ SALE              │ Pesanan baru dibuat (Customer QR / POS Kasir)          │
 │ RETURN            │ Pesanan pending dibatalkan oleh Owner                  │
 │ IN                │ Penambahan stok masuk / Restock dari Supplier          │
 │ OUT               │ Pengurangan stok rusak, hilang, atau kadaluarsa        │
 │ ADJUSTMENT        │ Stock opname fisik berkala                             │
 └───────────────────┴────────────────────────────────────────────────────────┘
```

- Penyesuaian stok di `/products` mencatat stok sebelum/sesudah, jumlah perubahan, pengguna, dan alasan dalam `inventory_logs`.
- Log inventaris **tidak dapat dihapus via API** untuk menjaga integritas pembukuan dan mencegah manipulasi data stok.

---

### 4.7 Alur Laporan & Analytics Owner

1. **Dashboard KPI Owner (`/dashboard`)**:
   - Ringkasan pendapatan kotor hari ini, kemarin, dan bulan ini.
   - Jumlah transaksi sukses & rata-rata nilai transaksi (AOV).
   - Antrean pesanan aktif (`pending`, `preparing`, `ready`).
   - Widget peringatan stok menipis (`stock <= minimum_stock`).
   - Grafik breakdown penjualan per jam & daftar produk terlaris (*Top Selling Spareparts*).
2. **Laporan Penjualan (`/reports`)**:
   - Filter berdasarkan rentang tanggal fleksibel (Hari ini, 7 hari terakhir, 30 hari, kustom).
   - Ringkasan total penjualan, potongan diskon, pajak terkumpul, dan pendapatan bersih.
   - Tabel rincian per transaksi lengkap dengan nama customer, kasir, metode pembayaran, dan status.
   - Format siap cetak (Printable View) yang bersih untuk arsip fisik pembukuan.

---

## 5. Mesin Status (State Machine) & Aturan Bisnis (Business Guards)

### 5.1 Matriks Transisi Status Pesanan (`order_status`)

| Status Awal | Status Tujuan yang Diizinkan | Syarat & Kondisi |
|---|---|---|
| `pending` | `preparing` | Status pembayaran harus `paid` |
| `pending` | `cancelled` | Hanya role `owner` (Stok dikembalikan otomatis) |
| `preparing` | `ready` | Pesanan selesai disiapkan oleh staf toko |
| `ready` | `completed` | Barang telah diserahkan kepada customer |
| `completed` | *Final (Tidak bisa diubah)* | Mutasi telah dicatat ke laporan keuangan |
| `cancelled` | *Final (Tidak bisa diubah)* | Transaksi batal permanen |

### 5.2 Matriks Transisi Status Pembayaran (`payment_status`)

```
unpaid ──► paid (kasir mengonfirmasi pembayaran tunai atau QRIS Manual)
paid ──► refunded (seluruh barang diretur oleh owner)
```

- **Idempotency Guard**: Jika order sudah berstatus `paid`, request pembayaran ulang akan ditolak oleh sistem untuk mencegah double ledger entry.
- Riwayat pembayaran dari integrasi lama tetap disimpan sebagai data transaksi, tanpa membuat pembayaran baru melalui layanan tersebut.

---

## 6. Arsitektur Pembayaran

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Owner as Owner
    participant POS as Kasir / POS
    participant App as Laravel Backend
    Owner->>App: Unggah gambar QRIS toko di Pengaturan
    POS->>App: GET /api/settings/qris-image
    App-->>POS: URL gambar QRIS statis
    POS-->>Customer: Tampilkan QRIS dan total belanja
    Customer->>Customer: Scan QRIS dan ketik nominal di aplikasi pembayaran
    Customer-->>POS: Tunjukkan bukti pembayaran
    POS->>POS: Pastikan dana masuk
    POS->>App: POST /api/orders/pos-sale (qris_manual)
    App->>App: Simpan pembayaran dan tandai order paid
    App-->>POS: Konfirmasi lunas dan struk
```

---

## 7. Matriks Endpoint API & Validasi Form Requests

### 7.1 Rute Autentikasi & Manajemen Staff
| Method | URI | Handler | Middleware / Role | Form Request / Validasi |
|---|---|---|---|---|
| `POST` | `/login` | `AuthenticatedSessionController@store` | `guest` | `LoginRequest` |
| `POST` | `/logout` | `AuthenticatedSessionController@destroy` | `auth` | Session Token |
| `GET` | `/users` | `UserController@indexWeb` | `role:owner` | N/A |
| `POST` | `/api/users` | `UserController@store` | `role:owner` | `StoreUserRequest` |
| `PUT` | `/api/users/{id}` | `UserController@update` | `role:owner` | `UpdateUserRequest` |
| `DELETE` | `/api/users/{id}` | `UserController@destroy` | `role:owner` | Minimum 1 owner check |

### 7.2 Rute Motor & Mapping Sparepart (Fitment)
| Method | URI | Handler | Middleware / Role | Form Request / Validasi |
|---|---|---|---|---|
| `GET` | `/motorcycles` | `MotorcycleController@indexWeb` | `auth` | N/A |
| `POST` | `/motorcycles` | `MotorcycleController@store` | `auth` | `StoreMotorcycleRequest` |
| `PUT` | `/motorcycles/{id}` | `MotorcycleController@update` | `auth` | `UpdateMotorcycleRequest` |
| `DELETE` | `/motorcycles/{id}` | `MotorcycleController@destroy` | `auth` | Cascade delete mapping |
| `GET` | `/motorcycles/{id}/parts` | `MotorcycleController@parts` | `auth` | `GetMotorcyclePartsRequest` |
| `POST` | `/motorcycles/{id}/parts` | `MotorcycleController@attachPart` | `auth` | `AttachMotorcyclePartRequest` |
| `PUT` | `/motorcycles/{id}/parts/{partId}` | `MotorcycleController@updatePart` | `auth` | `UpdateMotorcyclePartRequest` |
| `DELETE` | `/motorcycles/{id}/parts/{partId}` | `MotorcycleController@detachPart` | `auth` | Find & delete mapping |
| `GET` | `/motor-saya` | `MotorSayaController@index` | Publik | N/A |
| `GET` | `/api/motor-saya/{id}/parts` | `MotorSayaController@compatibleParts` | Publik | Grouped categories |

### 7.3 Rute Pesanan & Penjualan (Orders & POS)
| Method | URI | Handler | Middleware / Role | Form Request / Validasi |
|---|---|---|---|---|
| `POST` | `/api/customer/order` | `CustomerMenuController@storeOrder` | Throttle (120/min) | `StoreCustomerOrderRequest` |
| `GET` | `/api/customer/order/{id}/status` | `CustomerMenuController@orderStatus` | Throttle (240/min) | Customer Access Token |
| `GET` | `/orders` | `OrderController@indexWeb` | `role:owner\|cashier` | Status & search filter |
| `POST` | `/api/orders` | `OrderController@store` | `role:owner\|cashier` | `StoreOrderRequest` |
| `PATCH` | `/api/orders/{id}/status` | `OrderController@updateStatus` | `role:owner\|cashier` | `UpdateOrderStatusRequest` |
| `POST` | `/api/orders/{id}/cancel` | `OrderController@cancel` | `role:owner` | Pending status only |

### 7.4 Rute Pembayaran dan QRIS Manual
| Method | URI | Handler | Middleware / Role | Form Request / Validasi |
|---|---|---|---|---|
| `POST` | `/api/payments` | `PaymentController@store` | `role:owner\|cashier` | `StorePaymentRequest` |
| `POST` | `/api/orders/pos-sale` | `OrderController@storePosSale` | `role:owner\|cashier` | `StorePosSaleRequest` |
| `GET` | `/api/settings/qris-image` | `SettingController@getQrisImage` | `role:owner\|cashier` | N/A |
| `POST` / `DELETE` | `/api/settings/qris-image` | `SettingController@uploadQrisImage` / `deleteQrisImage` | `role:owner` | Gambar maks. 2 MB |

---

## 8. Mekanisme Keamanan, Konkurensi & Integritas Data

1. **Pessimistic Concurrency Locking (`lockForUpdate`)**:
   - Pada saat checkout pesanan (`OrderService::createOrder`), baris database produk di-lock secara eksklusif dalam database transaction hingga stok diverifikasi dan didekremen. Hal ini menjamin tidak terjadi *race condition* atau *overselling* saat beberapa customer/kasir membeli stok produk terakhir secara bersamaan.
2. **CSRF & Session Protection**:
   - Semua rute administratif dan operasional staf dilindungi oleh token CSRF.
   - Aksi pembayaran dan pengaturan QRIS dibatasi untuk staf yang terautentikasi sesuai perannya.
3. **Payload Sanitization & Rate Limiting (Throttling)**:
   - Endpoint order publik dibatasi maksimal 20 item per pesanan dan maksimal 200 unit per item.
   - Throttling ketat diterapkan pada seluruh rute publik untuk mencegah brute-force atau scraping bot.
4. **Soft Deletes & Audit Trails**:
   - Entitas bisnis vital (`Product`, `Category`, `Motorcycle`, `Order`) menggunakan soft deletes untuk mencegah hilangnya riwayat transaksi masa lalu.
   - Mutasi stok selalu menghasilkan baris log di `inventory_logs` dengan pencatatan user yang bertindak.
5. **Konfirmasi Tindakan Kritis (Password Confirmation)**:
   - Fitur reset transaksi mengharuskan owner memasukkan password saat ini untuk mencegah penghapusan data secara tidak sengaja.
