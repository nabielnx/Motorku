import { readCustomerOrders } from '@/Utils/customerOrderStore';
import useStorefront from '@/Hooks/useStorefront';
import CustomerProductCard from '@/Components/Customer/CustomerProductCard';
import ProgressiveProducts from '@/Components/Customer/ProgressiveProducts';
import React, { useState, useEffect, useRef, useDeferredValue } from 'react';
import OrderingUnavailable from '@/Components/Customer/OrderingUnavailable';
import { Head, Link, router, usePage } from '@inertiajs/react';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import MenuSkeleton from '@/Components/Skeletons/MenuSkeleton';
import { getProductImage } from '@/Utils/productImage';
import { FiSearch, FiPlus, FiMinus, FiShoppingCart, FiTrash2, FiArrowRight, FiCheck, FiChevronRight, FiX, FiMapPin, FiStar } from 'react-icons/fi';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';
import { StoreHeader, ProductPhoto } from '@/Components/Customer/Storefront';
import MotoQuickPromoSection from '@/Components/Customer/MotoQuickPromoSection';
import { FaWhatsapp } from 'react-icons/fa';
import { fuzzyFilterProducts } from '@/Utils/fuzzySearch';
import { customerCartTotals, loadCustomerCatalog, reconcileCustomerCart } from '@/Utils/customerCart';

const CART_KEY = 'motorku_cart';
const ORDER_KEY = 'motorku_pending_order';


