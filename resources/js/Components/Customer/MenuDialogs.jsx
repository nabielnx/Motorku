import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiCheck, FiMinus, FiPlus, FiShoppingCart, FiStar, FiTrash2, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { ProductPhoto } from './Storefront';

export default function MenuDialogs({
    addToCart,
    cart,
    cartMessage,
    checkingCart,
    clearCart,
    detailQty,
    formatRp,
    goToPayment,
    referencesEnabled,
    removeFromCart,
    selectedDetailProduct,
    setDetailQty,
    setQtyDirect,
    setSelectedDetailProduct,
    setShowCart,
    showCart,
    showTotalSold,
    subtotal,
    tax,
    taxEnabled,
    taxRate,
    total,
    totalQty,
    updateQty,
}) {
    // Discover the app root before opening, including when Headless UI is cached.
    // Its modal background must remain inert after closing and reopening dialogs.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <>
            <Dialog open={mounted && showCart} onClose={() => setShowCart(false)} className="customer-storefront relative z-50">
                <div className="fixed inset-0" aria-hidden="true" />
                <div className="fixed inset-0 flex justify-end">
                    <DialogPanel className="flex h-full w-full max-w-md flex-col bg-white text-slate-900 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 sm:px-6">
                            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">Keranjang <span className="ml-1 text-sm font-normal text-slate-500">({totalQty})</span></DialogTitle>
                            <div className="flex items-center gap-2">
                                {cart.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearCart}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Kosongkan keranjang"
                                        aria-label="Kosongkan keranjang"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                )}
                                <button type="button" onClick={() => setShowCart(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" aria-label="Tutup keranjang"><FiX size={17} /></button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
                            {cartMessage && <p role="status" className="mt-3 rounded-lg border border-[#dedfd7] bg-[#f3f3ed] p-3 text-xs text-[#19231f]">{cartMessage}</p>}
                            {cart.length ? cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-4 border-b border-slate-100 py-4">
                                    <ProductPhoto src={item.thumbnail || item.image} fallbackSrc={item.image} name={item.name} category={item.category} compact className="h-16 w-16 sm:h-[70px] sm:w-[70px] shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{item.name}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">{formatRp(item.price)} / pcs</p>
                                        <div className="mt-2.5 flex items-center justify-between gap-2">
                                            <div className="flex h-8 items-center rounded-xl border border-slate-200 bg-white">
                                                <button type="button" onClick={() => updateQty(item.cartItemId, -1)} className="flex h-8 w-7 items-center justify-center text-slate-500 hover:text-slate-900" aria-label={'Kurangi ' + item.name}><FiMinus size={12} /></button>
                                                <input type="number" min="1" max={item.stock || 999} value={item.qty}
                                                    onChange={event => setQtyDirect(item.cartItemId, event.target.value)}
                                                    aria-label={'Jumlah ' + item.name}
                                                    className="customer-quantity w-7 border-0 p-0 text-center text-xs font-bold text-slate-900 focus:ring-0" />
                                                <button type="button" onClick={() => updateQty(item.cartItemId, 1)} disabled={item.qty >= item.stock}
                                                    className="flex h-8 w-7 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30" aria-label={'Tambah ' + item.name}><FiPlus size={12} /></button>
                                            </div>
                                            <button type="button" onClick={() => removeFromCart(item.cartItemId)} className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-red-600 transition-colors" aria-label={'Hapus ' + item.name}><FiTrash2 size={15} /></button>
                                        </div>
                                        <p className="mt-2 text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">{formatRp(item.price * item.qty)}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center">
                                    <FiShoppingCart size={32} strokeWidth={1.4} className="mx-auto text-slate-300" />
                                    <h3 className="mt-4 text-base font-bold text-slate-900">Keranjang masih kosong</h3>
                                    <p className="mt-1 text-xs text-slate-500">Tambahkan produk yang Anda butuhkan.</p>
                                    <button type="button" onClick={() => setShowCart(false)} className="mt-5 min-h-9 rounded-xl bg-[#19231f] hover:bg-slate-800 px-5 text-xs font-bold text-white transition-colors">Mulai belanja</button>
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="customer-cart-bar border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <dl className="space-y-1.5 text-xs sm:text-sm">
                                    <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="font-semibold text-slate-900">{formatRp(subtotal)}</dd></div>
                                    {taxEnabled && <div className="flex justify-between text-slate-500"><dt>Pajak ({Math.round(taxRate * 100)}%)</dt><dd className="font-semibold text-slate-900">{formatRp(tax)}</dd></div>}
                                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm sm:text-base font-extrabold text-slate-900"><dt>Total estimasi</dt><dd className="text-slate-950 tabular-nums">{formatRp(total)}</dd></div>
                                </dl>
                                <button type="button" onClick={goToPayment} disabled={checkingCart} className="mt-3.5 flex min-h-11 w-full items-center justify-between rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#19231f] shadow-xs hover:shadow transition-all cursor-pointer disabled:cursor-wait">
                                    <span>{checkingCart ? 'Memeriksa harga…' : 'Lanjut ke pembayaran'}</span>
                                    <FiArrowRight size={16} />
                                </button>
                                <p className="mt-2 text-center text-[10px] text-slate-400">Pesanan diambil langsung di toko.</p>
                            </div>
                        )}
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={mounted && !!selectedDetailProduct} onClose={() => setSelectedDetailProduct(null)} className="customer-storefront relative z-50">
                <div className="fixed inset-0" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
                        {selectedDetailProduct && (
                            <DialogPanel className="store-detail-panel relative w-full max-w-[760px] overflow-hidden rounded-lg bg-white text-slate-900">
                                <button type="button" onClick={() => setSelectedDetailProduct(null)}
                                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                                    aria-label="Tutup detail produk"><FiX size={17} /></button>
                                <div className="grid sm:grid-cols-2">
                                    <ProductPhoto fit="contain" src={selectedDetailProduct.image} name={selectedDetailProduct.name} category={selectedDetailProduct.category}
                                        className="aspect-square w-full sm:aspect-auto sm:min-h-[340px]" />
                                    <div className="px-5 pb-6 pt-6 sm:px-7 sm:pt-10">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{selectedDetailProduct.category}</p>
                                            {selectedDetailProduct.is_recommended && (
                                                <span title="Rekomendasi" className="inline-flex items-center shrink-0">
                                                    <FiStar size={13} className="fill-[#FFDD00] text-[#FFDD00]" />
                                                </span>
                                            )}
                                        </div>
                                        <DialogTitle className="mt-1.5 text-lg sm:text-xl font-bold leading-snug tracking-tight text-slate-900">{selectedDetailProduct.name}</DialogTitle>
                                        {selectedDetailProduct.sku && <p className="mt-1 text-xs text-slate-400">Kode: {selectedDetailProduct.sku}</p>}
                                        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                                            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">{formatRp(selectedDetailProduct.price)}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="rounded-[3px] bg-red-600 text-white px-1.5 py-[2px] text-[9.5px] sm:text-[10px] font-black tracking-tight leading-none">25%</span>
                                                <span className="text-sm font-medium text-slate-400 line-through tabular-nums">{formatRp(Math.round(selectedDetailProduct.price * 1.33))}</span>
                                            </div>
                                        </div>
                                        <p className={clsx('mt-1.5 text-xs font-semibold', selectedDetailProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                            {selectedDetailProduct.stock > 0 ? 'Tersedia' : 'Stok habis'}
                                        </p>
                                        {showTotalSold && selectedDetailProduct.total_sold > 0 && <p className="mt-1 text-xs text-slate-400">{selectedDetailProduct.total_sold} terjual</p>}
                                        <div className="mt-5 border-t border-slate-100 pt-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tentang produk</h3>
                                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                                                {selectedDetailProduct.description || 'Deskripsi produk belum tersedia.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {referencesEnabled && <div className="border-t border-slate-100 px-5 py-4.5 sm:px-7 bg-slate-50">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kecocokan motor</h3>
                                    {selectedDetailProduct.motorcycles.length > 0 ? (
                                        <ul className="mt-3 grid max-h-36 gap-2 overflow-y-auto text-sm text-slate-700 sm:grid-cols-2">
                                            {selectedDetailProduct.motorcycles.map(motor => (
                                                <li key={motor.id} className="flex items-start gap-2">
                                                    <FiCheck size={15} className="mt-0.5 shrink-0 text-[#19231f]" aria-hidden="true" />
                                                    <span><span className="font-semibold text-slate-900">{motor.brand} {motor.model}</span>
                                                        {(motor.year_start || motor.year_end) && <span className="block text-xs text-slate-400">{motor.year_start || '…'}–{motor.year_end || 'sekarang'}</span>}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-xs leading-relaxed text-slate-400">Produk ini bersifat Universal (cocok untuk berbagai motor) atau informasi kecocokan spesifik belum tersedia di sistem.</p>
                                    )}
                                </div>}
                                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                                    <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white">
                                        <button type="button" onClick={() => setDetailQty(q => Math.max(1, q - 1))} disabled={selectedDetailProduct.stock <= 0}
                                            className="flex h-10 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 rounded-l-xl disabled:opacity-30 transition-colors cursor-pointer" aria-label="Kurangi jumlah"><FiMinus size={13} /></button>
                                        <input type="number" min="1" max={selectedDetailProduct.stock || 999} value={detailQty}
                                            disabled={selectedDetailProduct.stock <= 0} aria-label="Jumlah yang ditambahkan"
                                            onChange={event => {
                                                const val = parseInt(event.target.value, 10);
                                                setDetailQty(isNaN(val) || val < 1 ? 1 : Math.min(selectedDetailProduct.stock || 999, val));
                                            }}
                                            className="customer-quantity w-8 border-0 bg-transparent p-0 text-center text-xs font-bold text-slate-900 focus:ring-0" />
                                        <button type="button" onClick={() => setDetailQty(q => Math.min(selectedDetailProduct.stock, q + 1))}
                                            disabled={selectedDetailProduct.stock <= 0 || detailQty >= selectedDetailProduct.stock}
                                            className="flex h-10 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 rounded-r-xl disabled:opacity-30 transition-colors cursor-pointer" aria-label="Tambah jumlah"><FiPlus size={13} /></button>
                                    </div>
                                    <button type="button" onClick={() => {
                                        if (selectedDetailProduct.stock <= 0) return;
                                        for (let i = 0; i < detailQty; i++) addToCart(selectedDetailProduct);
                                        setSelectedDetailProduct(null);
                                    }} disabled={selectedDetailProduct.stock <= 0} aria-label="Tambah ke keranjang"
                                        className="flex min-h-10 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 py-2 text-xs sm:text-sm font-bold text-[#19231f] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 shadow-xs transition-colors cursor-pointer">
                                        <FiPlus size={15} strokeWidth={2.2} aria-hidden="true" />
                                        {selectedDetailProduct.stock <= 0 ? 'Stok habis' : <><span className="sm:hidden">Tambah</span><span className="hidden sm:inline">Ke keranjang</span></>}
                                    </button>
                                </div>
                            </DialogPanel>
                        )}
                    </div>
                </div>
            </Dialog>
        </>
    );
}
