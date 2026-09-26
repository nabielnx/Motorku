import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import axios from 'axios';
import clsx from 'clsx';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import MotorSayaSkeleton, {
    MotorcycleSelectionSkeleton,
    CompatiblePartsPageSkeleton,
    CompatiblePartsListSkeleton
} from '@/Components/Skeletons/MotorSayaSkeleton';
import {
    FiArrowLeft,
    FiSearch,
    FiChevronRight,
    FiFolder,
    FiShoppingCart,
    FiShoppingBag,
    FiPlus,
    FiMinus,
    FiCheck,
    FiX,
    FiTool,
    FiStar
} from 'react-icons/fi';
import { MotorIcon, ProductPhoto, ProductCategoryIcon } from '@/Components/Customer/Storefront';
import { fuzzyFilterProducts } from '@/Utils/fuzzySearch';

function MotorImage({ src, alt, size = 28, className = 'w-full h-full object-contain' }) {
    const [error, setError] = useState(false);
    useEffect(() => { setError(false); }, [src]);

    if (!src || error) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400 p-2 text-center select-none w-full h-full bg-slate-50 rounded-xl">
                <MotorIcon size={size} className="text-slate-300" />
                <span className="text-[9px] font-medium text-slate-400 leading-tight">Foto belum tersedia</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={clsx(className, 'transition-transform duration-200 group-hover:scale-105')}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
}

function ProductImage({ src, alt, className = 'w-full h-full object-contain p-1' }) {
    return <ProductPhoto src={src} name={alt} compact className={className} />;
}

const CART_KEY = 'motorku_cart';
const LEGACY_CART_KEY = 'mie_amour_cart';

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY) || localStorage.getItem(LEGACY_CART_KEY);
        const cartTime = localStorage.getItem(CART_KEY + '_time');
        if (raw && cartTime) {
            const timeDiff = Date.now() - parseInt(cartTime, 10);
            if (timeDiff > 4 * 60 * 60 * 1000) {
                localStorage.removeItem(CART_KEY);
                localStorage.removeItem(CART_KEY + '_time');
                return [];
            }
        }
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];

        // Merge duplicates (legacy bug fix)
        const merged = [];
        parsed.forEach(item => {
            const existingIndex = merged.findIndex(i => i.id === item.id && i.notes === item.notes);
            if (existingIndex > -1) {
                merged[existingIndex].qty += item.qty;
            } else {
                merged.push(item);
            }
        });
        return merged;
    } catch {
        return [];
    }
};

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(CART_KEY + '_time', Date.now().toString());
    } catch {}
}

const motorYears = motor => motor.year_start
    ? motor.year_start + (motor.year_end ? `–${motor.year_end}` : '–sekarang')
    : 'Tahun belum tersedia';

const typeLabels = { semua: 'Semua', matic: 'Matic', bebek: 'Bebek', sport: 'Sport' };