function loadCart(storage) {
    try {
        const raw = storage.getItem(CART_KEY);
        const cartTime = storage.getItem(CART_KEY + '_time');
        if (raw && cartTime) {
            const timeDiff = Date.now() - parseInt(cartTime, 10);
            if (timeDiff > 4 * 60 * 60 * 1000) {
                storage.removeItem(CART_KEY);
                storage.removeItem(CART_KEY + '_time');
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

function saveCart(cart, storage) {
    try {
        storage.setItem(CART_KEY, JSON.stringify(cart));
        storage.setItem(CART_KEY + '_time', Date.now().toString());
    } catch {}
}

export default function CustomerMenu({
    initialProducts = [],
    initialCategories = [],
    settings = {},
    bestSellerProductIds = [],
    promoBanners = {},
}) {
    const { storage, storeUrl } = useStorefront();
    useForceLightTheme();
    const { props } = usePage();
    const referencesEnabled = props.app_settings?.references_enabled !== false;
    const showTotalSold = (props.app_settings?.show_total_sold !== false) && (settings['catalog.show_total_sold'] !== 'false');

    const [isNavigating, setIsNavigating] = useState(false);
    const isSkeletonPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('skeleton');

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            if (event.detail.visit.async) return;
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
        const removeFinish = router.on('finish', event => {
            if (!event.detail.visit.async) setIsNavigating(false);
        });
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
                brand: p.brand || '',
                barcode: p.barcode || '',
                unit: p.unit || '',
                category_parent: p.category?.parent?.name || '',
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

    const [menuItems, setMenuItems] = useState(() => formatProducts(initialProducts));
    const [categories, setCategories] = useState(formatCategories(initialCategories));
    const [cart, setCart] = useState(() => loadCart(storage));
    const cartRef = useRef(cart);
    cartRef.current = cart;
    const [checkingCart, setCheckingCart] = useState(false);
    const [cartMessage, setCartMessage] = useState('');
    const catalogRequest = useRef(null);
    const active = useRef(true);
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    const catalogProps = useRef({ initialProducts, initialCategories });
    const [selectedMainCategory, setSelectedMainCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [hasAnyOrders, setHasAnyOrders] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const [detailQty, setDetailQty] = useState(1);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (catalogProps.current.initialProducts !== initialProducts || catalogProps.current.initialCategories !== initialCategories) {
            setMenuItems(formatProducts(initialProducts));
            setCategories(formatCategories(initialCategories));
            catalogProps.current = { initialProducts, initialCategories };
        }

        // Saved cart lines retain quantities/notes, but catalog values come from the server.
        const reconciled = reconcileCustomerCart(cartRef.current, formatProducts(initialProducts));
        cartRef.current = reconciled.cart;
        setCart(reconciled.cart);
        if (reconciled.needsReview) setCartMessage('Harga atau ketersediaan barang diperbarui. Periksa kembali keranjang Anda.');
    }, [initialProducts, initialCategories]);

    const refreshCatalog = React.useCallback(() => {
        if (catalogRequest.current) return catalogRequest.current;
        setCheckingCart(true);
        catalogRequest.current = loadCustomerCatalog(router).finally(() => {
            catalogRequest.current = null;
            if (active.current) setCheckingCart(false);
        });
        return catalogRequest.current;
    }, []);

    useEffect(() => {
        active.current = true;
        const refreshOnReturn = () => {
            if (document.visibilityState === 'visible' && cartRef.current.length) void refreshCatalog();
        };
        // Also refresh restored Inertia/browser history, which may contain an old catalog.
        refreshOnReturn();
        window.addEventListener('focus', refreshOnReturn);
        window.addEventListener('pageshow', refreshOnReturn);
        document.addEventListener('visibilitychange', refreshOnReturn);
        return () => {
            active.current = false;
            window.removeEventListener('focus', refreshOnReturn);
            window.removeEventListener('pageshow', refreshOnReturn);
            document.removeEventListener('visibilitychange', refreshOnReturn);
        };
    }, [refreshCatalog]);

    useEffect(() => {
        if (showCart && cartRef.current.length) void refreshCatalog();
    }, [showCart, refreshCatalog]);

    const clearCart = () => {
        setCart([]);
        setCartMessage('');
        storage.removeItem(CART_KEY);
        storage.removeItem(CART_KEY + '_time');
        storage.removeItem(ORDER_KEY);
    };

    useEffect(() => {
        saveCart(cart, storage);
    }, [cart, storage]);

    // Cek riwayat order di storage & bersihkan riwayat motor jika ada
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('openCart') === '1') {
                    setShowCart(true);
                }
            }
            storage.removeItem('motorku_active_motorcycle');
            const history = readCustomerOrders(storage);
            if (Array.isArray(history) && history.length > 0) {
                const activeOrders = history.filter(o => ['pending', 'preparing', 'ready'].includes(o.order_status));
                setHasAnyOrders(activeOrders.length > 0);

            } else {
                setHasAnyOrders(false);
            }
        } catch {}
    }, []);

    // ── Perhitungan ──
    const { subtotal, tax, total } = customerCartTotals(cart, settings);
    const taxEnabled = settings['tax.enabled'] !== 'false';
    const taxRate = parseFloat(settings['tax.percentage'] || '0') / 100;
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

    const goToPayment = async () => {
        if (checkingCart || cartRef.current.length === 0) return;
        const previous = cartRef.current;
        const latest = await refreshCatalog();
        if (!active.current) return;
        if (!latest) {
            setCartMessage('Harga terbaru belum dapat diperiksa. Periksa koneksi lalu coba lagi.');
            setShowCart(true);
            return;
        }
        const products = formatProducts(latest.initialProducts);
        const reconciled = reconcileCustomerCart(cartRef.current, products);
        const totals = customerCartTotals(reconciled.cart, latest.settings);
        cartRef.current = reconciled.cart;
        setCart(reconciled.cart);
        saveCart(reconciled.cart, storage);
        const previousTotals = customerCartTotals(previous, settings);
        const refreshedTotals = customerCartTotals(previous, latest.settings);
        if (reconcileCustomerCart(previous, products).needsReview || previousTotals.tax !== refreshedTotals.tax) {
            setCartMessage('Harga atau ketersediaan barang diperbarui. Periksa total terbaru, lalu lanjutkan kembali.');
            setShowCart(true);
            return;
        }
        if (!reconciled.cart.length) return;
        const orderData = {
            cart: reconciled.cart,
            pickup_label: 'Ambil di Toko',
            ...totals,
        };
        storage.setItem(ORDER_KEY, JSON.stringify(orderData));
        router.visit(storeUrl('/payment'));
    };

    // ── Filter & Grouping ──
    const filteredMenu = React.useMemo(() => {
        const main = categories.find(category => category.name === selectedMainCategory);
        const allowed = new Set(main?.children?.map(child => child.name) || []);
        if (main) allowed.add(main.name);
        return fuzzyFilterProducts(menuItems, deferredSearch, {
            filterPredicate: item => !selectedMainCategory || (selectedSubCategory ? item.category === selectedSubCategory : allowed.has(item.category)),
        });
    }, [menuItems, categories, selectedMainCategory, selectedSubCategory, deferredSearch]);

    const categorySections = React.useMemo(() => categories.map(category => {
        const names = new Set([category.name, ...(category.children || []).map(child => child.name)]);
        return { category, items: filteredMenu.filter(item => names.has(item.category)) };
    }).filter(section => section.items.length), [categories, filteredMenu]);

    const promoSlots = React.useMemo(() => [1, 2, 3].map(slot => promoBanners?.[slot]).filter(Boolean), [promoBanners]);

    const storeName = settings['store.name'] || 'Motorku';
    const storeAddress = String(settings['store.address'] ?? props.app_settings?.store_address ?? '').trim();
    const phone = settings['store.phone'] || settings['phone'] || '';
    const whatsapp = phone ? 'https://wa.me/' + phone.replace(/[^0-9]/g, '').replace(/^0/, '62') : null;
    const orderHref = '/order/status';
    const hasFilters = selectedMainCategory !== null || !!searchQuery.trim();
    const resetFilters = () => {
        setSelectedMainCategory(null);
        setSelectedSubCategory(null);
        setSearchQuery('');
    };
    const openDetail = React.useCallback((item) => {
        setSelectedDetailProduct(item);
        setDetailQty(1);
    }, []);

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

    const renderProductCard = React.useCallback((item, isGrid = false) => (
        <CustomerProductCard key={item.id} item={item} isGrid={isGrid} onOpen={openDetail} />
    ), [openDetail]);

    if (isNavigating || isSkeletonPreview) {
        return <MenuSkeleton fullPage={true} isGrid={selectedMainCategory !== null} showPromo={!searchQuery.trim() && selectedMainCategory === null} hasCart={cart.length > 0} />;
    }

    if (settings['qr_order.enabled'] === 'false') return <OrderingUnavailable />;

    return (
        <div className="customer-storefront min-h-screen bg-[#f3f3ed] text-slate-900">
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

            <div className={clsx('store-catalog mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8', cart.length ? 'pb-32' : 'pb-12')}>


                {/* Promo Banner Section (only shown when on 'Semua Produk' and not searching) */}
                {!searchQuery.trim() && selectedMainCategory === null && (
                    <section className="pb-1">
                        <MotoQuickPromoSection
                            products={promoProducts}
                            bannerUrls={promoSlots}
                            onProductClick={openDetail}
                            bestSellerProductIds={bestSellerProductIds}
                            formatRp={formatRp}
                            renderProductCard={renderProductCard}
                        />
                    </section>
                )}

                <div className="store-catalog-layout grid grid-cols-1 gap-y-2.5 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-x-9 lg:gap-y-0">
                    <aside className="store-categories min-w-0 lg:col-start-1">
                        <div className="lg:sticky lg:top-24">
                            <nav aria-label="Kategori produk" className="no-scrollbar flex gap-1.5 overflow-x-auto py-0.5 lg:flex-col lg:gap-1.5 lg:overflow-visible">
                                <button type="button" onClick={() => { setSelectedMainCategory(null); setSelectedSubCategory(null); }}
                                    aria-pressed={selectedMainCategory === null}
                                    className={clsx('flex h-8 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 text-left text-xs transition-all shadow-2xs lg:h-auto lg:py-2 lg:px-3.5 lg:whitespace-normal lg:rounded-xl cursor-pointer',
                                        selectedMainCategory === null
                                            ? 'bg-[#19231f] border border-[#19231f] text-white font-black shadow-xs'
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
                                                    ? 'bg-[#19231f] border border-[#19231f] text-white font-black shadow-xs'
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
                                        <nav aria-label="Sub Kategori" className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto py-0.5 lg:flex-col lg:gap-1.5 lg:overflow-visible pl-0 lg:pl-3 border-l-0 lg:border-l-2 lg:border-[#19231f]">
                                            <button type="button" onClick={() => setSelectedSubCategory(null)}
                                                aria-pressed={selectedSubCategory === null}
                                                className={clsx('flex h-7 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 text-left text-[11px] transition-all shadow-2xs lg:h-auto lg:py-1.5 lg:px-3 lg:whitespace-normal lg:rounded-lg cursor-pointer',
                                                    selectedSubCategory === null
                                                        ? 'bg-[#FFDD00] border border-[#FFE838] text-[#19231f] font-black shadow-xs'
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
                                                                ? 'bg-[#FFDD00] border border-[#FFE838] text-[#19231f] font-black shadow-xs'
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
                                <div className="mt-6 hidden rounded-lg border border-slate-200 bg-white p-4 shadow-2xs lg:block">
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
                                {hasFilters && <button type="button" onClick={resetFilters} className="min-h-7 text-xs font-bold text-[#19231f] hover:text-[#29372f] hover:underline cursor-pointer">Reset filter</button>}
                            </div>
                        )}

                        {filteredMenu.length > 0 ? (
                            selectedMainCategory === null ? (
                                <div className="flex flex-col gap-5 pb-4">
                                    {categorySections.map(({ category, items: catItems }) => {
                                        return (
                                            <section key={category.id}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900">{category.name}</h2>
                                                    <button type="button" onClick={() => setSelectedMainCategory(category.name)} className="text-[11px] font-semibold text-[#19231f] hover:text-[#29372f] hover:underline flex items-center gap-0.5 cursor-pointer">
                                                        <span>Lihat Semua</span>
                                                        <FiChevronRight size={12} />
                                                    </button>
                                                </div>
                                                <ProgressiveProducts items={catItems} renderCard={renderProductCard} />
                                            </section>
                                        );
                                    })}
                                </div>
                            ) : (
                                <ProgressiveProducts items={filteredMenu} renderCard={renderProductCard} grid />
                            )
                        ) : (
                            <div className="rounded-lg border border-slate-200 bg-white px-5 py-14 text-center shadow-2xs">
                                <FiSearch size={28} strokeWidth={1.5} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
                                <h2 className="text-base font-bold text-slate-900">{menuItems.length ? 'Produk tidak ditemukan' : 'Katalog sedang disiapkan'}</h2>
                                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                                    {menuItems.length ? 'Coba kata kunci lain atau hapus filter untuk melihat produk yang tersedia.' : 'Silakan kembali nanti atau hubungi toko untuk menanyakan ketersediaan sparepart.'}
                                </p>
                                {hasFilters && <button type="button" onClick={resetFilters} className="mt-4 min-h-8 rounded-xl bg-[#19231f] hover:bg-[#29372f] px-4 text-xs font-black text-white transition-colors shadow-2xs cursor-pointer">Lihat semua produk</button>}
                            </div>
                        )}
                    </main>
                </div>

                <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500">
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                        <FiMapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                            <p>Pesanan diambil langsung di toko.</p>
                            {storeAddress && <address aria-label="Alamat toko" className="mt-1 max-w-2xl whitespace-pre-line break-words not-italic leading-relaxed text-slate-700">{storeAddress}</address>}
                        </div>
                    </div>
                    {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 font-medium underline underline-offset-4 hover:text-slate-800"><FaWhatsapp size={15} aria-hidden="true" />Hubungi toko</a>}
                </footer>
            </div>

            {cart.length > 0 && (
                <div className="customer-cart-bar fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-lg">
                    <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
                        <button type="button" onClick={() => setShowCart(true)} className="flex min-h-9 sm:min-h-10 items-center gap-3 text-left cursor-pointer" aria-label="Lihat rincian keranjang">
                            <div className="relative flex items-center justify-center text-[#19231f] bg-slate-100 p-2 rounded-xl">
                                <FiShoppingCart size={18} strokeWidth={2.2} aria-hidden="true" />
                                <span className="absolute -top-1.5 -right-1.5 bg-[#FFDD00] text-[#19231f] text-[10px] w-4 h-4 rounded-full font-bold flex items-center justify-center shadow-xs">
                                    {totalQty}
                                </span>
                            </div>
                            <span>
                                <span className="block text-xs font-semibold text-slate-500">{totalQty} item · <span className="text-[#19231f] font-bold">Lihat keranjang</span></span>
                                <span className="block text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">{formatRp(total)}</span>
                            </span>
                        </button>
                        <button type="button" onClick={goToPayment} disabled={checkingCart} className="flex min-h-10 sm:min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FFDD00] hover:bg-[#FFE838] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-[#19231f] transition-all shadow-xs sm:min-w-[180px] cursor-pointer active:scale-95 disabled:cursor-wait">
                            <span>{checkingCart ? 'Memeriksa harga…' : 'Lanjut bayar'}</span>
                            <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            <Dialog open={showCart} onClose={() => setShowCart(false)} className="customer-storefront relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs" aria-hidden="true" />
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

            <Dialog open={!!selectedDetailProduct} onClose={() => setSelectedDetailProduct(null)} className="customer-storefront relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs" aria-hidden="true" />
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
        </div>
    );
}
