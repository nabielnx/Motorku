# Skeleton loading admin

Reload browser dan navigasi Inertia memakai definisi di `resources/js/Loading/pageSkeletons.jsx`. Komponen di `resources/js/Components/Skeletons` menjadi sumber markup untuk keduanya. Skeleton pelanggan tetap mengikuti alur halaman publik yang sudah ada.

## Build dan development

- `npm run build` menghasilkan aset Vite, lalu merender semua variasi skeleton terdaftar menjadi HTML statis dan manifest di `public/build/skeletons`.
- `npm run dev` menghasilkan file yang sama saat server dimulai. Plugin Vite meregenerasi file ketika komponen skeleton, registry, atau pagination berubah.
- `npm run skeletons` dapat dipakai untuk regenerasi manual.

Tidak ada proses Node/SSR yang diperlukan pada server produksi. Workflow staging dan produksi sudah menjalankan `npm run build` dan menyertakan direktori `public`, sehingga artefak skeleton mengikuti release. Direktori hasil build tidak di-commit.

`LoadingSkeletonService` memuat artefak yang sesuai dengan nama komponen Inertia. Blade hanya menyediakan frame loading admin dan menyisipkan markup statis tersebut; detail halaman tidak disalin ulang ke Blade. Jika artefak belum tersedia, frame menampilkan placeholder netral tanpa menggagalkan halaman.

Mode Produk (`product_view_mode_v2`) dan POS (`pos_view_mode`) dipilih dari localStorage sebelum markup awal ditampilkan. Tema admin juga dipulihkan sebelum paint. Navigasi membaca pilihan yang sama melalui registry. Halaman Pesanan mempertahankan kontrak `noPadding` serta area scroll yang sama saat loading.

## Mengubah atau menambah skeleton

Ubah komponen React di direktori Skeletons. Untuk halaman baru, tambahkan definisi nama komponen Inertia, rute, padding, serta variasi bila ada ke registry. Build akan mengikutsertakannya untuk reload browser dan navigasi. Daftar fallback admin pada service hanya dipakai ketika manifest build hilang.

## Pemeriksaan tampilan

- Bandingkan konten `[data-page-skeleton]` pada respons HTML awal dengan skeleton yang muncul selama navigasi Inertia ke halaman yang sama. Format atribut `style` dapat berbeda antara HTML statis dan React, tetapi nilai CSS harus sama.
- Untuk Produk dan POS, ulangi dalam mode list, grid, dan buku. Reload harus memulihkan pilihan localStorage sebelum aplikasi React tampil.
- Periksa tema terang dan gelap, serta lebar layar 320, 390, 768, dan 1440 px. Placeholder teks harus mengikuti lebar kartu, termasuk pada halaman profil.
- Pastikan area utama tidak melebar ke samping, dok navigasi tetap di batas bawah viewport mobile, dan skeleton hilang setelah navigasi selesai. Tabel lebar boleh memiliki scroll horizontal di dalam kontainernya.
