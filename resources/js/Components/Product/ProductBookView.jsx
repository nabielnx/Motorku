import React, { useRef, useCallback, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

/**
 * ProductBookView — Buku Catatan Harga Bengkel (Lined Notebook Style)
 *
 * Sesuai buku catatan fisik ayah:
 * - Kertas putih bersih (canvas putih), tulisan tinta hitam
 * - Garis horizontal bergaris buku tulis
 * - Mobile: 1 kolom penuh agar nama barang selalu terbaca jelas & tidak terhimpit
 * - Desktop: 2 kolom (kiri & kanan) dipisah garis tengah vertikal
 * - Header catatan: "Date: ...", judul daftar harga, nomor halaman
 * - Setiap baris: Nomor | Nama Barang | Stok | Harga
 */
export default function ProductBookView({
    items = [],
    totalProducts = 0,
    currentPage = 1,
    totalPages = 1,
    perPage = 24,
    onPageChange,
    onOpenAdjust,
    onOpenEdit,
    onDeleteProduct,
    selectedCategory = '',
    searchQuery = '',
}) {
    const busy = useRef(false);

    const goPage = useCallback((dir) => {
        if (busy.current) return;
        if (dir === 'next' && currentPage >= totalPages) return;
        if (dir === 'prev' && currentPage <= 1) return;
        busy.current = true;
        onPageChange(dir === 'next' ? currentPage + 1 : currentPage - 1);
        setTimeout(() => { busy.current = false; }, 180);
    }, [currentPage, totalPages, onPageChange]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                goPage('next');
            }
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                goPage('prev');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goPage]);

    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    // Tanggal hari ini format buku catatan (misal: 19/10/2026)
    const todayDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    // Judul buku catatan
    const bookTitle = searchQuery
        ? `CARI: "${searchQuery.toUpperCase()}"`
        : selectedCategory
            ? `HARGA ${selectedCategory.toUpperCase()}`
            : 'DAFTAR HARGA SUKU CADANG';

    // Desktop split (12 kiri, 12 kanan)
    const half = Math.ceil(perPage / 2);
    const leftItems = items.slice(0, half);
    const rightItems = items.slice(half, perPage);
    const globalOffset = (currentPage - 1) * perPage;

    /* Baris versi Mobile (1 kolom lega, nama barang lapang tidak terpotong) */
    const MobileRow = ({ item, no }) => {
        const habis = Number(item.stock) <= 0;
        const kritis = !habis && Number(item.stock) <= (item.minimum_stock ?? 3);

        return (
            <div className="flex items-center justify-between py-2 px-2 border-b border-slate-200 hover:bg-amber-50 transition-colors">
                {/* Nomor + Nama + Stok */}
                <div className="flex items-start gap-2 min-w-0 flex-1 pr-3">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5 text-right shrink-0 pt-0.5">
                        {no}.
                    </span>
                    <div className="min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={() => onOpenEdit?.(item)}
                            className="text-left cursor-pointer hover:underline block"
                        >
                            <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                {item.name}
                            </span>
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[11px] font-semibold ${
                                habis ? 'text-red-600 font-bold' :
                                kritis ? 'text-amber-600 font-bold' :
                                'text-slate-500'
                            }`}>
                                {habis ? 'Habis' : `Stok: ${item.stock} pcs`}
                            </span>
                            {item.category && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                    · {item.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Harga Jual */}
                <div className="shrink-0 text-right pl-1">
                    <span className="text-xs sm:text-sm font-black font-mono text-slate-900 whitespace-nowrap">
                        {formatRp(item.price)}
                    </span>
                </div>
            </div>
        );
    };

    /* Baris versi Desktop (2 kolom berdampingan) */
    const DesktopRow = ({ item, no }) => {
        const habis = Number(item.stock) <= 0;
        const kritis = !habis && Number(item.stock) <= (item.minimum_stock ?? 3);

        return (
            <div className="group flex items-center justify-between py-2 px-3 border-b border-slate-200 hover:bg-amber-50 transition-colors">
                {/* No + Nama */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-right shrink-0">
                        {no}.
                    </span>
                    <button
                        type="button"
                        onClick={() => onOpenEdit?.(item)}
                        className="text-left cursor-pointer hover:underline min-w-0 flex-1"
                    >
                        <span className="text-xs lg:text-sm font-bold text-slate-900 truncate block">
                            {item.name}
                        </span>
                    </button>
                </div>

                {/* Stok + Harga + Aksi */}
                <div className="shrink-0 flex items-center gap-3">
                    <span className={`text-xs font-semibold w-16 text-right ${
                        habis ? 'text-red-600 font-black' :
                        kritis ? 'text-amber-600 font-bold' :
                        'text-slate-500'
                    }`}>
                        {habis ? 'Habis' : `${item.stock} pcs`}
                    </span>

                    <span className="text-xs lg:text-sm font-black font-mono text-slate-900 w-28 text-right whitespace-nowrap">
                        {formatRp(item.price)}
                    </span>

                    {/* Quick actions hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity w-14 justify-end">
                        <button
                            type="button"
                            onClick={() => onOpenAdjust?.(item)}
                            title="Atur Stok"
                            className="p-1 text-slate-400 hover:text-slate-900 rounded"
                        >
                            <FiPlus size={11} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenEdit?.(item)}
                            title="Edit"
                            className="p-1 text-slate-400 hover:text-slate-900 rounded"
                        >
                            <FiEdit2 size={11} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteProduct?.(item)}
                            title="Hapus"
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                            <FiTrash2 size={11} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 p-2 sm:p-4 gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800">
            {/* ── BUKU CATATAN (CANVAS PUTIH TINTA HITAM) ── */}
            <div
                className="flex-1 min-h-0 bg-white border-2 border-slate-900 rounded-sm shadow-md flex flex-col overflow-hidden"
            >
                {/* ── HEADER CATATAN BUKU ── */}
                <div className="shrink-0 px-3 sm:px-5 pt-3 pb-2 border-b-2 border-slate-900 bg-white">
                    {/* Baris Atas: Date & Nomor Halaman */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 pb-1">
                        <span className="font-bold text-slate-800">
                            Date: <span className="underline decoration-slate-400 underline-offset-4">{todayDate}</span>
                        </span>
                        <span className="font-bold text-slate-800">
                            Hal. {currentPage} / {totalPages}
                        </span>
                    </div>

                    {/* Baris Judul: Tinta Hitam Bold Huruf Kapital */}
                    <div className="text-center sm:text-left pt-1">
                        <h2 className="text-sm sm:text-base font-black tracking-wider text-slate-900 font-heading uppercase">
                            {bookTitle}
                        </h2>
                    </div>
                </div>

                {/* ── ISI HALAMAN BUKU ── */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* 1. TAMPILAN MOBILE (1 Kolom Lega: Nama tidak terhimpit) */}
                    <div className="block md:hidden">
                        {/* Header Kolom Mobile */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-slate-900 bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-700">
                            <span>Nama Barang & Stok</span>
                            <span>Harga</span>
                        </div>

                        {/* Daftar Baris */}
                        {items.map((item, idx) => (
                            <MobileRow
                                key={item.id}
                                item={item}
                                no={globalOffset + idx + 1}
                            />
                        ))}

                        {/* Garis kosong pelengkap kertas bergaris */}
                        {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                            <div key={`m-blank-${i}`} className="border-b border-slate-200 h-10" />
                        ))}
                    </div>

                    {/* 2. TAMPILAN DESKTOP (2 Kolom Kiri & Kanan Berdampingan) */}
                    <div className="hidden md:flex min-h-full divide-x-2 divide-slate-900">
                        {/* Kolom Kiri */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-slate-900 bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-700">
                                <span className="pl-6">Nama Barang</span>
                                <div className="flex items-center gap-3 pr-14">
                                    <span className="w-16 text-right">Stok</span>
                                    <span className="w-28 text-right">Harga</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                {leftItems.map((item, idx) => (
                                    <DesktopRow
                                        key={item.id}
                                        item={item}
                                        no={globalOffset + idx + 1}
                                    />
                                ))}
                                {Array.from({ length: Math.max(0, half - leftItems.length) }).map((_, i) => (
                                    <div key={`d-left-blank-${i}`} className="border-b border-slate-200 h-9" />
                                ))}
                            </div>
                        </div>

                        {/* Kolom Kanan */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-slate-900 bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-700">
                                <span className="pl-6">Nama Barang</span>
                                <div className="flex items-center gap-3 pr-14">
                                    <span className="w-16 text-right">Stok</span>
                                    <span className="w-28 text-right">Harga</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                {rightItems.map((item, idx) => (
                                    <DesktopRow
                                        key={item.id}
                                        item={item}
                                        no={globalOffset + half + idx + 1}
                                    />
                                ))}
                                {Array.from({ length: Math.max(0, half - rightItems.length) }).map((_, i) => (
                                    <div key={`d-right-blank-${i}`} className="border-b border-slate-200 h-9" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER HALAMAN BUKU ── */}
                <div className="shrink-0 px-3 sm:px-5 py-2 border-t-2 border-slate-900 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-600">
                        {items.length > 0 ? (
                            <>
                                Menampilkan <strong className="text-slate-900">{globalOffset + 1}–{Math.min(globalOffset + items.length, totalProducts)}</strong> dari <strong className="text-slate-900">{totalProducts}</strong> barang
                            </>
                        ) : (
                            'Tidak ada barang'
                        )}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        Gunakan tombol panah keyboard ← →
                    </span>
                </div>
            </div>

            {/* ── NAVIGASI HALAMAN (BESAR & JELAS UNTUK ORANG TUA) ── */}
            <div className="shrink-0 flex items-center justify-center gap-3 sm:gap-6 py-1">
                <button
                    type="button"
                    onClick={() => goPage('prev')}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 bg-slate-900 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-md font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                    aria-label="Balik halaman sebelumnya"
                >
                    <FiChevronLeft size={18} strokeWidth={2.5} />
                    <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs sm:text-sm font-black text-slate-900 shadow-2xs">
                    <span>Hal.</span>
                    <span className="text-amber-600">{currentPage}</span>
                    <span className="text-slate-400">/</span>
                    <span>{totalPages}</span>
                </div>

                <button
                    type="button"
                    onClick={() => goPage('next')}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 bg-slate-900 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-md font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                    aria-label="Buka halaman selanjutnya"
                >
                    <span>Selanjutnya</span>
                    <FiChevronRight size={18} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
