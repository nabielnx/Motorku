# Skeleton loading admin

Reload browser dan navigasi Inertia memakai definisi di `resources/js/Loading/pageSkeletons.jsx`. Komponen di `resources/js/Components/Skeletons` menjadi sumber markup untuk keduanya. Skeleton pelanggan tetap mengikuti alur halaman publik yang sudah ada.

## Build dan development

- `npm run build` menghasilkan aset Vite, lalu merender 16 variasi skeleton menjadi HTML statis dan manifest di `public/build/skeletons`.
- `npm run dev` menghasilkan file yang sama saat server dimulai. Plugin Vite meregenerasi file ketika komponen skeleton, registry, atau pagination berubah.
- `npm run skeletons` dapat dipakai untuk regenerasi manual.

Tidak ada proses Node/SSR yang diperlukan pada server produksi. Workflow staging dan produksi sudah menjalankan `npm run build` dan menyertakan direktori `public`, sehingga artefak skeleton mengikuti release. Direktori hasil build tidak di-commit.

`LoadingSkeletonService` memuat artefak yang sesuai dengan nama komponen Inertia. Blade hanya menyediakan frame loading admin dan menyisipkan markup statis tersebut; detail halaman tidak disalin ulang ke Blade. Jika artefak belum tersedia, frame menampilkan placeholder netral tanpa menggagalkan halaman.

Mode Produk (`product_view_mode_v2`) dan POS (`pos_view_mode`) dipilih dari localStorage sebelum markup awal ditampilkan. Tema admin juga dipulihkan sebelum paint. Navigasi membaca pilihan yang sama melalui registry. Halaman Pesanan mempertahankan kontrak `noPadding` serta area scroll yang sama saat loading.

## Mengubah atau menambah skeleton

Ubah komponen React di direktori Skeletons. Untuk halaman baru, tambahkan definisi nama komponen Inertia, rute, padding, serta variasi bila ada ke registry. Build akan mengikutsertakannya untuk reload browser dan navigasi. Daftar fallback admin pada service hanya dipakai ketika manifest build hilang.
