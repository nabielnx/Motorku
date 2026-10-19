import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

/**
 * ProductBookView — Tampilan Buku Katalog Fisik Bengkel (Workshop Ledger)
 *
 * Tampilan persis seperti buku katalog/price list fisik yang biasa ada di bengkel:
 * - 2 halaman terbuka (spread) di desktop, 1 halaman di mobile
 * - Cover charcoal keras dengan sudut kuning (Workshop Ledger branding)
 * - Punggung buku (spine) di tengah dengan garis jahitan spiral
 * - Baris seperti buku: No. | Nama Part | Stok | Harga
 * - Nomor halaman resmi di footer setiap lembar
 * - Navigasi besar & ramah orang tua (tombol Balik Halaman)
 * - Keyboard ArrowLeft / ArrowRight
 */
export default function ProductBookView({
    items = [],
    totalProducts = 0,
    currentPage = 1,
    totalPages = 1,
    perPage = 12,
    onPageChange,
    onOpenAdjust,
    onOpenEdit,
    onDeleteProduct,
}) {
    const [fontSize, setFontSize] = useState(() => {
        try { return localStorage.getItem('motorku_book_font_size') || 'normal'; } catch { return 'normal'; }
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [flipping, setFlipping] = useState(null); // 'next' | 'prev' | null
    const isAnimating = useRef(false);

    const changePage = useCallback((dir) => {
        if (isAnimating.current) return;
        if (dir === 'next' && currentPage >= totalPages) return;
        if (dir === 'prev' && currentPage <= 1) return;
        isAnimating.current = true;
        setFlipping(dir);
        setTimeout(() => {
            onPageChange(dir === 'next' ? currentPage + 1 : currentPage - 1);
            setFlipping(null);
            isAnimating.current = false;
        }, 280);
    }, [currentPage, totalPages, onPageChange]);

    useEffect(() => {
        const onKey = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); changePage('next'); }
            if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); changePage('prev'); }
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [changePage, isFullscreen]);

    const saveFontSize = (s) => {
        setFontSize(s);
        try { localStorage.setItem('motorku_book_font_size', s); } catch {}
    };

    // Split items into 2 pages (6 kiri, 6 kanan di desktop)
    const half = Math.ceil(perPage / 2);
    const leftItems  = items.slice(0, half);
    const rightItems = items.slice(half, perPage);

    // Book page numbers (spread = 2 halaman per lembar)
    const leftPageNo  = (currentPage - 1) * 2 + 1;
    const rightPageNo = leftPageNo + 1;

    // Row number global offset
    const globalOffset = (currentPage - 1) * perPage;

    // Font size classes
    const fs = {
        normal: { name: 'text-xs sm:text-sm',    price: 'text-sm sm:text-base font-black', stock: 'text-xs',    row: 'py-2.5', num: 'text-xs' },
        large:  { name: 'text-sm sm:text-base',  price: 'text-base sm:text-lg font-black', stock: 'text-xs sm:text-sm', row: 'py-3',   num: 'text-xs sm:text-sm' },
        xlarge: { name: 'text-base sm:text-lg',  price: 'text-lg sm:text-xl font-black',  stock: 'text-sm',    row: 'py-4',   num: 'text-sm' },
    }[fontSize] || { name: 'text-xs sm:text-sm', price: 'text-sm sm:text-base font-black', stock: 'text-xs', row: 'py-2.5', num: 'text-xs' };

    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    // Render 1 row buku
    const BookRow = ({ item, rowNo }) => {
        const isHabis   = Number(item.stock) <= 0;
        const isKritis  = !isHabis && Number(item.stock) <= (item.minimum_stock ?? 3);

        return (
            <div className={`group flex items-center gap-2 sm:gap-3 border-b border-[#c8ccc4] dark:border-[#2d3931] px-2 sm:px-4 ${fs.row} hover:bg-[#fffde8] dark:hover:bg-[#1e2b26] transition-colors`}>
                {/* No. */}
                <span className={`shrink-0 w-5 text-center font-mono font-semibold text-[#8a9088] ${fs.num}`}>
                    {String(rowNo).padStart(2, '0')}
                </span>

                {/* Nama */}
                <button
                    type="button"
                    onClick={() => onOpenEdit?.(item)}
                    className={`min-w-0 flex-1 text-left font-semibold text-[#19231f] dark:text-[#f4f5ed] leading-tight hover:underline cursor-pointer ${fs.name}`}
                    title={item.name}
                >
                    <span className="line-clamp-1">{item.name}</span>
                    {item.category && (
                        <span className="block text-[10px] font-normal text-[#6b7872] dark:text-[#8a9a90] mt-0.5 line-clamp-1">
                            {item.category}
                        </span>
                    )}
                </button>

                {/* Stok */}
                <div className="shrink-0 text-right min-w-[40px]">
                    {isHabis ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-[#EF4444] text-white">HABIS</span>
                    ) : isKritis ? (
                        <span className={`font-bold text-amber-700 dark:text-amber-400 ${fs.stock}`}>{item.stock}<span className="text-[10px] font-normal ml-0.5">pcs</span></span>
                    ) : (
                        <span className={`font-semibold text-[#3a4e45] dark:text-[#a0b4ac] ${fs.stock}`}>{item.stock}<span className="text-[10px] font-normal ml-0.5">pcs</span></span>
                    )}
                </div>

                {/* Harga — paling dominan */}
                <div className="shrink-0 text-right min-w-[80px] sm:min-w-[100px]">
                    <span className={`font-mono tracking-tight text-[#19231f] dark:text-[#FFDD00] ${fs.price}`}>
                        {formatRp(item.price)}
                    </span>
                </div>

                {/* Quick Actions — muncul saat hover */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button type="button" onClick={() => onOpenAdjust?.(item)}     title="Stok" className="p-1 text-[#58645e] hover:text-black dark:hover:text-white rounded"><FiPlus   size={11}/></button>
                    <button type="button" onClick={() => onOpenEdit?.(item)}       title="Edit" className="p-1 text-[#58645e] hover:text-black dark:hover:text-white rounded"><FiEdit2  size={11}/></button>
                    <button type="button" onClick={() => onDeleteProduct?.(item)}  title="Hapus" className="p-1 text-red-500 hover:text-red-700 rounded"><FiTrash2 size={11}/></button>
                </div>
            </div>
        );
    };

    // Render satu halaman buku (kiri atau kanan)
    const BookPage = ({ pageItems, pageNo, startIndex, side }) => (
        <div className={`flex flex-col bg-[#fdfdf8] dark:bg-[#161f1b] h-full overflow-hidden ${side === 'left' ? 'border-r border-[#c0c4ba] dark:border-[#2a3530]' : ''}`}>
            {/* Page Header — garis judul tebal di bagian atas seperti buku bengkel */}
            <div className="shrink-0 px-2 sm:px-4 py-2 border-b-2 border-[#19231f] dark:border-[#f4f5ed] flex items-baseline justify-between">
                <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#58645e] dark:text-[#8a9a90]">
                    {side === 'left' ? 'Motorku · Katalog' : 'Daftar Harga Suku Cadang'}
                </span>
                <span className="font-heading font-black text-[10px] sm:text-xs uppercase tracking-tight text-[#19231f] dark:text-[#f4f5ed]">
                    Hal. {pageNo}
                </span>
            </div>

            {/* Column Header — persis seperti buku pricelist fisik */}
            <div className="shrink-0 grid grid-cols-[20px_1fr_52px_auto] sm:grid-cols-[22px_1fr_64px_auto] gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 bg-[#19231f] text-[#FFDD00] text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                <span className="text-center">No</span>
                <span>Nama Part</span>
                <span className="text-right">Stok</span>
                <span className="text-right pr-1 sm:pr-3">Harga Jual</span>
            </div>

            {/* Baris Data */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {pageItems.map((item, idx) => (
                    <BookRow key={item.id} item={item} rowNo={startIndex + idx} />
                ))}
                {/* Baris kosong bergaris (ruled lines) — ciri khas buku catatan/ledger */}
                {Array.from({ length: Math.max(0, half - pageItems.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className={`flex items-center border-b border-[#d8dcd4] dark:border-[#262f2b] px-2 sm:px-4 text-[#c8ccc4] dark:text-[#353d39] text-[10px] italic select-none ${fs.row}`}>
                        —
                    </div>
                ))}
            </div>

            {/* Page Footer */}
            <div className="shrink-0 px-2 sm:px-4 py-1.5 border-t border-[#c8ccc4] dark:border-[#2a3530] flex items-center justify-between bg-[#f7f7f0] dark:bg-[#121a16]">
                <span className="text-[9px] font-semibold text-[#8a9088] dark:text-[#6a7870] italic">
                    {side === 'left' ? '* Harga dapat berubah sewaktu-waktu' : '* Cek fisik barang sebelum transaksi'}
                </span>
                <span className="font-mono text-[9px] font-bold text-[#58645e] dark:text-[#8a9a90]">— {pageNo} —</span>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col flex-1 min-h-0 bg-[#e8e8e2] dark:bg-[#0d1412] ${
            isFullscreen ? 'fixed inset-0 z-50 p-3 sm:p-8 overflow-hidden' : 'relative p-2 sm:p-4'
        }`}>

            {/* ── ASSISTIVE TOOLBAR: Ukuran Font & Fullscreen ── */}
            <div className="shrink-0 mb-2 sm:mb-3 flex items-center justify-between gap-2 flex-wrap">
                {/* Kiri: Info halaman */}
                <div className="text-[10px] sm:text-xs font-semibold text-[#58645e] dark:text-[#8a9a90]">
                    Bentangan Hal. <strong className="text-[#19231f] dark:text-[#FFDD00]">{leftPageNo} & {rightPageNo}</strong> dari {totalPages * 2} &nbsp;·&nbsp; {totalProducts} produk total
                </div>

                {/* Kanan: Font controls + Fullscreen */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#8a9088] font-semibold hidden sm:inline">Huruf:</span>
                    <div className="flex items-center bg-white dark:bg-[#192225] border border-[#c8ccc4] dark:border-[#2d3931] rounded-lg p-0.5" role="group" aria-label="Ukuran huruf">
                        {[['normal', 'A', 'text-xs font-bold'], ['large', 'A+', 'text-sm font-black'], ['xlarge', 'A++', 'text-base font-black']].map(([val, label, cls]) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => saveFontSize(val)}
                                className={`px-2 py-1 rounded-md transition cursor-pointer ${cls} ${
                                    fontSize === val
                                        ? 'bg-[#19231f] text-[#FFDD00] shadow-2xs'
                                        : 'text-[#58645e] hover:text-[#19231f] dark:hover:text-white'
                                }`}
                            >{label}</button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsFullscreen(v => !v)}
                        className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isFullscreen
                                ? 'bg-[#FFDD00] text-[#19231f] border-[#FFDD00]'
                                : 'bg-white dark:bg-[#192225] text-[#58645e] dark:text-[#8a9a90] border-[#c8ccc4] dark:border-[#2d3931] hover:bg-[#f3f3ed]'
                        }`}
                        title={isFullscreen ? 'Keluar Layar Penuh (ESC)' : 'Buka Layar Penuh'}
                    >
                        {isFullscreen ? <FiMinimize2 size={14}/> : <FiMaximize2 size={14}/>}
                        <span className="hidden lg:inline">{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
                    </button>
                </div>
            </div>

            {/* ── THE BOOK ── */}
            <div className="flex-1 min-h-0 flex flex-col">
                {/*
                    Hardcover frame: charcoal tebal, sudut kuning brass
                    Persis seperti buku tebal terbuka di atas meja bengkel
                */}
                <div
                    className={`flex-1 min-h-0 relative flex flex-col bg-[#17221e] rounded-xl sm:rounded-2xl shadow-2xl transition-transform duration-[280ms] ease-in-out ${
                        flipping === 'next' ? '-translate-x-2 rotate-[-0.5deg]' :
                        flipping === 'prev' ? 'translate-x-2 rotate-[0.5deg]' : ''
                    }`}
                    style={{ boxShadow: '6px 8px 32px 0 rgba(0,0,0,0.45), -2px -2px 0 0 #FFDD00 inset, 2px 2px 0 0 #FFDD00 inset' }}
                >
                    {/* Brass corner decorators */}
                    <div className="absolute top-1 left-1   w-3.5 h-3.5 border-t-2 border-l-2 border-[#FFDD00] rounded-tl-lg pointer-events-none z-20" />
                    <div className="absolute top-1 right-1  w-3.5 h-3.5 border-t-2 border-r-2 border-[#FFDD00] rounded-tr-lg pointer-events-none z-20" />
                    <div className="absolute bottom-1 left-1  w-3.5 h-3.5 border-b-2 border-l-2 border-[#FFDD00] rounded-bl-lg pointer-events-none z-20" />
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FFDD00] rounded-br-lg pointer-events-none z-20" />

                    {/* Inner paper spread */}
                    <div className="flex-1 min-h-0 m-2 sm:m-3 rounded-lg sm:rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative shadow-inner">

                        {/* HALAMAN KIRI */}
                        <BookPage
                            pageItems={leftItems}
                            pageNo={leftPageNo}
                            startIndex={globalOffset + 1}
                            side="left"
                        />

                        {/* SPINE — PUNGGUNG BUKU */}
                        <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 flex-col items-center justify-around py-6 z-10 pointer-events-none bg-[#e0e0d8] dark:bg-[#1e2924]" style={{ boxShadow: '-1px 0 4px rgba(0,0,0,0.10), 1px 0 4px rgba(0,0,0,0.10)' }}>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="w-3 h-[3px] rounded-full bg-[#19231f] dark:bg-[#FFDD00] opacity-60" />
                            ))}
                        </div>

                        {/* HALAMAN KANAN */}
                        <BookPage
                            pageItems={rightItems}
                            pageNo={rightPageNo}
                            startIndex={globalOffset + half + 1}
                            side="right"
                        />
                    </div>
                </div>

                {/* ── KONTROL NAVIGASI BESAR (RAMAH ORANG TUA) ── */}
                <div className="shrink-0 mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-3">
                    {/* Tombol Sebelumnya */}
                    <button
                        type="button"
                        onClick={() => changePage('prev')}
                        disabled={currentPage <= 1}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#19231f] text-[#FFDD00] hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-black text-sm sm:text-base transition shadow-lg cursor-pointer"
                        aria-label="Balik halaman sebelumnya"
                    >
                        <FiChevronLeft size={20} />
                        <span>Sebelumnya</span>
                    </button>

                    {/* Status Tengah */}
                    <div className="flex flex-col items-center text-center gap-0.5">
                        <span className="font-heading font-black text-sm sm:text-base text-[#19231f] dark:text-[#f4f5ed]">
                            Lembar <span className="text-[#19231f] dark:text-[#FFDD00]">{currentPage}</span> / {totalPages}
                        </span>
                        <span className="text-[10px] text-[#8a9088] dark:text-[#6a7870] font-mono hidden sm:block">
                            ← → Tombol Keyboard
                        </span>
                    </div>

                    {/* Tombol Selanjutnya */}
                    <button
                        type="button"
                        onClick={() => changePage('next')}
                        disabled={currentPage >= totalPages}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FFDD00] text-[#19231f] hover:bg-[#ebd000] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-black text-sm sm:text-base transition shadow-lg cursor-pointer"
                        aria-label="Buka halaman selanjutnya"
                    >
                        <span>Selanjutnya</span>
                        <FiChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
