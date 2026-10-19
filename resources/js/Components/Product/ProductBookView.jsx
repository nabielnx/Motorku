import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

/**
 * ProductBookView — Price list buku kertas putih
 *
 * Persis seperti print-out price list / buku katalog bengkel:
 * - Kertas putih bersih, tinta hitam, tanpa hiasan
 * - 2 kolom berjejer (kiri & kanan), setiap kolom isi nama + stok + harga
 * - Garis tipis horizontal antar baris
 * - Garis tipis vertikal pemisah kolom
 * - Nomor halaman di bawah
 * - Navigasi sederhana ← Hal. X →
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
}) {
    const isAnimating = useRef(false);

    const changePage = useCallback((dir) => {
        if (isAnimating.current) return;
        if (dir === 'next' && currentPage >= totalPages) return;
        if (dir === 'prev' && currentPage <= 1) return;
        isAnimating.current = true;
        onPageChange(dir === 'next' ? currentPage + 1 : currentPage - 1);
        setTimeout(() => { isAnimating.current = false; }, 200);
    }, [currentPage, totalPages, onPageChange]);

    useEffect(() => {
        const onKey = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); changePage('next'); }
            if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); changePage('prev'); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [changePage]);

    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    // 2 kolom, masing-masing setengah dari perPage
    const half       = Math.ceil(perPage / 2);
    const leftItems  = items.slice(0, half);
    const rightItems = items.slice(half, perPage);
    const globalOffset = (currentPage - 1) * perPage;

    // Render 1 baris item
    const Row = ({ item, rowNo }) => {
        const isHabis  = Number(item.stock) <= 0;
        const isKritis = !isHabis && Number(item.stock) <= (item.minimum_stock ?? 3);
        const stockLabel = isHabis ? 'HABIS' : `${item.stock} pcs`;

        return (
            <div className="group flex items-start gap-1.5 border-b border-black py-1.5 px-1 hover:bg-gray-50 transition-colors">
                {/* Nomor urut */}
                <span className="shrink-0 w-5 text-right text-xs font-mono text-gray-500 pt-px">
                    {rowNo}.
                </span>

                {/* Nama produk */}
                <button
                    type="button"
                    onClick={() => onOpenEdit?.(item)}
                    className="min-w-0 flex-1 text-left cursor-pointer hover:underline"
                >
                    <span className="block text-xs font-bold text-black leading-tight line-clamp-2">
                        {item.name}
                    </span>
                    {item.category && (
                        <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">
                            {item.category}
                        </span>
                    )}
                </button>

                {/* Stok */}
                <span className={`shrink-0 text-[10px] font-semibold w-12 text-right leading-tight pt-px ${
                    isHabis  ? 'text-red-600 font-black' :
                    isKritis ? 'text-amber-600 font-bold' :
                               'text-gray-500'
                }`}>
                    {stockLabel}
                </span>

                {/* Harga — paling kanan, paling menonjol */}
                <span className="shrink-0 text-xs font-black text-black text-right leading-tight pt-px whitespace-nowrap">
                    {formatRp(item.price)}
                </span>

                {/* Aksi singkat — muncul hover */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 transition-opacity ml-0.5">
                    <button type="button" onClick={() => onOpenAdjust?.(item)}    className="p-0.5 text-gray-400 hover:text-black"><FiPlus   size={10}/></button>
                    <button type="button" onClick={() => onOpenEdit?.(item)}      className="p-0.5 text-gray-400 hover:text-black"><FiEdit2  size={10}/></button>
                    <button type="button" onClick={() => onDeleteProduct?.(item)} className="p-0.5 text-gray-400 hover:text-red-600"><FiTrash2 size={10}/></button>
                </div>
            </div>
        );
    };

    // Satu kolom halaman (kiri / kanan)
    const Column = ({ colItems, startIndex }) => (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {/* Header kolom */}
            <div className="flex items-center gap-1.5 border-b-2 border-black px-1 py-1 bg-gray-100">
                <span className="w-5" />
                <span className="flex-1 text-[10px] font-black uppercase tracking-wider text-black">Nama Produk</span>
                <span className="w-12 text-right text-[10px] font-black uppercase tracking-wider text-black">Stok</span>
                <span className="text-right text-[10px] font-black uppercase tracking-wider text-black">Harga Jual</span>
                <span className="w-5" />
            </div>

            {/* Baris item */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {colItems.map((item, idx) => (
                    <Row key={item.id} item={item} rowNo={startIndex + idx} />
                ))}
                {/* Baris kosong bergaris — seperti kertas buku bergarid */}
                {Array.from({ length: Math.max(0, half - colItems.length) }).map((_, i) => (
                    <div key={`blank-${i}`} className="border-b border-gray-300 py-1.5 px-1 h-[36px]" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-gray-200 dark:bg-gray-700 p-2 sm:p-4 gap-2 sm:gap-3">

            {/* ── BUKU — LEMBAR KERTAS PUTIH ── */}
            <div className="flex-1 min-h-0 bg-white border border-gray-400 shadow-[4px_4px_0_0_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">

                {/* Judul / Header buku */}
                <div className="shrink-0 border-b-2 border-black px-3 py-2 flex items-baseline justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-black">
                        Motorku · Daftar Harga Suku Cadang
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-600">
                        Hal. {currentPage} / {totalPages}
                    </span>
                </div>

                {/* Dua kolom konten */}
                <div className="flex-1 min-h-0 flex flex-row divide-x-2 divide-black overflow-hidden">
                    <Column colItems={leftItems}  startIndex={globalOffset + 1} />
                    <Column colItems={rightItems} startIndex={globalOffset + half + 1} />
                </div>

                {/* Footer: total produk + info */}
                <div className="shrink-0 border-t border-gray-300 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 italic">
                        Menampilkan {((currentPage - 1) * perPage) + 1}–{Math.min(currentPage * perPage, totalProducts)} dari {totalProducts} produk
                    </span>
                    <span className="text-[10px] text-gray-400 italic">
                        *Harga dapat berubah
                    </span>
                </div>
            </div>

            {/* ── NAVIGASI — BAWAH BUKU ── */}
            <div className="shrink-0 flex items-center justify-center gap-4">
                <button
                    type="button"
                    onClick={() => changePage('prev')}
                    disabled={currentPage <= 1}
                    className="p-1.5 disabled:opacity-30 disabled:cursor-not-allowed text-black hover:text-gray-600 transition cursor-pointer"
                    aria-label="Halaman sebelumnya"
                >
                    <FiChevronLeft size={22} strokeWidth={2.5} />
                </button>

                <span className="text-sm font-black text-black tracking-widest uppercase">
                    Hal {currentPage}
                </span>

                <button
                    type="button"
                    onClick={() => changePage('next')}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 disabled:opacity-30 disabled:cursor-not-allowed text-black hover:text-gray-600 transition cursor-pointer"
                    aria-label="Halaman berikutnya"
                >
                    <FiChevronRight size={22} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
