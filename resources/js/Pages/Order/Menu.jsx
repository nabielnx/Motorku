import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import { getProductImage } from '@/Utils/productImage';
import {
    FiSearch,
    FiPlus,
    FiMinus,
    FiShoppingCart,
    FiTrash2,
    FiArrowRight,
    FiPhone,
    FiClock,
    FiShoppingBag,
    FiCheck,
    FiChevronRight,
    FiGrid,
    FiX
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

function MotorIcon({ size = 24, className = "" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M15 6h2.5l2 3.5h-5.5l-2-4H7.5L5 9" />
            <path d="M5.5 17.5L8.5 10h6l2 4h-8.5" />
            <path d="M14 6l1.5 4" />
        </svg>
    );
}

const CART_KEY = 'mie_amour_cart';
const ORDER_KEY = 'mie_amour_pending_order';
const CURRENT_ORDER_KEY = 'mie_amour_current_order';
const PAYMENT_KEY = 'mie_amour_order_for_payment';
const HISTORY_KEY = 'mie_amour_orders_history';

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const cartTime = localStorage.getItem(CART_KEY + '_time');
        if (raw && cartTime) {
            const timeDiff = Date.now() - parseInt(cartTime, 10);
            if (timeDiff > 4 * 60 * 60 * 1000) {
                localStorage.removeItem(CART_KEY);
                localStorage.removeItem(CART_KEY + '_time');
                return [];
            }
        }
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(CART_KEY + '_time', Date.now().toString());
    } catch {}
}

