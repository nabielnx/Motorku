import React, { useRef, useCallback, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

/**
 * ProductBookView — Catatan Buku Harga Bengkel
 *
 * Persis seperti buku catatan harga ayah:
 * - Kertas putih dengan garis-garis horizontal tipis
 * - Dua kolom (kiri & kanan) dipisah garis vertikal
 * - Setiap baris: Nama Barang ........... Harga
 * - Stok kecil di bawah nama
 * - Tidak ada kotak, border, atau warna — cuma garis
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
    const busy = useRef(false);

    const goPage = useCallback((dir) => {
        if (busy.current) return;
        if (dir === 'next' && currentPage >= totalPages) return;
        if (dir === 'prev' && currentPage <= 1) return;
        busy.current = true;
        onPageChange(dir === 'next' ? currentPage + 1 : currentPage - 1);
        setTimeout(() => { busy.current = false; }, 150);
    }, [currentPage, totalPages, onPageChange]);

    useEffect(() => {
        const h = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goPage('next'); }
            if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); goPage('prev'); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [goPage]);

    const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    const half         = Math.ceil(perPage / 2);
    const leftItems    = items.slice(0, half);
    const rightItems   = items.slice(half, perPage);
    const globalOffset = (currentPage - 1) * perPage;

    /* Satu baris catatan — grid: no | nama | stok | harga | aksi */
    const Row = ({ item, no }) => {
        const habis  = Number(item.stock) <= 0;
        const kritis = !habis && Number(item.stock) <= (item.minimum_stock ?? 3);

        return (
            <div
                className="group grid items-center border-b border-gray-200 hover:bg-yellow-50 transition-colors"
                style={{ gridTemplateColumns: '22px 1fr 44px auto', minHeight: 34 }}
            >
                {/* Nomor */}
                <span className="text-right text-[11px] text-gray-400 font-mono pr-1.5 leading-none">
                    {no}.
                </span>

                {/* Nama */}
                <button
                    type="button"
                    onClick={() => onOpenEdit?.(item)}
                    className="text-left py-1.5 pr-1 cursor-pointer hover:underline overflow-hidden"
                >
                    <span className="block text-[13px] font-semibold text-gray-900 leading-snug" style={{ wordBreak: 'break-word' }}>
                        {item.name}
                    </span>
                    <span className={`block text-[10px] leading-none mt-0.5 ${
                        habis  ? 'text-red-500 font-bold' :
                        kritis ? 'text-amber-600' :
                                 'text-gray-400'
                    }`}>
                        {habis ? 'Habis' : `${item.stock} pcs`}
                    </span>
                </button>

                {/* Stok kecil — sudah di dalam nama di atas, kolom ini kosong / spare */}
                <span />

                {/* Harga */}
                <div className="text-right py-1.5 pl-1 flex items-center gap-0.5">
                    <span className="text-[13px] font-bold text-gray-900 font-mono whitespace-nowrap">
                        {rp(item.price)}
                    </span>
                    {/* Aksi hover */}
                    <div className="flex items-center gap-px pl-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button type="button" onClick={() => onOpenAdjust?.(item)}    title="Stok"  className="p-0.5 text-gray-300 hover:text-gray-600"><FiPlus   size={9}/></button>
                        <button type="button" onClick={() => onOpenEdit?.(item)}      title="Edit"  className="p-0.5 text-gray-300 hover:text-gray-600"><FiEdit2  size={9}/></button>
                        <button type="button" onClick={() => onDeleteProduct?.(item)} title="Hapus" className="p-0.5 text-gray-300 hover:text-red-500"><FiTrash2 size={9}/></button>
                    </div>
                </div>
            </div>
        );
    };

    /* Satu kolom (kiri / kanan) */
    const Col = ({ colItems, startNo }) => (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Sub-header kolom — grid sesuai Row */}
            <div
                className="grid items-center border-b-2 border-gray-800 pb-1"
                style={{ gridTemplateColumns: '22px 1fr 44px auto' }}
            >
                <span />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Nama Barang</span>
                <span />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 text-right">Harga</span>
            </div>
            {/* Baris */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {colItems.map((item, i) => (
                    <Row key={item.id} item={item} no={startNo + i} />
                ))}
                {/* Baris kosong bergaris */}
                {Array.from({ length: Math.max(0, half - colItems.length) }).map((_, i) => (
                    <div key={`e${i}`} className="border-b border-gray-200" style={{ minHeight: 34 }} />
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 p-3 sm:p-5 gap-2 sm:gap-3 bg-gray-100 dark:bg-gray-800">

            {/* Kertas putih */}
            <div className="flex-1 min-h-0 bg-white flex flex-col overflow-hidden"
                 style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>

                {/* Kepala halaman — persis seperti nulis di buku */}
                <div className="shrink-0 px-4 pt-3 pb-1 border-b-2 border-gray-800 flex items-baseline justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">
                        Daftar Harga Suku Cadang — Motorku
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-gray-500 whitespace-nowrap">
                        {currentPage}/{totalPages}
                    </span>
                </div>

                {/* Dua kolom dipisah garis vertikal */}
                <div className="flex-1 min-h-0 flex overflow-hidden px-1">
                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-2 sm:px-3 py-1">
                        <Col colItems={leftItems}  startNo={globalOffset + 1} />
                    </div>

                    {/* Garis pembatas vertikal */}
                    <div className="shrink-0 w-px bg-gray-300 my-2" />

                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-2 sm:px-3 py-1">
                        <Col colItems={rightItems} startNo={globalOffset + half + 1} />
                    </div>
                </div>

                {/* Kaki halaman */}
                <div className="shrink-0 px-4 py-1.5 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 italic">
                        {((currentPage-1)*perPage)+1}–{Math.min(currentPage*perPage, totalProducts)} dari {totalProducts} barang
                    </span>
                    <span className="text-[10px] text-gray-300 italic">*harga dapat berubah</span>
                </div>
            </div>

            {/* Navigasi bawah — minimal */}
            <div className="shrink-0 flex items-center justify-center gap-5">
                <button
                    type="button"
                    onClick={() => goPage('prev')}
                    disabled={currentPage <= 1}
                    className="disabled:opacity-25 disabled:cursor-not-allowed text-gray-600 hover:text-black transition cursor-pointer"
                    aria-label="Sebelumnya"
                >
                    <FiChevronLeft size={20} strokeWidth={2.5} />
                </button>

                <span className="text-sm font-black text-gray-800 tracking-widest">
                    Hal. {currentPage}
                </span>

                <button
                    type="button"
                    onClick={() => goPage('next')}
                    disabled={currentPage >= totalPages}
                    className="disabled:opacity-25 disabled:cursor-not-allowed text-gray-600 hover:text-black transition cursor-pointer"
                    aria-label="Selanjutnya"
                >
                    <FiChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
