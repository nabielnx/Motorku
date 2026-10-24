import DeleteButton from '@/Components/Admin/DeleteButton';
import Pagination from '@/Components/Pagination';
import React, { useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatProductBookName } from '@/Utils/productBookFormatter';

/**
 * ProductBookView — Buku Catatan Harga Bengkel (Lined Notebook Style)
 *
 * Persis seperti buku catatan fisik ayah:
 * - Kertas putih bersih (canvas putih), tulisan tinta hitam
 * - Garis-garis tipis bergaris buku tulis (stroke tipis 1px, bukan tebal)
 * - Mobile: 1 kolom penuh agar nama barang selalu terbaca jelas & tidak terhimpit
 * - Desktop: 2 kolom (kiri & kanan) dipisah garis tipis tengah vertikal
 * - Tombol navigasi halaman solid, jelas, dan kontras tinggi
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
    // Bug fix: jika currentPage melampaui totalPages (misalnya saat ganti kategori),
    // langsung reset ke halaman 1 agar tidak menampilkan halaman kosong.
    useEffect(() => {
        if (currentPage > totalPages && totalPages >= 1) {
            onPageChange(1);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, onPageChange]);

    // Tanggal hari ini format buku catatan (misal: 19/10/2026)
    const todayDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    // Judul buku catatan (hanya tampil jika ada kategori spesifik / pencarian, tidak menampilkan "HARGA ALL")
    const hasCategory = selectedCategory && selectedCategory.toLowerCase() !== 'all';
    const bookTitle = searchQuery
        ? `CARI: "${searchQuery.toUpperCase()}"`
        : hasCategory
            ? `HARGA ${selectedCategory.toUpperCase()}`
            : '';

    // Desktop split (12 kiri, 12 kanan)
    const half = Math.ceil(perPage / 2);
    const leftItems = items.slice(0, half);
    const rightItems = items.slice(half, perPage);
    const globalOffset = (currentPage - 1) * perPage;

    /* Baris 1 Garis Lurus (Sesuai Garis Buku Tulis Tipis) */
    const BookRow = ({ item, no, isDesktop = false }) => {
        const habis = Number(item.stock) <= 0;
        const kritis = !habis && Number(item.stock) <= (item.minimum_stock ?? 3);
        const displayName = formatProductBookName(item);

        return (
            <div className={`group flex items-center justify-between border-b border-slate-200 hover:bg-amber-50 transition-colors ${
                isDesktop ? 'py-2 px-3' : 'py-2 px-2'
            }`}>
                {/* Kiri: Nomor + Nama Barang Simple & Jelas */}
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5 sm:w-6 text-right shrink-0">
                        {no}.
                    </span>
                    <button
                        type="button"
                        onClick={() => onOpenEdit?.(item)}
                        className="text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00] focus-visible:ring-offset-2 min-w-0 flex-1 block"
                        title={item.name}
                    >
                        <span className="block whitespace-normal break-words text-xs sm:text-sm font-bold leading-snug text-slate-900">
                            {displayName}
                        </span>
                    </button>
                </div>

                {/* Kanan: Stok + Harga Jual (+ Aksi di Desktop) */}
                <div className="shrink-0 flex items-center gap-2 sm:gap-3 text-right">
                    {/* Stok */}
                    <span className={`text-[11px] sm:text-xs font-semibold ${
                        habis ? 'text-red-600 font-bold' :
                        kritis ? 'text-amber-600 font-bold' :
                        'text-slate-500'
                    }`}>
                        {habis ? 'Habis' : `${item.stock} pcs`}
                    </span>

                    {/* Harga */}
                    <span className="text-xs sm:text-sm font-black font-mono text-slate-900 whitespace-nowrap min-w-[75px] sm:min-w-[85px] text-right">
                        <span className="text-[10px] sm:text-xs font-normal text-slate-500 mr-0.5">Rp</span>
                        {Number(item.price).toLocaleString('id-ID')}
                    </span>

                    {/* Quick action buttons (desktop only hover) */}
                    {isDesktop && (
                        <div className="hidden lg:flex items-center gap-0.5 w-auto justify-end">
                            <button
                                type="button"
                                onClick={() => onOpenAdjust?.(item)}
                                title="Atur Stok"
                                aria-label={`Atur stok ${item.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00]"
                            >
                                <FiPlus size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenEdit?.(item)}
                                title="Edit"
                                aria-label={`Edit ${item.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00]"
                            >
                                <FiEdit2 size={14} />
                            </button>
                            <DeleteButton
                                type="button"
                                onClick={() => onDeleteProduct?.(item)}
                                title="Hapus"
                                aria-label={`Hapus ${item.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00]"
                            >
                                <FiTrash2 size={14} />
                            </DeleteButton>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 p-2 sm:p-4 gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800">
            {/* ── BUKU CATATAN (CANVAS PUTIH TINTA HITAM - STROKE TIPIS 1PX) ── */}
            <div
                className="flex-1 min-h-0 bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col overflow-hidden"
            >
                {/* ── HEADER CATATAN BUKU ── */}
                <div className="shrink-0 px-3 sm:px-5 py-2 border-b border-slate-300 bg-white">
                    {/* Satu baris: Date | Judul (opsional, kecil) | Hal. X/Y */}
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                        <span className="font-bold text-slate-800 shrink-0">
                            Date: <span className="underline decoration-slate-400 underline-offset-4">{todayDate}</span>
                        </span>

                        {/* Judul kategori/pencarian — ditengah, kecil, terpotong jika terlalu panjang */}
                        {bookTitle && (
                            <span className="flex-1 text-center text-[10px] font-bold tracking-wider text-slate-600 uppercase truncate px-1">
                                {bookTitle}
                            </span>
                        )}

                        <span className="font-bold text-slate-800 shrink-0">
                            Hal. {currentPage} / {totalPages}
                        </span>
                    </div>
                </div>

                {/* ── ISI HALAMAN BUKU (GARIS-GARIS KERTAS) ── */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* 1. TAMPILAN MOBILE (1 Kolom Lega: Nama Barang Jelas & Ringkas) */}
                    <div className="block md:hidden">
                        {/* Header Kolom Mobile */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-300 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            <span className="pl-6">Nama Barang</span>
                            <div className="flex items-center gap-3 pr-1">
                                <span>Stok</span>
                                <span className="w-16 text-right">Harga</span>
                            </div>
                        </div>

                        {/* Baris Mobile */}
                        {items.map((item, idx) => (
                            <BookRow
                                key={item.id}
                                item={item}
                                no={globalOffset + idx + 1}
                                isDesktop={false}
                            />
                        ))}

                        {/* Garis kosong pelengkap kertas bergaris */}
                        {Array.from({ length: Math.max(0, 12 - items.length) }).map((_, i) => (
                            <div key={`m-blank-${i}`} className="border-b border-slate-200 h-9" />
                        ))}
                    </div>

                    {/* 2. TAMPILAN DESKTOP (2 Kolom Kiri & Kanan Berdampingan) */}
                    <div className="hidden md:flex min-h-full divide-x divide-slate-300">
                        {/* Kolom Kiri */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <span className="pl-7">Nama Barang</span>
                                <div className="flex items-center gap-3 pr-2 lg:pr-14">
                                    <span className="w-14 text-right">Stok</span>
                                    <span className="w-20 text-right">Harga</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                {leftItems.map((item, idx) => (
                                    <BookRow
                                        key={item.id}
                                        item={item}
                                        no={globalOffset + idx + 1}
                                        isDesktop={true}
                                    />
                                ))}
                                {Array.from({ length: Math.max(0, half - leftItems.length) }).map((_, i) => (
                                    <div key={`d-left-blank-${i}`} className="border-b border-slate-200 h-9" />
                                ))}
                            </div>
                        </div>

                        {/* Kolom Kanan */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <span className="pl-7">Nama Barang</span>
                                <div className="flex items-center gap-3 pr-2 lg:pr-14">
                                    <span className="w-14 text-right">Stok</span>
                                    <span className="w-20 text-right">Harga</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                {rightItems.map((item, idx) => (
                                    <BookRow
                                        key={item.id}
                                        item={item}
                                        no={globalOffset + half + idx + 1}
                                        isDesktop={true}
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
                <div className="shrink-0 px-3 sm:px-5 py-2 border-t border-slate-300 bg-slate-50 flex items-center justify-between">
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

            {/* Navigasi halaman mengikuti komponen bersama. */}
            <div className="flex shrink-0 justify-center py-1">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} label="Halaman buku produk" />
            </div>
        </div>
    );
}