export default function MotorSaya({
    motorcyclesByBrand = {},
    settings = {},
    partCategories = {},
    initialPartsData = null,
}) {
    useForceLightTheme();

    const brands = Object.keys(motorcyclesByBrand);
    const [activeBrand, setActiveBrand] = useState(() => {
        const requested = new URLSearchParams(window.location.search).get('brand');
        if (requested) {
            return brands.find(b => b.toLowerCase() === requested?.toLowerCase()) || requested;
        }
        return 'semua';
    });
    const [activeType, setActiveType] = useState('semua');
    const [searchMotor, setSearchMotor] = useState('');
    const [selectedMotor, setSelectedMotor] = useState(() => initialPartsData?.motorcycle || null);
    const [partsData, setPartsData] = useState(() => initialPartsData || null);
    const [loading, setLoading] = useState(false);
    const [activeCategoryPart, setActiveCategoryPart] = useState('semua');
    const [searchPart, setSearchPart] = useState('');
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const [detailQty, setDetailQty] = useState(1);
    const [cart, setCart] = useState(loadCart);
    const [addedId, setAddedId] = useState(null);

    // Sinkronisasi tombol Back / Forward browser dengan URL slug
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            const match = path.match(/^\/motor-saya\/(.+)/);
            if (match && match[1]) {
                const slugOrId = decodeURIComponent(match[1]);
                const allMotors = Object.values(motorcyclesByBrand).flat();
                const found = allMotors.find(m => m.slug === slugOrId || m.id === slugOrId || m.slug?.includes(slugOrId));
                if (found) {
                    selectMotor(found, false);
                }
            } else if (path === '/motor-saya' || path === '/motor-saya/') {
                setSelectedMotor(null);
                setPartsData(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [motorcyclesByBrand]);

    useEffect(() => {
        saveCart(cart);
    }, [cart]);

    const formatRp = (val) => `Rp ${Math.round(Number(val || 0)).toLocaleString('id-ID')}`;
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotalAmount = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    const storeName = settings['store.name'] || settings['restaurant.name'] || 'Motorku';
    const storePhone = settings['store.phone'] || settings['restaurant.phone'] || settings['phone'] || '';
    const whatsappUrl = storePhone
        ? `https://wa.me/${storePhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`
        : null;

    const logoSrc = settings['store.logo'] || settings['logo'] || settings['restaurant.logo'];
    const formattedLogoSrc = logoSrc
        ? (logoSrc.startsWith('/storage') ? logoSrc : `/storage/${logoSrc}`)
        : null;

    const [hasAnyOrders, setHasAnyOrders] = useState(false);
    const [orderHref, setOrderHref] = useState('/order/status');

    useEffect(() => {
        try {
            const rawHistory = localStorage.getItem('motorku_orders_history') || localStorage.getItem('mie_amour_orders_history');
            const history = rawHistory ? JSON.parse(rawHistory) : [];
            if (Array.isArray(history) && history.length > 0) {
                const activeOrders = history.filter(o => ['pending', 'preparing', 'ready'].includes(o.order_status));
                setHasAnyOrders(activeOrders.length > 0);

                const pendingPay = history.find(o => o.payment_method === 'qris' && o.order_status === 'pending');
                if (pendingPay) {
                    setOrderHref('/payment/qris');
                }
            } else {
                setHasAnyOrders(false);
            }
        } catch {}
    }, []);

    const selectMotor = async (motor, pushUrl = true) => {
        setSelectedMotor(motor);

        if (pushUrl && typeof window !== 'undefined') {
            const targetSlug = motor.slug || motor.id;
            window.history.pushState({ motorId: motor.id }, '', `/motor-saya/${targetSlug}`);
        }

        setActiveCategoryPart('semua');
        setSearchPart('');
        setLoading(true);
        try {
            const res = await axios.get(`/api/motor-saya/${motor.id}/parts`);
            setPartsData(res.data);
        } catch {
            setPartsData({ motorcycle: motor, parts: [] });
        }
        setLoading(false);
    };

    const changeMotor = () => {
        setSelectedMotor(null);
        setPartsData(null);
        setSearchPart('');
        setActiveCategoryPart('semua');
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/motor-saya');
        }
    };

    const addToCart = (item, addQty = 1) => {
        if (item.stock <= 0) return;
        setCart(prev => {
            const existingIndex = prev.findIndex(i => i.id === item.id && !i.notes);
            if (existingIndex > -1) {
                const newQty = Math.min(item.stock, prev[existingIndex].qty + addQty);
                return prev.map((i, idx) => idx === existingIndex ? { ...i, qty: newQty } : i);
            } else {
                return [...prev, {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    stock: item.stock,
                    image: item.image,
                    category: item.category_name || 'Sparepart',
                    qty: Math.min(item.stock, addQty),
                    notes: '',
                    cartItemId: `${item.id}-${Date.now()}`
                }];
            }
        });
        setAddedId(item.id);
        setTimeout(() => setAddedId(null), 1200);
    };

    const skeletonParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('skeleton') : null;
    if (skeletonParam) {
        if (skeletonParam === 'parts' || skeletonParam === 'sparepart' || (selectedMotor && skeletonParam !== 'motor')) {
            return <CompatiblePartsPageSkeleton />;
        }
        return <MotorcycleSelectionSkeleton />;
    }

    // ─── STEP 1: Pilih Motor ───
    if (!selectedMotor) {
        const allMotors = Object.values(motorcyclesByBrand).flat();
        const baseMotors = activeBrand === 'semua' ? allMotors : (motorcyclesByBrand[activeBrand] || []);
        const baseFilteredByType = baseMotors.filter(m => activeType === 'semua' || m.engine_type === activeType);
        const preparedMotors = baseFilteredByType.map(m => ({
            ...m,
            name: `${m.brand} ${m.model} ${m.model_series || ''} ${m.production_year || ''}`
        }));
        const filteredMotors = fuzzyFilterProducts(preparedMotors, searchMotor);

        return (
            <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex justify-center">
                <Head title="Cari Sparepart Motor - Motorku" />

                <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                    {/* STICKY TOP CONTAINER */}
                    <div className="sticky top-0 z-30 bg-white shadow-2xs">
                        {/* Header Bersih: Custom Curved Wave Dual-Color (#4066AD & Putih + Kuning #FFDD00) */}
                        <header className="relative bg-white border-b-[3px] border-[#FFDD00] shadow-2xs overflow-hidden">
                            {/* Background: User's custom white-to-blue curved wave */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                                {/* Desktop SVG curve */}
                                <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="hidden md:block w-full h-full">
                                    <path d="M 450 0 C 410 30, 360 70, 300 100 L 1000 100 L 1000 0 Z" fill="#4066AD" />
                                </svg>
                                {/* Mobile SVG curve */}
                                <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="block md:hidden w-full h-full">
                                    <path d="M 520 0 C 470 30, 420 70, 360 100 L 1000 100 L 1000 0 Z" fill="#4066AD" />
                                </svg>
                            </div>

                            <div className="relative z-10 flex items-center justify-between min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-5 gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Link
                                        href="/"
                                        className="p-1 -ml-1 text-[#FFDD00] hover:text-[#FFE838] transition-colors flex items-center justify-center shrink-0 active:scale-90"
                                        aria-label="Kembali ke Katalog"
                                        title="Kembali ke Katalog"
                                    >
                                        <FiArrowLeft size={22} strokeWidth={2.5} />
                                    </Link>
                                    <Link href="/" className="flex items-center gap-2 min-w-0 group" aria-label="Kembali ke Beranda" title="Kembali ke Beranda">
                                        {formattedLogoSrc ? (
                                            <img
                                                src={formattedLogoSrc}
                                                alt={storeName}
                                                className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg bg-white p-0.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFDD00] text-[#003882] font-bold shadow-xs group-hover:scale-105 transition-transform">
                                                <FiTool size={16} strokeWidth={2.2} aria-hidden="true" />
                                            </span>
                                        )}
                                        <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 truncate">
                                            {storeName}
                                        </span>
                                    </Link>
                                </div>
                                <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                                    <Link
                                        href={orderHref}
                                        title="Pesanan saya"
                                        className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors shrink-0"
                                        aria-label="Pesanan saya"
                                    >
                                        <FiShoppingBag size={19} strokeWidth={2} aria-hidden="true" />
                                        <span className="hidden xl:inline">Pesanan saya</span>
                                        {hasAnyOrders && (
                                            <span className="absolute top-1.5 right-1.5 xl:static xl:top-auto xl:right-auto h-2 w-2 rounded-full bg-[#FFDD00]" aria-label="Ada riwayat pesanan" />
                                        )}
                                    </Link>
                                    <Link
                                        href="/?openCart=1"
                                        title="Keranjang belanja"
                                        className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors shrink-0"
                                        aria-label={'Buka keranjang, ' + totalQty + ' item'}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <FiShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
                                            {totalQty > 0 && (
                                                <span className="absolute -top-2 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFDD00] px-1 text-[10px] font-extrabold text-[#003882] tabular-nums shadow-xs">
                                                    {totalQty}
                                                </span>
                                            )}
                                        </div>
                                        <span className="hidden xl:inline">Keranjang</span>
                                    </Link>
                                </div>
                            </div>
                        </header>

                        {/* COMPACT SEARCH & FILTER TOOLBAR */}
                        <div className="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2 shadow-2xs">
                            {/* Search Bar */}
                            <div className="relative">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari model motor (misal: BeAT, Vario, NMAX)..."
                                    value={searchMotor}
                                    onChange={(e) => setSearchMotor(e.target.value)}
                                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white pl-9 pr-8 py-1.5 rounded-full text-xs font-medium border border-slate-200/80 focus:outline-none focus:border-[#4066AD] focus:ring-2 focus:ring-[#4066AD]/20 transition-all placeholder:text-slate-400"
                                />
                                {searchMotor && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchMotor('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <FiX size={13} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                {/* Filter Merk Motor (Baris Atas: Semua, Honda, Kawasaki, Suzuki, Yamaha) */}
                                <div className="flex w-full gap-1 items-center">
                                    {['semua', ...brands].map(brand => {
                                        const isActive = activeBrand === brand;
                                        const label = brand === 'semua' ? 'Semua' : brand;
                                        return (
                                            <button
                                                key={brand}
                                                type="button"
                                                onClick={() => {
                                                    setActiveBrand(brand);
                                                }}
                                                className={clsx(
                                                    'flex-1 min-w-0 py-1 px-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold text-center transition-all border cursor-pointer truncate',
                                                    isActive
                                                        ? 'bg-[#4066AD] border-[#4066AD] text-white font-black shadow-xs'
                                                        : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Filter Tipe Motor (Baris Bawah: Semua, Matic, Bebek, Sport - Rounded & Kuning Aktif) */}
                                <div className="flex w-full gap-1 items-center">
                                    {Object.entries(typeLabels).map(([type, label]) => {
                                        const isActive = activeType === type;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setActiveType(type)}
                                                className={clsx(
                                                    'flex-1 min-w-0 py-0.5 px-1 rounded-full text-[10.5px] sm:text-[11px] font-bold text-center transition-all border cursor-pointer truncate',
                                                    isActive
                                                        ? 'bg-[#FFDD00] border-[#FFDD00] text-slate-950 font-black shadow-xs'
                                                        : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-3 sm:p-4 space-y-4">
                        {/* MOTOR GRID */}
                        {activeBrand && (
                            <div className="space-y-3 pt-1">
                                <div className="flex items-baseline justify-between gap-2 px-0.5">
                                    <h2 className="font-black text-sm text-slate-900 tracking-tight">
                                        {activeBrand === 'semua' ? 'Semua Motor' : activeBrand} {activeType !== 'semua' ? `· ${typeLabels[activeType] || activeType}` : ''}
                                    </h2>
                                </div>

                                {filteredMotors.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {filteredMotors.map(motor => (
                                            <button
                                                key={motor.id}
                                                type="button"
                                                onClick={() => selectMotor(motor)}
                                                className="bg-white border border-slate-200/90 rounded-2xl text-left hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between shadow-2xs overflow-hidden"
                                            >
                                                {/* Konten Motor dengan padding */}
                                                <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between w-full">
                                                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center text-slate-400 overflow-hidden rounded-xl shrink-0">
                                                        <MotorImage src={motor.image_url} alt={motor.model} size={24} />
                                                    </div>
                                                    <div className="pt-1.5 w-full">
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                            {motor.brand}
                                                        </span>
                                                        <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate transition-colors">
                                                            {motor.model}
                                                        </h3>
                                                        {/* Keterangan motor polos tanpa kotak berbayang */}
                                                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 leading-snug line-clamp-2">
                                                            {[
                                                                motor.engine_cc ? `${motor.engine_cc}cc` : null,
                                                                typeLabels[motor.engine_type] || motor.engine_type,
                                                                motor.year_start ? `${motor.year_start}${motor.year_end ? `–${motor.year_end}` : '+'}` : null
                                                            ].filter(Boolean).join(' · ')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Footer Bar: Selaras dengan brand #4066AD & aksen kuning #FFDD00 */}
                                                <div className="w-full flex items-stretch border-t-2 border-[#FFDD00] bg-[#4066AD] group-hover:bg-[#32528D] transition-colors">
                                                    <div className="flex-1 py-1.5 px-2.5 flex items-center min-w-0">
                                                        <span className="text-white text-[10px] sm:text-xs font-bold leading-none">Lihat sparepart</span>
                                                    </div>
                                                    <div className="bg-[#FFDD00] text-[#003882] px-2 flex items-center justify-center shrink-0 group-hover:bg-[#FFE838] transition-colors">
                                                        <FiChevronRight size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-2xs">
                                        <FiSearch size={30} className="mx-auto text-slate-300 mb-2.5" />
                                        <h3 className="font-bold text-sm text-slate-800">Model tidak ditemukan</h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                            Tidak ada motor dengan kata kunci "{searchMotor}". Coba cari model atau merek lainnya.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => { setSearchMotor(''); setActiveType('semua'); }}
                                            className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#4066AD] hover:bg-[#32528D] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                        >
                                            Reset Pencarian
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {brands.length === 0 && (
                            <div className="text-center py-16 text-slate-400">
                                <FiFolder size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="font-bold text-sm text-slate-700">Belum ada data motor</p>
                                <p className="text-xs text-slate-400 mt-0.5">Data motor sedang disiapkan oleh toko.</p>
                            </div>
                        )}
                    </div>

                    {/* Floating Bottom Cart Bar */}
                    {totalQty > 0 && (
                        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg py-2 px-3 flex justify-center">
                            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl flex items-center justify-between gap-3">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2.5 text-left group min-w-0"
                                    aria-label="Lihat rincian keranjang di katalog"
                                >
                                    <div className="relative flex items-center justify-center text-[#4066AD] bg-[#4066AD]/10 p-2 rounded-xl">
                                        <FiShoppingCart size={18} strokeWidth={2.2} />
                                        <span className="absolute -top-1.5 -right-1.5 bg-[#FFDD00] text-[#003882] text-[10px] w-4 h-4 rounded-full font-bold flex items-center justify-center shadow-xs">
                                            {totalQty}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-xs font-semibold text-slate-500 truncate">{totalQty} item · <span className="text-[#4066AD] font-bold group-hover:underline">Lihat keranjang</span></span>
                                        <span className="block text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">{formatRp(cartTotalAmount)}</span>
                                    </div>
                                </Link>
                                <Link
                                    href="/"
                                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-[#003882] transition-all shadow-xs shrink-0 active:scale-95"
                                >
                                    <span>Lanjut bayar</span>
                                    <FiChevronRight size={15} strokeWidth={2.5} />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── STEP 2: Dashboard Motor — Compatible Parts ───
    const motorcycle = partsData?.motorcycle || selectedMotor;
    const parts = partsData?.parts || [];
    const filteredParts = parts.map(group => {
        if (activeCategoryPart !== 'semua' && group.category !== activeCategoryPart) return null;

        const items = fuzzyFilterProducts(group.items, searchPart);

        if (items.length === 0) return null;
        return { ...group, items };
    }).filter(Boolean);

    const totalAvailableParts = parts.reduce((acc, g) => acc + g.items.length, 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex justify-center">
            <Head title={`${motorcycle.brand} ${motorcycle.model} - Sparepart Kompatibel`} />

            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                {/* STICKY TOP CONTAINER */}
                <div className="sticky top-0 z-30 bg-white shadow-2xs">
                    {/* Header: Info Motor & Ganti Motor - Custom Curved Wave Dual-Color */}
                    <header className="relative bg-white border-b-[3px] border-[#FFDD00] shadow-2xs overflow-hidden">
                        {/* Background: User's custom white-to-blue curved wave */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                            {/* Desktop SVG curve */}
                            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="hidden md:block w-full h-full">
                                <path d="M 450 0 C 410 30, 360 70, 300 100 L 1000 100 L 1000 0 Z" fill="#4066AD" />
                            </svg>
                            {/* Mobile SVG curve */}
                            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="block md:hidden w-full h-full">
                                <path d="M 520 0 C 470 30, 420 70, 360 100 L 1000 100 L 1000 0 Z" fill="#4066AD" />
                            </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-between min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-5 gap-3">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                <button
                                    type="button"
                                    onClick={changeMotor}
                                    className="p-1 -ml-1 text-[#FFDD00] hover:text-[#FFE838] transition-colors flex items-center justify-center shrink-0 active:scale-90 cursor-pointer"
                                    aria-label="Pilih Motor Lain"
                                    title="Pilih Motor Lain"
                                >
                                    <FiArrowLeft size={22} strokeWidth={2.5} />
                                </button>
                                <Link
                                    href="/"
                                    className="flex items-center shrink-0 group"
                                    aria-label="Kembali ke Beranda Motorku"
                                    title="Kembali ke Beranda"
                                >
                                    {formattedLogoSrc ? (
                                        <img
                                            src={formattedLogoSrc}
                                            alt={storeName}
                                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg bg-white p-0.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFDD00] text-[#003882] font-bold shadow-xs group-hover:scale-105 transition-transform">
                                            <FiTool size={16} strokeWidth={2.2} aria-hidden="true" />
                                        </span>
                                    )}
                                </Link>
                                <div className="min-w-0">
                                    <h1 className="font-extrabold text-xs sm:text-sm md:text-base text-slate-900 truncate tracking-tight">
                                        {motorcycle.brand} {motorcycle.model}
                                    </h1>
                                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-semibold truncate mt-0.5">
                                        {[
                                            motorcycle.engine_cc ? `${motorcycle.engine_cc}cc` : null,
                                            typeLabels[motorcycle.engine_type] || motorcycle.engine_type,
                                            motorYears(motorcycle)
                                        ].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                                <Link
                                    href={orderHref}
                                    title="Pesanan saya"
                                    className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors shrink-0"
                                    aria-label="Pesanan saya"
                                >
                                    <FiShoppingBag size={19} strokeWidth={2} aria-hidden="true" />
                                    <span className="hidden xl:inline">Pesanan saya</span>
                                    {hasAnyOrders && (
                                        <span className="absolute top-1.5 right-1.5 xl:static xl:top-auto xl:right-auto h-2 w-2 rounded-full bg-[#FFDD00]" aria-label="Ada riwayat pesanan" />
                                    )}
                                </Link>
                                <Link
                                    href="/?openCart=1"
                                    title="Keranjang belanja"
                                    className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors shrink-0"
                                    aria-label={'Buka keranjang, ' + totalQty + ' item'}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <FiShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
                                        {totalQty > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFDD00] px-1 text-[10px] font-extrabold text-[#003882] tabular-nums shadow-xs">
                                                {totalQty}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden xl:inline">Keranjang</span>
                                </Link>
                            </div>
                        </div>
                    </header>

                    {/* TOOLBAR CARI PART & KATEGORI */}
                    <div className="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2 shadow-2xs">
                        {/* Search Part */}
                        <div className="relative">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder={`Cari part untuk ${motorcycle.model} (misal: kampas, busi, aki)...`}
                                value={searchPart}
                                onChange={(e) => setSearchPart(e.target.value)}
                                className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white pl-9 pr-8 py-1.5 rounded-full text-xs font-medium border border-slate-200/80 focus:outline-none focus:border-[#4066AD] focus:ring-2 focus:ring-[#4066AD]/20 transition-all placeholder:text-slate-400"
                            />
                            {searchPart && (
                                <button
                                    type="button"
                                    onClick={() => setSearchPart('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <FiX size={13} />
                                </button>
                            )}
                        </div>

                        {/* Category Horizontal Filter (Clean Rounded-Full Pills) */}
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar items-center">
                            <button
                                type="button"
                                onClick={() => setActiveCategoryPart('semua')}
                                className={clsx(
                                    'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer',
                                    activeCategoryPart === 'semua'
                                        ? 'bg-[#4066AD] border-[#4066AD] text-white font-black shadow-xs'
                                        : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold'
                                )}
                            >
                                Semua Part
                            </button>
                            {parts.map(group => {
                                const isActive = activeCategoryPart === group.category;
                                return (
                                    <button
                                        key={group.category}
                                        type="button"
                                        onClick={() => setActiveCategoryPart(group.category)}
                                        className={clsx(
                                            'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer',
                                            isActive
                                                ? 'bg-[#4066AD] border-[#4066AD] text-white font-black shadow-xs'
                                                : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold'
                                        )}
                                    >
                                        <span className={isActive ? 'text-white' : 'text-slate-500'}>
                                            <ProductCategoryIcon category={group.category} className="shrink-0" />
                                        </span>
                                        <span>{group.category_label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-3 sm:p-4 space-y-4">

                    {loading ? (
                        <CompatiblePartsListSkeleton groupCount={2} itemsPerGroup={3} />
                    ) : filteredParts.length === 0 ? (
                        <div className="text-center py-14 text-slate-400 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                            <FiFolder size={32} className="mx-auto text-slate-300 mb-2" />
                            <h3 className="font-black text-sm text-slate-800">
                                {searchPart ? `Tidak ada part dengan kata kunci "${searchPart}"` : 'Belum ada data sparepart untuk motor ini'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                {searchPart ? 'Coba gunakan kata kunci lain (misal: kampas, busi, aki, oli).' : 'Kecocokan suku cadang untuk model ini sedang disiapkan oleh toko.'}
                            </p>
                            {searchPart ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchPart('')}
                                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                                >
                                    Reset Pencarian
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={changeMotor}
                                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#4066AD] hover:bg-[#32528D] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                >
                                    Pilih Motor Lain
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredParts.map(group => (
                                <div key={group.category} className="space-y-2">
                                    <div className="px-0.5">
                                        <h2 className="font-black text-xs md:text-sm text-slate-900 tracking-tight">
                                            {group.category_label}
                                        </h2>
                                    </div>

                                    <div className="space-y-2">
                                        {group.items.map(item => {
                                            const isOutOfStock = item.stock <= 0;
                                            const justAdded = addedId === item.id;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={clsx(
                                                        'flex items-stretch bg-white border rounded-2xl transition-all shadow-2xs h-[82px] sm:h-[88px] overflow-hidden',
                                                        isOutOfStock
                                                            ? 'bg-slate-50/70 border-slate-200/70'
                                                            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                                                    )}
                                                >
                                                    {/* Clickable Area: Image & Info */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedDetailProduct(item);
                                                            setDetailQty(1);
                                                        }}
                                                        className="flex items-stretch flex-1 min-w-0 text-left group cursor-pointer h-full"
                                                    >
                                                        {/* Foto pas dengan frame produk di sisi kiri + Badge Bintang Rekomendasi */}
                                                        <div className="relative h-full aspect-square border-r border-slate-100 shrink-0 overflow-hidden">
                                                            <ProductPhoto
                                                                src={item.image}
                                                                name={item.name}
                                                                category={item.category_name || group.category_label}
                                                                compact
                                                                className="h-full w-full"
                                                            />
                                                            {item.is_recommended && (
                                                                <span
                                                                    title="Produk Rekomendasi"
                                                                    className="absolute top-1.5 left-1.5 z-10 pointer-events-none drop-shadow-xs"
                                                                >
                                                                    <FiStar size={14} className="fill-[#FFDD00] text-[#FFDD00]" />
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0 flex flex-col justify-center px-3 sm:px-3.5 py-1.5 h-full">
                                                            {/* Baris 1: Judul Produk (Selalu 1 baris) */}
                                                            <h3 className={clsx(
                                                                'font-bold text-xs sm:text-sm truncate transition-colors leading-tight',
                                                                isOutOfStock ? 'text-slate-400' : 'text-slate-900 group-hover:text-[#4066AD]'
                                                            )}>
                                                                {item.name}
                                                            </h3>

                                                            {/* Baris 2: Catatan / Spesifikasi / Kompatibilitas (Selalu 1 baris) */}
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight truncate">
                                                                {item.notes || `Kompatibel ${motorcycle.model || 'Motor'}`}
                                                            </p>

                                                            {/* Baris 3: Harga, Diskon, & Stok */}
                                                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 min-w-0">
                                                                <span className={clsx(
                                                                    'font-black text-xs sm:text-sm tabular-nums tracking-tight shrink-0',
                                                                    isOutOfStock ? 'text-slate-400' : 'text-slate-900'
                                                                )}>
                                                                    {formatRp(item.price)}
                                                                </span>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <span className="rounded-[3px] bg-red-600 text-white px-1 py-[1.5px] text-[8px] sm:text-[8.5px] font-black tracking-tight leading-none">
                                                                        25%
                                                                    </span>
                                                                    <span className="text-[8.5px] sm:text-[9.5px] font-medium text-slate-400 line-through tabular-nums">
                                                                        {formatRp(Math.round(item.price * 1.33))}
                                                                    </span>
                                                                </div>
                                                                <span className={clsx(
                                                                    'text-[10px] font-bold shrink-0',
                                                                    isOutOfStock ? 'text-slate-400' : 'text-emerald-600'
                                                                )}>
                                                                    {isOutOfStock ? 'Stok Habis' : 'Tersedia'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Quick Add to Cart Action - Strip vertikal ramping nempel ke pojok kanan frame */}
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(item, 1)}
                                                        disabled={isOutOfStock}
                                                        aria-label={`Tambah ${item.name} ke keranjang`}
                                                        title={`Tambah ${item.name}`}
                                                        className={clsx(
                                                            'h-full w-9 sm:w-10 shrink-0 flex items-center justify-center transition-colors cursor-pointer select-none active:opacity-85 border-l group/addbtn',
                                                            justAdded
                                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                                : isOutOfStock
                                                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                    : 'bg-[#FFDD00] hover:bg-[#FFE838] text-[#003882] border-amber-300/60'
                                                        )}
                                                    >
                                                        {justAdded ? (
                                                            <FiCheck size={18} strokeWidth={3} />
                                                        ) : (
                                                            <FiShoppingCart size={17} strokeWidth={2.4} className="transition-transform group-hover/addbtn:scale-110" />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Floating Bottom Cart Bar */}
                {totalQty > 0 && (
                    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg py-2 px-3 flex justify-center">
                        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl flex items-center justify-between gap-3">
                            <Link
                                href="/"
                                className="flex items-center gap-2.5 text-left group min-w-0"
                                aria-label="Lihat rincian keranjang di katalog"
                            >
                                <div className="relative flex items-center justify-center text-[#4066AD] bg-[#4066AD]/10 p-2 rounded-xl">
                                    <FiShoppingCart size={18} strokeWidth={2.2} />
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#FFDD00] text-[#003882] text-[10px] w-4 h-4 rounded-full font-bold flex items-center justify-center shadow-xs">
                                        {totalQty}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-xs font-semibold text-slate-500 truncate">{totalQty} item · <span className="text-[#4066AD] font-bold group-hover:underline">Lihat keranjang</span></span>
                                    <span className="block text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">{formatRp(cartTotalAmount)}</span>
                                </div>
                            </Link>
                            <Link
                                href="/"
                                className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-[#003882] transition-all shadow-xs shrink-0 active:scale-95"
                            >
                                <span>Lanjut bayar</span>
                                <FiChevronRight size={15} strokeWidth={2.5} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DETAIL PRODUK (Selaras dengan Katalog Utama Menu.jsx) */}
            <Dialog open={!!selectedDetailProduct} onClose={() => setSelectedDetailProduct(null)} className="customer-storefront relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
                        {selectedDetailProduct && (
                            <DialogPanel className="relative w-full max-w-[760px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDetailProduct(null)}
                                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                                    aria-label="Tutup detail produk"
                                >
                                    <FiX size={17} />
                                </button>
                                <div className="grid sm:grid-cols-2">
                                    <ProductPhoto
                                        src={selectedDetailProduct.image}
                                        name={selectedDetailProduct.name}
                                        category={selectedDetailProduct.category_name || selectedDetailProduct.category}
                                        className="aspect-square w-full sm:aspect-auto sm:min-h-[340px]"
                                    />
                                    <div className="px-5 pb-6 pt-6 sm:px-7 sm:pt-10">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                {selectedDetailProduct.category_name || selectedDetailProduct.category || 'Sparepart'}
                                            </p>
                                            {selectedDetailProduct.is_recommended && (
                                                <span title="Rekomendasi" className="inline-flex items-center shrink-0">
                                                    <FiStar size={13} className="fill-[#FFDD00] text-[#FFDD00]" />
                                                </span>
                                            )}
                                        </div>
                                        <DialogTitle className="mt-1.5 text-lg sm:text-xl font-bold leading-snug tracking-tight text-slate-900">
                                            {selectedDetailProduct.name}
                                        </DialogTitle>
                                        {selectedDetailProduct.sku && (
                                            <p className="mt-1 text-xs text-slate-400">Kode: {selectedDetailProduct.sku}</p>
                                        )}
                                        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                                            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                                                {formatRp(selectedDetailProduct.price)}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="rounded-[3px] bg-red-600 text-white px-1.5 py-[2px] text-[9.5px] sm:text-[10px] font-black tracking-tight leading-none">
                                                    25%
                                                </span>
                                                <span className="text-sm font-medium text-slate-400 line-through tabular-nums">
                                                    {formatRp(Math.round(selectedDetailProduct.price * 1.33))}
                                                </span>
                                            </div>
                                        </div>
                                        <p className={clsx('mt-1.5 text-xs font-semibold', selectedDetailProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                            {selectedDetailProduct.stock > 0 ? 'Tersedia' : 'Stok habis'}
                                        </p>
                                        <div className="mt-5 border-t border-slate-100 pt-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tentang produk</h3>
                                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                                                {selectedDetailProduct.description || 'Deskripsi produk belum tersedia.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 px-5 py-4 sm:px-7 bg-slate-50/50">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kesesuaian motor Anda</h3>
                                    <div className="mt-2.5 flex items-start gap-2.5 text-sm text-slate-800">
                                        <FiCheck size={16} className="mt-0.5 shrink-0 text-[#4066AD]" aria-hidden="true" />
                                        <div>
                                            <p className="font-bold text-slate-900 leading-snug">{motorcycle.brand} {motorcycle.model}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {[
                                                    motorcycle.engine_cc ? `${motorcycle.engine_cc}cc` : null,
                                                    typeLabels[motorcycle.engine_type] || motorcycle.engine_type,
                                                    motorYears(motorcycle)
                                                ].filter(Boolean).join(' · ')}
                                            </p>
                                            {selectedDetailProduct.notes && (
                                                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{selectedDetailProduct.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 bg-slate-50 px-5 py-4 sm:px-7">
                                    <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white">
                                        <button
                                            type="button"
                                            onClick={() => setDetailQty(q => Math.max(1, q - 1))}
                                            disabled={selectedDetailProduct.stock <= 0}
                                            className="flex h-10 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 rounded-l-xl disabled:opacity-30 transition-colors cursor-pointer"
                                            aria-label="Kurangi jumlah"
                                        >
                                            <FiMinus size={13} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={selectedDetailProduct.stock || 999}
                                            value={detailQty}
                                            disabled={selectedDetailProduct.stock <= 0}
                                            aria-label="Jumlah yang ditambahkan"
                                            onChange={event => {
                                                const val = parseInt(event.target.value, 10);
                                                setDetailQty(isNaN(val) || val < 1 ? 1 : Math.min(selectedDetailProduct.stock || 999, val));
                                            }}
                                            className="customer-quantity w-8 border-0 bg-transparent p-0 text-center text-xs font-bold text-slate-900 focus:ring-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setDetailQty(q => Math.min(selectedDetailProduct.stock, q + 1))}
                                            disabled={selectedDetailProduct.stock <= 0 || detailQty >= selectedDetailProduct.stock}
                                            className="flex h-10 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 rounded-r-xl disabled:opacity-30 transition-colors cursor-pointer"
                                            aria-label="Tambah jumlah"
                                        >
                                            <FiPlus size={13} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedDetailProduct.stock <= 0) return;
                                            addToCart(selectedDetailProduct, detailQty);
                                            setSelectedDetailProduct(null);
                                        }}
                                        disabled={selectedDetailProduct.stock <= 0}
                                        aria-label="Tambah ke keranjang"
                                        className="flex min-h-10 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 py-2 text-xs sm:text-sm font-bold text-[#003882] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 shadow-xs transition-colors cursor-pointer"
                                    >
                                        <FiPlus size={15} strokeWidth={2.2} aria-hidden="true" />
                                        {selectedDetailProduct.stock <= 0 ? 'Stok habis' : <><span>Tambah ke Keranjang ({formatRp(selectedDetailProduct.price * detailQty)})</span></>}
                                    </button>
                                </div>
                            </DialogPanel>
                        )}
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
