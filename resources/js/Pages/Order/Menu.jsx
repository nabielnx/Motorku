import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import MenuSkeleton from '@/Components/Skeletons/MenuSkeleton';
import { getProductImage } from '@/Utils/productImage';
import { FiSearch, FiPlus, FiMinus, FiShoppingCart, FiTrash2, FiArrowRight, FiCheck, FiChevronRight, FiX, FiMapPin, FiStar } from 'react-icons/fi';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';
import { StoreHeader, MotorIcon, ProductPhoto } from '@/Components/Customer/Storefront';
import MotoQuickPromoSection from '@/Components/Customer/MotoQuickPromoSection';
import { FaWhatsapp } from 'react-icons/fa';
import { fuzzyFilterProducts } from '@/Utils/fuzzySearch';

const CART_KEY = 'motorku_cart';
const LEGACY_CART_KEY = 'mie_amour_cart';
const ORDER_KEY = 'motorku_pending_order';
const HISTORY_KEY = 'motorku_orders_history';
const LEGACY_HISTORY_KEY = 'mie_amour_orders_history';

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

    const [isNavigating, setIsNavigating] = useState(false);
    const isSkeletonPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('skeleton');

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const rawUrl = event?.detail?.visit?.url;
            let targetPath = '';
            if (typeof rawUrl === 'string') {
                targetPath = new URL(rawUrl, window.location.origin).pathname;
            } else if (rawUrl?.pathname) {
                targetPath = rawUrl.pathname;
            }
            if (targetPath && (targetPath === '/' || targetPath.startsWith('/menu') || targetPath.startsWith('/orders/menu'))) {
                setIsNavigating(true);
            }
        });
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

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
                image: p.image_path ? getProductImage(p.image_path, catName) : null,
                motorcycles: p.motorcycles || [],
                is_recommended: Boolean(p.is_recommended),
            };
        });
    };

    const formatCategories = (rawCats) => rawCats || [];

    const [menuItems, setMenuItems] = useState(formatProducts(initialProducts));
    const [categories, setCategories] = useState(formatCategories(initialCategories));
    const [cart, setCart] = useState(loadCart);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [hasAnyOrders, setHasAnyOrders] = useState(false);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const [detailQty, setDetailQty] = useState(1);
    const searchInputRef = useRef(null);

    useEffect(() => {
        setMenuItems(formatProducts(initialProducts));
        setCategories(formatCategories(initialCategories));

        // Bersihkan otomatis item keranjang jika ID produk tidak ada lagi di database
        if (initialProducts && initialProducts.length > 0) {
            const validIds = new Set(initialProducts.map(p => p.id));
            setCart(prev => {
                const filtered = prev.filter(item => validIds.has(item.id));
                if (filtered.length !== prev.length) {
                    saveCart(filtered);
                }
                return filtered;
            });
        }
    }, [initialProducts, initialCategories]);

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(LEGACY_CART_KEY);
        localStorage.removeItem(CART_KEY + '_time');
        localStorage.removeItem(ORDER_KEY);
        localStorage.removeItem('mie_amour_pending_order');
    };

    useEffect(() => {
        saveCart(cart);
    }, [cart]);

    // Cek riwayat order di localStorage & bersihkan riwayat motor jika ada
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('openCart') === '1') {
                    setShowCart(true);
                }
            }
            localStorage.removeItem('motorku_active_motorcycle');
            const rawHistory = localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY);
            const history = rawHistory ? JSON.parse(rawHistory) : [];
            if (Array.isArray(history) && history.length > 0) {
                const activeOrders = history.filter(o => ['pending', 'preparing', 'ready'].includes(o.order_status));
                setHasAnyOrders(activeOrders.length > 0);

                const pendingPay = history.find(o => o.payment_method === 'qris' && o.order_status === 'pending');
                setPendingPayment(pendingPay || null);
            } else {
                setHasAnyOrders(false);
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
        setCart(prev => {
            const existingIndex = prev.findIndex(i => i.id === item.id && !i.notes);
            if (existingIndex > -1) {
                if (prev[existingIndex].qty >= item.stock) return prev;
                return prev.map((i, idx) => idx === existingIndex ? { ...i, qty: i.qty + 1 } : i);
            } else {
                return [...prev, { ...item, qty: 1, notes: '', cartItemId: `${item.id}-${Date.now()}` }];
            }
        });
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
            subtotal, tax, serviceCharge: 0, total
        };
        localStorage.setItem(ORDER_KEY, JSON.stringify(orderData));
        router.visit('/payment');
    };

    // ── Filter & Grouping ──
    const categoryFilterPredicate = (item) => {
        if (!selectedMainCategory) return true;
        const mainCat = categories.find(c => c.name === selectedMainCategory);
        if (!mainCat) return false;
        if (selectedSubCategory) {
            return item.category === selectedSubCategory;
        }
        const childrenNames = mainCat.children ? mainCat.children.map(c => c.name) : [];
        return childrenNames.includes(item.category) || item.category === mainCat.name;
    };

    const filteredMenu = fuzzyFilterProducts(menuItems, searchQuery, {
        filterPredicate: categoryFilterPredicate
    });

    const promoSlots = [1, 2, 3].map(slot => promoBanners?.[slot]).filter(Boolean);

    const storeName = settings['store.name'] || 'Motorku';
    const phone = settings['store.phone'] || settings['phone'] || '';
    const whatsapp = phone ? 'https://wa.me/' + phone.replace(/[^0-9]/g, '').replace(/^0/, '62') : null;
    const orderHref = pendingPayment ? '/payment/qris' : '/order/status';
    const hasFilters = selectedMainCategory !== null || !!searchQuery.trim();
    const resetFilters = () => {
        setSelectedMainCategory(null);
        setSelectedSubCategory(null);
        setSearchQuery('');
    };
    const openDetail = (item) => {
        setSelectedDetailProduct(item);
        setDetailQty(1);
    };

    // Prioritize best selling products for the promo section
    const promoProducts = React.useMemo(() => {
        if (!filteredMenu || filteredMenu.length === 0) return [];
        const best = [];
        const others = [];
        filteredMenu.forEach(item => {
            if (bestSellerProductIds.includes(item.id)) {
                best.push(item);
            } else {
                others.push(item);
            }
        });
        return [...best, ...others];
    }, [filteredMenu, bestSellerProductIds]);

    const renderProductCard = (item, isGrid = false) => {
        const outOfStock = item.stock <= 0;
        const isBest = bestSellerProductIds.includes(item.id);

        return (
            <article key={item.id}
                onClick={() => openDetail(item)}
                className={clsx(
                    "group flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden cursor-pointer active:scale-[0.99]",
                    isGrid
                        ? "w-full h-full"
                        : "w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 snap-start"
                )}>
                <div>
                    <div className="relative block w-full overflow-hidden text-left bg-slate-50/80">
                        <ProductPhoto src={item.image} name={item.name} category={item.category} compact className="aspect-square w-full transition-transform group-hover:scale-102" />
                        {outOfStock && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="rounded bg-slate-800/85 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                    Habis
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="p-1.5 sm:p-2">
                        <h3 className="text-[10px] sm:text-[11px] font-bold leading-tight text-slate-900 transition-colors line-clamp-2">
                            {item.name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1">
                            <span className="rounded-[3px] bg-red-600 text-white px-1 py-[1.5px] text-[8px] sm:text-[8.5px] font-black tracking-tight leading-none">25%</span>
                            <span className="text-[8.5px] sm:text-[9.5px] font-medium text-slate-400 line-through tabular-nums">{formatRp(Math.round(item.price * 1.33))}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-1">
                            <p className="text-xs sm:text-[13px] font-extrabold tracking-tight text-slate-900 tabular-nums">
                                {formatRp(item.price)}
                            </p>
                            {item.is_recommended && (
                                <span title="Rekomendasi" className="inline-flex items-center shrink-0">
                                    <FiStar size={12} className="fill-[#FFDD00] text-[#FFDD00]" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        );
    };

    if (isNavigating || isSkeletonPreview) {
        return <MenuSkeleton fullPage={true} />;
    }

    return (
        <div className="customer-storefront min-h-screen bg-[#f8fafc] text-slate-900">
            <Head title="Katalog Sparepart">
                <meta name="description" content="Cari suku cadang motor, periksa stok, dan pesan untuk diambil di toko." />
            </Head>
            <a href="#catalog-products" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-white focus:p-4">
                Langsung ke produk
            </a>

            <StoreHeader
                settings={settings}
                totalQty={totalQty}
                onCart={() => setShowCart(true)}
                orderHref={orderHref}
                hasAnyOrders={hasAnyOrders}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchInputRef={searchInputRef}
            />

            {/* Motor Saya Banner (Full-Width Pojok Sampai Pojok di Atas, Rounded di Bawah) */}
            <section className="w-full bg-[#FFDD00] rounded-b-[36px] sm:rounded-b-[48px] shadow-xs mb-3.5 sm:mb-4.5 overflow-hidden">
                <Link
                    href="/motor-saya"
                    className="block mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 group active:scale-[0.99] transition-all"
                >
                    <div className="flex items-center gap-3 sm:gap-4 pl-3 sm:pl-4 md:pl-5 pr-3.5 sm:pr-5 md:pr-6">
                        <MotorIcon size={26} className="shrink-0 text-[#4066AD] transition-transform group-hover:scale-105" />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-extrabold text-[#4066AD] tracking-tight transition-colors truncate">
                                Motor Saya
                            </p>
                            <p className="mt-0.5 text-[10px] sm:text-[11.5px] text-slate-600/80 font-normal leading-snug">
                                Tidak tahu suku cadang?, temukan suku cadang sesuai motor anda
                            </p>
                        </div>
                        <FiChevronRight size={20} strokeWidth={2.5} className="shrink-0 text-[#4066AD] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </div>
                </Link>
            </section>

            <div className={clsx('mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8', cart.length ? 'pb-32' : 'pb-12')}>


                {/* Promo Banner Section (only shown when on 'Semua Produk' and not searching) */}
                {!searchQuery.trim() && selectedMainCategory === null && (
                    <section className="pb-1">
                        <MotoQuickPromoSection
                            products={promoProducts}
                            bannerUrl={promoBanners?.[1] || promoBanners?.['1'] || null}
                            onProductClick={openDetail}
                            bestSellerProductIds={bestSellerProductIds}
                            formatRp={formatRp}
                            renderProductCard={renderProductCard}
                        />
                    </section>
                )}

                <div className="grid grid-cols-1 gap-y-2.5 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-x-9 lg:gap-y-0">
                    <aside className="min-w-0 lg:col-start-1">
                        <div className="lg:sticky lg:top-24">
                            <nav aria-label="Kategori produk" className="no-scrollbar flex gap-1.5 overflow-x-auto py-0.5 lg:flex-col lg:gap-1.5 lg:overflow-visible">
                                <button type="button" onClick={() => { setSelectedMainCategory(null); setSelectedSubCategory(null); }}
                                    aria-pressed={selectedMainCategory === null}
                                    className={clsx('flex h-8 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 text-left text-xs transition-all shadow-2xs lg:h-auto lg:py-2 lg:px-3.5 lg:whitespace-normal lg:rounded-xl cursor-pointer',
                                        selectedMainCategory === null
                                            ? 'bg-[#4066AD] border border-[#4066AD] text-white font-black shadow-xs'
                                            : 'bg-white border border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-slate-50 font-bold')}>
                                    <span>Semua Produk</span>
                                </button>
                                {categories.map(category => {
                                    const active = selectedMainCategory === category.name;
                                    return (
                                        <button key={category.id} type="button" onClick={() => { setSelectedMainCategory(category.name); setSelectedSubCategory(null); }}
                                            aria-pressed={active}
                                            className={clsx('flex h-8 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 text-left text-xs transition-all shadow-2xs lg:h-auto lg:py-2 lg:px-3.5 lg:whitespace-normal lg:rounded-xl cursor-pointer',
                                                active
                                                    ? 'bg-[#4066AD] border border-[#4066AD] text-white font-black shadow-xs'
                                                    : 'bg-white border border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-slate-50 font-bold')}>
                                            <span>{category.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                            {selectedMainCategory && (() => {
                                const mainCat = categories.find(c => c.name === selectedMainCategory);
                                if (mainCat && mainCat.children && mainCat.children.length > 0) {
                                    return (
                                        <nav aria-label="Sub Kategori" className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto py-0.5 lg:flex-col lg:gap-1.5 lg:overflow-visible pl-0 lg:pl-3 border-l-0 lg:border-l-2 lg:border-[#4066AD]/20">
                                            <button type="button" onClick={() => setSelectedSubCategory(null)}
                                                aria-pressed={selectedSubCategory === null}
                                                className={clsx('flex h-7 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 text-left text-[11px] transition-all shadow-2xs lg:h-auto lg:py-1.5 lg:px-3 lg:whitespace-normal lg:rounded-lg cursor-pointer',
                                                    selectedSubCategory === null
                                                        ? 'bg-[#FFDD00] border border-[#FFE838] text-[#003882] font-black shadow-xs'
                                                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold')}>
                                                <span>Semua {selectedMainCategory.split(',')[0]}</span>
                                            </button>
                                            {mainCat.children.map(sub => {
                                                const active = selectedSubCategory === sub.name;
                                                return (
                                                    <button key={sub.id} type="button" onClick={() => setSelectedSubCategory(sub.name)}
                                                        aria-pressed={active}
                                                        className={clsx('flex h-7 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 text-left text-[11px] transition-all shadow-2xs lg:h-auto lg:py-1.5 lg:px-3 lg:whitespace-normal lg:rounded-lg cursor-pointer',
                                                            active
                                                                ? 'bg-[#FFDD00] border border-[#FFE838] text-[#003882] font-black shadow-xs'
                                                                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold')}>
                                                        <span>{sub.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    );
                                }
                                return null;
                            })()}
                            {whatsapp && (
                                <div className="mt-6 hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs lg:block">
                                    <p className="text-sm font-bold text-slate-900">Perlu bantuan?</p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">Tanyakan stok atau kecocokan sparepart kepada tim toko.</p>
                                    <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                                        className="mt-3 inline-flex min-h-8 items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-1.5 text-xs font-bold transition-colors">
                                        <FaWhatsapp size={15} aria-hidden="true" />Hubungi WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>
                    </aside>

                    <main id="catalog-products" className="min-w-0 scroll-mt-24 lg:col-start-2">

                        {(searchQuery.trim() || hasFilters) && (
                            <div className="flex min-h-[36px] flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2.5 lg:min-h-[48px] lg:py-2">
                                {searchQuery.trim() && (
                                    <p className="text-xs sm:text-sm text-slate-500" role="status">
                                        Hasil pencarian untuk <span className="font-bold text-slate-900">"{searchQuery.trim()}"</span>
                                    </p>
                                )}
                                {hasFilters && <button type="button" onClick={resetFilters} className="min-h-7 text-xs font-bold text-[#4066AD] hover:text-[#32528D] hover:underline cursor-pointer">Reset filter</button>}
                            </div>
                        )}

                        {filteredMenu.length > 0 ? (
                            selectedMainCategory === null ? (
                                <div className="flex flex-col gap-5 pb-4">
                                    {categories.map(category => {
                                        const childrenNames = category.children ? category.children.map(c => c.name) : [];
                                        const catItems = filteredMenu.filter(item => childrenNames.includes(item.category) || item.category === category.name);
                                        if (catItems.length === 0) return null;
                                        return (
                                            <section key={category.id}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900">{category.name}</h2>
                                                    <button type="button" onClick={() => setSelectedMainCategory(category.name)} className="text-[11px] font-semibold text-[#4066AD] hover:text-[#2d4d8c] hover:underline flex items-center gap-0.5 cursor-pointer">
                                                        <span>Lihat Semua</span>
                                                        <FiChevronRight size={12} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                                                    {catItems.map(item => renderProductCard(item, false))}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-4">
                                    {filteredMenu.map(item => renderProductCard(item, true))}
                                </div>
                            )
                        ) : (
                            <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-14 text-center shadow-2xs">
                                <FiSearch size={28} strokeWidth={1.5} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
                                <h2 className="text-base font-bold text-slate-900">{menuItems.length ? 'Produk tidak ditemukan' : 'Katalog sedang disiapkan'}</h2>
                                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                                    {menuItems.length ? 'Coba kata kunci lain atau hapus filter untuk melihat produk yang tersedia.' : 'Silakan kembali nanti atau hubungi toko untuk menanyakan ketersediaan sparepart.'}
                                </p>
                                {hasFilters && <button type="button" onClick={resetFilters} className="mt-4 min-h-8 rounded-xl bg-[#4066AD] hover:bg-[#32528D] px-4 text-xs font-black text-white transition-colors shadow-2xs cursor-pointer">Lihat semua produk</button>}
                            </div>
                        )}
                    </main>
                </div>

                <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-5 text-xs text-slate-500">
                    <span className="flex items-center gap-2"><FiMapPin size={14} aria-hidden="true" />Pesanan diambil langsung di toko.</span>
                    {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 font-medium underline underline-offset-4 hover:text-slate-800"><FaWhatsapp size={15} aria-hidden="true" />Hubungi toko</a>}
                </footer>
            </div>

            {cart.length > 0 && (
                <div className="customer-cart-bar fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg">
                    <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
                        <button type="button" onClick={() => setShowCart(true)} className="flex min-h-9 sm:min-h-10 items-center gap-3 text-left cursor-pointer" aria-label="Lihat rincian keranjang">
                            <div className="relative flex items-center justify-center text-[#4066AD] bg-[#4066AD]/10 p-2 rounded-xl">
                                <FiShoppingCart size={18} strokeWidth={2.2} aria-hidden="true" />
                                <span className="absolute -top-1.5 -right-1.5 bg-[#FFDD00] text-[#003882] text-[10px] w-4 h-4 rounded-full font-bold flex items-center justify-center shadow-xs">
                                    {totalQty}
                                </span>
                            </div>
                            <span>
                                <span className="block text-xs font-semibold text-slate-500">{totalQty} item · <span className="text-[#4066AD] font-bold">Lihat keranjang</span></span>
                                <span className="block text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">{formatRp(total)}</span>
                            </span>
                        </button>
                        <button type="button" onClick={goToPayment} className="flex min-h-10 sm:min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-[#003882] transition-all shadow-xs sm:min-w-[180px] cursor-pointer active:scale-95">
                            <span>Lanjut bayar</span>
                            <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            <Dialog open={showCart} onClose={() => setShowCart(false)} className="customer-storefront relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs" aria-hidden="true" />
                <div className="fixed inset-0 flex justify-end">
                    <DialogPanel className="flex h-full w-full max-w-md flex-col bg-white text-slate-900 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-3.5 sm:px-6">
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
                            {cart.length ? cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-4 border-b border-slate-100 py-4">
                                    <ProductPhoto src={item.image} name={item.name} category={item.category} compact className="h-16 w-16 sm:h-[70px] sm:w-[70px] shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden" />
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
                                    <p className="mt-1 text-xs text-slate-500">Tambahkan sparepart yang Anda butuhkan.</p>
                                    <button type="button" onClick={() => setShowCart(false)} className="mt-5 min-h-9 rounded-xl bg-[#0f172a] hover:bg-slate-800 px-5 text-xs font-bold text-white transition-colors">Mulai belanja</button>
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="customer-cart-bar border-t border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                                <dl className="space-y-1.5 text-xs sm:text-sm">
                                    <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="font-semibold text-slate-900">{formatRp(subtotal)}</dd></div>
                                    {taxEnabled && <div className="flex justify-between text-slate-500"><dt>Pajak ({Math.round(taxRate * 100)}%)</dt><dd className="font-semibold text-slate-900">{formatRp(tax)}</dd></div>}
                                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm sm:text-base font-extrabold text-slate-900"><dt>Total estimasi</dt><dd className="text-slate-950 tabular-nums">{formatRp(total)}</dd></div>
                                </dl>
                                <button type="button" onClick={goToPayment} className="mt-3.5 flex min-h-11 w-full items-center justify-between rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#003882] shadow-xs hover:shadow transition-all cursor-pointer">
                                    <span>Lanjut ke pembayaran</span>
                                    <FiArrowRight size={16} />
                                </button>
                                <p className="mt-2 text-center text-[10px] text-slate-400">Pesanan diambil langsung di toko.</p>
                            </div>
                        )}
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={!!selectedDetailProduct} onClose={() => setSelectedDetailProduct(null)} className="customer-storefront relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
                        {selectedDetailProduct && (
                            <DialogPanel className="relative w-full max-w-[760px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                                <button type="button" onClick={() => setSelectedDetailProduct(null)}
                                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur-xs text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                                    aria-label="Tutup detail produk"><FiX size={17} /></button>
                                <div className="grid sm:grid-cols-2">
                                    <ProductPhoto src={selectedDetailProduct.image} name={selectedDetailProduct.name} category={selectedDetailProduct.category}
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
                                <div className="border-t border-slate-100 px-5 py-4.5 sm:px-7 bg-slate-50/50">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kecocokan motor</h3>
                                    {selectedDetailProduct.motorcycles.length > 0 ? (
                                        <ul className="mt-3 grid max-h-36 gap-2 overflow-y-auto text-sm text-slate-700 sm:grid-cols-2">
                                            {selectedDetailProduct.motorcycles.map(motor => (
                                                <li key={motor.id} className="flex items-start gap-2">
                                                    <FiCheck size={15} className="mt-0.5 shrink-0 text-[#4066AD]" aria-hidden="true" />
                                                    <span><span className="font-semibold text-slate-900">{motor.brand} {motor.model}</span>
                                                        {(motor.year_start || motor.year_end) && <span className="block text-xs text-slate-400">{motor.year_start || '…'}–{motor.year_end || 'sekarang'}</span>}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-xs leading-relaxed text-slate-400">Produk ini bersifat Universal (cocok untuk berbagai motor) atau informasi kecocokan spesifik belum tersedia di sistem.</p>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 bg-slate-50 px-5 py-4 sm:px-7">
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
                                        className="flex min-h-10 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 py-2 text-xs sm:text-sm font-bold text-[#003882] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 shadow-xs transition-colors cursor-pointer">
                                        <FiPlus size={15} strokeWidth={2.2} aria-hidden="true" />
                                        {selectedDetailProduct.stock <= 0 ? 'Stok habis' : <><span className="sm:hidden">Tambah</span><span className="hidden sm:inline">Ke keranjang</span></>}
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