export default function CustomerMenu({
    initialProducts = [],
    initialCategories = [],
    settings = {},
    bestSellerProductIds = [],
    promoBanners = {},
}) {
    useForceLightTheme();
    const { props } = usePage();
    const showTotalSold = (props.app_settings?.show_total_sold !== false) && (settings['catalog.show_total_sold'] !== 'false');

    // ── Format data ──
    const formatProducts = (rawProducts) => {
        if (!rawProducts || rawProducts.length === 0) return [];
        return rawProducts.map(p => {
            const catName = p.category ? p.category.name : 'Produk';
            return {
                id: p.id,
                sku: p.sku || '',
                name: p.name,
                description: p.description || '',
                price: Number(p.price),
                category: catName,
                stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
                total_sold: Number(p.total_sold || 0),
                image: getProductImage(p.image_path, catName),
                motorcycles: p.motorcycles || [],
            };
        });
    };

    const formatCategories = (rawCats) => {
        if (!rawCats || rawCats.length === 0) return ['All Produk'];
        return ['All Produk', ...rawCats.map(c => c.name)];
    };

    const [menuItems, setMenuItems] = useState(formatProducts(initialProducts));
    const [categories, setCategories] = useState(formatCategories(initialCategories));
    const [cart, setCart] = useState(loadCart);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Produk');
    const [hasAnyOrders, setHasAnyOrders] = useState(false);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const [detailQty, setDetailQty] = useState(1);
    const searchInputRef = useRef(null);

    useEffect(() => {
        setMenuItems(formatProducts(initialProducts));
        setCategories(formatCategories(initialCategories));
    }, [initialProducts, initialCategories]);

    useEffect(() => {
        saveCart(cart);
    }, [cart]);

    // Cek riwayat order di localStorage (badge "Pesanan Saya")
    useEffect(() => {
        try {
            const rawHistory = localStorage.getItem(HISTORY_KEY);
            const history = rawHistory ? JSON.parse(rawHistory) : [];
            if (Array.isArray(history) && history.length > 0) {
                setHasAnyOrders(true);
                const pendingPay = history.find(o => o.payment_method === 'qris' && o.order_status === 'pending');
                setPendingPayment(pendingPay || null);
            }
        } catch {}
    }, []);

    // ── Perhitungan ──
    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const taxEnabled = settings['tax.enabled'] !== 'false';
    const taxRate = parseFloat(settings['tax.percentage'] || '10') / 100;
    const tax = taxEnabled ? Math.round(subtotal * taxRate) : 0;
    const total = subtotal + tax;
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

    // ── Cart handlers ──
    const addToCart = (item) => {
        if (item.stock <= 0) return;
        const existingIndex = cart.findIndex(i => i.id === item.id && !i.notes);
        if (existingIndex > -1) {
            if (cart[existingIndex].qty >= item.stock) return;
            setCart(prev => prev.map((i, idx) => idx === existingIndex ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setCart(prev => [...prev, { ...item, qty: 1, notes: '', cartItemId: `${item.id}-${Date.now()}` }]);
        }
    };

    const updateQty = (cartItemId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.cartItemId !== cartItemId) return item;
            const newQty = item.qty + delta;
            if (newQty > item.stock) return item;
            return newQty > 0 ? { ...item, qty: newQty } : null;
        }).filter(Boolean));
    };

    const setQtyDirect = (cartItemId, val) => {
        const parsed = parseInt(val, 10);
        setCart(prev => prev.map(item => {
            if (item.cartItemId !== cartItemId) return item;
            if (isNaN(parsed) || parsed <= 0) return { ...item, qty: 1 };
            const maxAllowed = item.stock || 999;
            return { ...item, qty: Math.min(maxAllowed, parsed) };
        }));
    };

    const removeFromCart = (cartItemId) => {
        setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
    };

    const goToPayment = () => {
        if (cart.length === 0) return;
        const orderData = {
            cart: [...cart],
            table_id: null,
            table_name: 'Ambil di Toko',
            order_type: 'take_away',
            subtotal, tax, serviceCharge: 0, total
        };
        localStorage.setItem(ORDER_KEY, JSON.stringify(orderData));
        router.visit('/payment');
    };

    // ── Filter & Grouping ──
    const searchWords = (searchQuery || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filteredMenu = menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'All Produk' || item.category === selectedCategory;
        if (!matchesCategory) return false;
        if (searchWords.length === 0) return true;

        const name = (item.name || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const target = `${name} ${cat} ${sku} ${desc}`;

        return searchWords.every(word => target.includes(word));
    });

    // Grouping by Category for Horizontal Scroll Mode
    const categoriesWithProducts = categories
        .filter(cat => cat !== 'All Produk')
        .map(catName => ({
            name: catName,
            items: menuItems.filter(item => item.category === catName)
        }))
        .filter(catGroup => catGroup.items.length > 0);

    const promoSlots = [1, 2, 3].map(slot => promoBanners?.[slot]).filter(Boolean);

    // Component kartu produk reusable (Compact, Crisp rounded-md borders)
    const renderProductCard = (item, isHorizontal = false) => {
        const isOutOfStock = item.stock <= 0;
        const isBest = bestSellerProductIds.includes(item.id);

        if (isHorizontal) {
            // Mode Baris Horizontal (Responsive: ~4-5 produk sekaligus di layar)
            return (
                <div
                    key={item.id}
                    className={`bg-white rounded-md border overflow-hidden flex flex-col transition shadow-2xs hover:shadow-xs hover:border-[#9ECAE1] w-[145px] sm:w-[165px] md:w-[185px] shrink-0 snap-start ${
                        isOutOfStock ? 'opacity-50 border-slate-200' : 'border-slate-200'
                    }`}
                >
                    <div 
                        onClick={() => { setSelectedDetailProduct(item); setDetailQty(1); }}
                        className="relative h-28 sm:h-32 w-full bg-slate-50 overflow-hidden cursor-pointer group"
                    >
                        <img 
                            src={item.image} 
                            alt={item.name} 
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        {isOutOfStock ? (
                            <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] px-1 py-0.2 rounded font-extrabold shadow-2xs">Habis</span>
                        ) : (
                            <span className="absolute top-1 right-1 bg-slate-900/80 text-white text-[8px] px-1 py-0.2 rounded font-mono font-bold backdrop-blur-xs">Stok: {item.stock}</span>
                        )}
                        {isBest && (
                            <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 text-[8px] px-1 py-0.2 rounded font-black shadow-2xs">Terlaris</span>
                        )}
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between">
                        <div 
                            onClick={() => { setSelectedDetailProduct(item); setDetailQty(1); }}
                            className="cursor-pointer"
                        >
                            <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 leading-snug whitespace-normal hover:text-amber-600 transition" title={item.name}>{item.name}</h3>
                            {showTotalSold && (
                                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mt-0.5 block">{item.total_sold || 0} Terjual</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                            <span className="font-black text-red-600 text-xs sm:text-sm">{formatRp(item.price)}</span>
                            <button
                                onClick={() => addToCart(item)}
                                disabled={isOutOfStock}
                                className={`p-1.5 rounded transition cursor-pointer active:scale-95 ${
                                    isOutOfStock 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                        : 'bg-[#9ECAE1] hover:bg-sky-300 text-slate-950 font-bold shadow-2xs'
                                }`}
                                title="Tambah ke keranjang"
                            >
                                <FiPlus size={13} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Mode Grid (Responsive 2-5 kolom)
        return (
            <div
                key={item.id}
                className={`bg-white rounded-md border overflow-hidden flex flex-col transition shadow-2xs hover:shadow-xs hover:border-[#9ECAE1] w-full ${
                    isOutOfStock ? 'opacity-50 border-slate-200' : 'border-slate-200'
                }`}
            >
                <div 
                    onClick={() => { setSelectedDetailProduct(item); setDetailQty(1); }}
                    className="relative h-28 sm:h-36 w-full bg-slate-50 overflow-hidden cursor-pointer group"
                >
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    {isOutOfStock ? (
                        <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold shadow-2xs">Stok Habis</span>
                    ) : (
                        <span className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[8px] px-1.5 py-0.5 rounded font-mono font-bold backdrop-blur-xs">Stok: {item.stock}</span>
                    )}
                    {isBest && (
                        <span className="absolute top-1.5 left-1.5 bg-amber-400 text-amber-950 text-[8px] px-1.5 py-0.5 rounded font-black shadow-2xs">Terlaris</span>
                    )}
                </div>
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                    <div 
                        onClick={() => { setSelectedDetailProduct(item); setDetailQty(1); }}
                        className="cursor-pointer"
                    >
                        <h3 className="font-bold text-xs text-slate-900 leading-snug whitespace-normal hover:text-amber-600 transition" title={item.name}>{item.name}</h3>
                        {showTotalSold && (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mt-0.5 block">{item.total_sold || 0} Terjual</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                        <span className="font-black text-red-600 text-xs sm:text-sm">{formatRp(item.price)}</span>
                        <button
                            onClick={() => addToCart(item)}
                            disabled={isOutOfStock}
                            className={`p-1.5 rounded transition cursor-pointer active:scale-95 ${
                                isOutOfStock 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-[#9ECAE1] hover:bg-sky-300 text-slate-950 font-bold shadow-2xs'
                            }`}
                        >
                            <FiPlus size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-amber-50/60 font-sans text-slate-800 flex justify-center">
            <Head title="Katalog - Toko Sparepart">
                <meta name="description" content="Katalog sparepart, pesan online, ambil di toko tanpa antri." />
            </Head>

            {/* RESPONSIVE CONTAINER */}
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-28 transition-all duration-200">

                {/* HEADER UTAMA: Deep Navy Header dengan Subtext Biru #9ECAE1 & Badge Kuning */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
                    <div className="bg-[#1E3A8A] px-4 py-3.5 text-white border-b-[3px] border-amber-400">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {(settings['store.logo'] || settings['logo'] || settings['restaurant.logo']) && (
                                    <img 
                                        src={
                                            (settings['store.logo'] || settings['logo'] || settings['restaurant.logo']).startsWith('/storage')
                                                ? (settings['store.logo'] || settings['logo'] || settings['restaurant.logo'])
                                                : `/storage/${settings['store.logo'] || settings['logo'] || settings['restaurant.logo']}`
                                        } 
                                        alt="Logo Store" 
                                        className="w-10 h-10 object-contain rounded-md bg-white p-0.5 shrink-0 shadow-2xs"
                                    />
                                )}
                                <div>
                                    <h1 className="font-extrabold text-base md:text-lg leading-tight">
                                        <span className="tracking-tight">{settings['restaurant.name'] || settings['store.name'] || 'Toko Sparepart'}</span>
                                    </h1>
                                    <p className="text-[10px] md:text-xs text-[#9ECAE1] font-medium flex items-center gap-1.5 mt-0.5">
                                        <span>Pesan online, ambil di toko tanpa antri</span>
                                        {(settings['restaurant.phone'] || settings['phone']) && (
                                            <span>· <FiPhone size={10} className="inline mr-0.5" />{settings['restaurant.phone'] || settings['phone']}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {hasAnyOrders && (
                                <Link
                                    href={pendingPayment ? '/payment/qris' : '/order/status'}
                                    className="bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition shadow-2xs"
                                >
                                    <FiShoppingBag size={13} />
                                    Pesanan Saya
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* SEARCH + CATEGORY PILLS */}
                    <div className="p-2.5 sm:p-3 space-y-2 bg-white">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari sparepart / kode barang..."
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition shadow-2xs"
                            />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {categories.map(cat => {
                                const isActive = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded-md text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
                                            isActive
                                                ? 'bg-amber-400 text-amber-950 shadow-2xs border border-amber-500'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </header>

                {/* PROMO BANNERS */}
                {promoSlots.length > 0 && (
                    <div className="px-4 pt-3 overflow-hidden">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar">
                            {promoSlots.map((b, idx) => (
                                <img key={idx} src={b} alt="Promo" className="w-64 md:w-80 h-24 md:h-32 object-cover rounded-xl shrink-0 border border-slate-100 shadow-2xs" />
                            ))}
                        </div>
                    </div>
                )}

                {/* SLIM HERO BARS SECTION */}
                <div className="px-4 pt-2.5 space-y-2">
                    {/* Bar 1: Motor Saya */}
                    <Link
                        href="/motor-saya"
                        className="bg-[#1E3A8A] rounded-md px-3 py-2 text-white hover:bg-blue-950 transition group border border-blue-900 shadow-2xs flex items-center justify-between gap-2"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 bg-amber-400/20 text-amber-400 rounded flex items-center justify-center shrink-0">
                                <MotorIcon size={14} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-extrabold text-xs leading-tight text-white">
                                    Cari Sparepart Sesuai Motor Kamu
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400 group-hover:text-amber-300 transition shrink-0">
                            <span>Pilih Motor</span>
                            <FiChevronRight size={13} strokeWidth={2.5} />
                        </div>
                    </Link>

                    {/* Bar 2: WhatsApp Store Inquiry */}
                    <div className="bg-emerald-50 border border-emerald-200/90 rounded-md px-3 py-2 flex items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded bg-[#25D366] text-white flex items-center justify-center shrink-0">
                                <FaWhatsapp size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-extrabold text-emerald-950 text-xs leading-tight">
                                    Sparepart yang kamu cari tidak ada di daftar web?
                                </p>
                                <p className="text-[10px] text-emerald-800 leading-tight">
                                    Stok toko fisik lebih lengkap, silakan tanyakan langsung ke penjual
                                </p>
                            </div>
                        </div>
                        <a
                            href={`https://wa.me/${(settings['restaurant.phone'] || settings['phone'] || '081234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent('Halo admin toko, saya ingin tanya ketersediaan sparepart yang belum ada di katalog website.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-extrabold shrink-0 transition shadow-2xs flex items-center gap-1"
                        >
                            Chat WA
                        </a>
                    </div>
                </div>

                {/* PRODUCT CONTENT */}
                <div className="flex-1 p-4 md:p-6">
                    {/* MODUL 1: MODE SEMUA KATEGORI (HORIZONTAL SCROLL PER KATEGORI) */}
                    {selectedCategory === 'All Produk' && !searchQuery ? (
                        <div className="space-y-6 md:space-y-8">
                            {categoriesWithProducts.map(catGroup => (
                                <div key={catGroup.name} className="space-y-2.5">
                                    {/* Header Kategori dengan Dot Aksen Kuning + Link Lihat Semua */}
                                    <div className="flex items-baseline justify-between px-0.5">
                                        <div className="flex items-baseline gap-2">
                                            <div className="w-1.5 h-3.5 rounded-full bg-amber-400 shrink-0 self-center"></div>
                                            <h2 className="font-extrabold text-sm md:text-base text-slate-900">{catGroup.name}</h2>
                                            <span className="text-[10px] md:text-xs font-semibold text-slate-400">
                                                {catGroup.items.length} item
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCategory(catGroup.name)}
                                            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer transition"
                                        >
                                            Lihat Semua <FiChevronRight size={14} />
                                        </button>
                                    </div>

                                    {/* Row Horizontal Produk (Dapat Digeser) */}
                                    <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-2 pt-0.5 px-0.5">
                                        {catGroup.items.map(item => renderProductCard(item, true))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* MODUL 2: MODE GRID (FILTER KATEGORI ATAU PENCARIAN) */
                        <div>
                            {/* Bar Navigasi Filter */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2.5 border-b border-slate-200">
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <div className="w-1.5 h-3.5 bg-amber-500 rounded-sm shrink-0 self-center"></div>
                                    <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                        {searchQuery ? `Hasil: "${searchQuery}"` : selectedCategory}
                                    </h2>
                                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                        {filteredMenu.length} produk
                                    </span>
                                </div>
                                {(selectedCategory !== 'All Produk' || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('All Produk');
                                            setSearchQuery('');
                                        }}
                                        className="text-xs font-bold text-slate-600 hover:text-amber-900 bg-slate-100 hover:bg-amber-100 px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200"
                                    >
                                        <FiGrid size={13} /> Reset Filter
                                    </button>
                                )}
                            </div>

                            {filteredMenu.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 space-y-3">
                                    <div className="w-12 h-12 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                                        <FiSearch size={22} />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-sm text-slate-800">Tidak ada produk yang cocok</p>
                                        <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain (misal: "oli", "castrol", "ban", "aki")</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('All Produk');
                                            setSearchQuery('');
                                        }}
                                        className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2 rounded-md text-xs font-extrabold shadow-2xs transition cursor-pointer"
                                    >
                                        Lihat Semua Produk
                                    </button>
                                </div>
                            ) : (
                                /* Grid Responsive 2-5 Kolom sesuai ukuran layar */
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                    {filteredMenu.map(item => renderProductCard(item, false))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM CHECKOUT BAR + UNIFIED COLLAPSIBLE CART */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl z-40 bg-white border-t border-slate-300 shadow-2xl rounded-t-lg overflow-hidden">

                    {/* COLLAPSIBLE CART DETAIL */}
                    {showCart && (
                        <div className="border-b border-slate-200 bg-white">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                                <span className="text-xs font-extrabold text-slate-800">Daftar Pesanan ({totalQty} item)</span>
                                <button onClick={() => setShowCart(false)} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">Sembunyikan</button>
                            </div>
                            <div className="max-h-56 overflow-y-auto px-4 divide-y divide-slate-100">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="flex items-center gap-2 py-2 text-xs">
                                        <span className="flex-1 font-bold text-slate-800 truncate pr-1">{item.name}</span>
                                        <div className="flex items-center gap-1 bg-slate-100 rounded-md px-1.5 py-0.5 shrink-0 border border-slate-200/80">
                                            <button type="button" onClick={() => updateQty(item.cartItemId, -1)} className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"><FiMinus size={11} strokeWidth={2.5} /></button>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.stock || 999}
                                                value={item.qty}
                                                onChange={(e) => setQtyDirect(item.cartItemId, e.target.value)}
                                                className="w-9 p-0 text-center font-extrabold text-slate-900 bg-transparent text-xs border-0 ring-0 outline-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button type="button" onClick={() => updateQty(item.cartItemId, 1)} className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"><FiPlus size={11} strokeWidth={2.5} /></button>
                                        </div>
                                        <span className="font-extrabold text-red-600 w-20 text-right shrink-0">{formatRp(item.price * item.qty)}</span>
                                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-400 hover:text-red-600 cursor-pointer p-1 transition"><FiTrash2 size={13} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CHECKOUT ACTION BAR */}
                    <div className="p-2.5 sm:p-3 bg-white">
                        <div className="flex items-center gap-2">
                            {/* Toggle cart detail */}
                            <button
                                onClick={() => setShowCart(prev => !prev)}
                                className="bg-amber-400 hover:bg-amber-300 text-amber-950 p-2.5 rounded-md shadow-2xs cursor-pointer active:scale-95 transition relative shrink-0"
                                title="Rincian keranjang"
                            >
                                <FiShoppingCart size={17} strokeWidth={2.5} />
                                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-2xs">{totalQty}</span>
                            </button>
                            {/* Go to payment */}
                            <button
                                onClick={goToPayment}
                                className="flex-1 bg-[#1E3A8A] hover:bg-blue-950 text-white font-extrabold text-xs sm:text-sm py-2.5 px-3.5 rounded-md shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99] transition border border-blue-900"
                            >
                                <span>Lanjut ke Pembayaran</span>
                                <div className="flex items-center gap-2">
                                    <span className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-md text-xs font-extrabold shadow-2xs">{formatRp(total)}</span>
                                    <FiArrowRight size={16} strokeWidth={2.5} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT DETAIL MODAL */}
            {selectedDetailProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-md max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-[#1E3A8A] text-white border-b border-blue-900">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded">
                                    {selectedDetailProduct.category}
                                </span>
                                <h3 className="font-extrabold text-sm truncate text-white">Detail Produk</h3>
                            </div>
                            <button
                                onClick={() => setSelectedDetailProduct(null)}
                                className="p-1 rounded bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-y-auto space-y-3.5">
                            {/* Product Image */}
                            <div className="relative h-44 sm:h-52 w-full bg-slate-50 rounded-md border border-slate-200 overflow-hidden p-2 flex items-center justify-center">
                                <img
                                    src={selectedDetailProduct.image}
                                    alt={selectedDetailProduct.name}
                                    className="max-h-full max-w-full object-contain"
                                />
                                {selectedDetailProduct.stock <= 0 ? (
                                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-extrabold shadow-2xs">Stok Habis</span>
                                ) : (
                                    <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold backdrop-blur-xs">Stok: {selectedDetailProduct.stock}</span>
                                )}
                            </div>

                            {/* Product Title & Info */}
                            <div>
                                <h2 className="font-extrabold text-base text-slate-900 leading-snug">{selectedDetailProduct.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedDetailProduct.sku && (
                                        <p className="text-[10px] font-mono font-semibold text-slate-400">SKU: {selectedDetailProduct.sku}</p>
                                    )}
                                    {showTotalSold && (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {selectedDetailProduct.total_sold || 0} Terjual
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="font-black text-xl text-red-600">{formatRp(selectedDetailProduct.price)}</span>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedDetailProduct.description ? (
                                <div className="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                                    <p className="font-extrabold text-[11px] text-slate-800 mb-1">Deskripsi / Spesifikasi:</p>
                                    <p className="whitespace-pre-line">{selectedDetailProduct.description}</p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-xs text-slate-500">
                                    <p className="font-extrabold text-[11px] text-slate-800 mb-0.5">Informasi Produk:</p>
                                    <p>Produk sparepart asli berkualitas tinggi. Cocok untuk penggantian komponen rutin kendaraan Anda.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / Action */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                            {/* Qty Counter */}
                            <div className="flex items-center border border-slate-300 rounded bg-white shrink-0 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setDetailQty(q => Math.max(1, q - 1))}
                                    className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold transition text-xs cursor-pointer"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedDetailProduct.stock || 999}
                                    value={detailQty}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (isNaN(val) || val < 1) {
                                            setDetailQty(1);
                                        } else {
                                            setDetailQty(Math.min(selectedDetailProduct.stock || 999, val));
                                        }
                                    }}
                                    className="w-12 py-1 text-center text-xs font-black text-slate-900 border-x border-slate-200 focus:outline-none focus:bg-amber-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setDetailQty(q => Math.min(selectedDetailProduct.stock, q + 1))}
                                    className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold transition text-xs cursor-pointer"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart button */}
                            <button
                                onClick={() => {
                                    if (selectedDetailProduct.stock <= 0) return;
                                    for (let i = 0; i < detailQty; i++) {
                                        addToCart(selectedDetailProduct);
                                    }
                                    setSelectedDetailProduct(null);
                                }}
                                disabled={selectedDetailProduct.stock <= 0}
                                className={`flex-1 py-2.5 px-3 rounded text-xs font-extrabold shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer ${
                                    selectedDetailProduct.stock <= 0
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-500'
                                }`}
                            >
                                <FiPlus size={15} strokeWidth={2.5} />
                                <span>Tambah ({formatRp(selectedDetailProduct.price * detailQty)})</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING ORDER STATUS */}
            {hasAnyOrders && (
                <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-20 text-center">
                    <Link href="/order/status" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 rounded-full border border-amber-300 shadow-md cursor-pointer transition">
                        <FiClock size={13} /> Lihat status pesanan Anda
                    </Link>
                </div>
            )}
        </div>
    );
}
