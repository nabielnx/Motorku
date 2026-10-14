import { createPosSale } from '@/Api/posSales';
import PaymentModal from '@/Components/POS/PaymentModal';
import ShortcutModal from '@/Components/POS/ShortcutModal';
import PartPreviewModal from '@/Components/Motorcycle/PartPreviewModal';
import ThermalReceipt from '@/Components/ThermalReceipt';

import { checkoutRequestId } from '@/Utils/checkout';
import { POS_CART_KEY, MAX_POS_QTY as MAX_QTY, formatPosProduct, readPosCart, addToPosCart } from '@/Utils/posCart';
import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PosCardSkeleton from '@/Components/Skeletons/PosCardSkeleton';
import { Head, router, usePage } from '@inertiajs/react';
import { ProductPhoto } from '@/Components/Customer/Storefront';
import { getVisibleCategoryIds } from '@/Utils/posCategoryFilter';
import { fuzzyFilterProducts } from '@/Utils/fuzzySearch';
import { getProductLabel } from '@/Utils/productLabel';
import axios from 'axios';
import { toast } from 'sonner';
import { DialogTitle } from '@headlessui/react';
import { FiSearch, FiGrid, FiList, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiCreditCard, FiX, FiUser, FiTag, FiHelpCircle, FiArrowLeft } from 'react-icons/fi';


export default function POSIndex({ initialProducts = [], initialCategories = [], settings = {} }) {
    const { auth } = usePage().props;
    // Format Products from Database or Fallback
    const formatProducts = (rawProducts) => {
        if (!rawProducts || rawProducts.length === 0) return [];
        return rawProducts.map(formatPosProduct);
    };


    const [menuItems, setMenuItems] = useState(formatProducts(initialProducts));
    const [categories, setCategories] = useState(initialCategories);

    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const rawUrl = event?.detail?.visit?.url;
            let targetPath = '';
            if (typeof rawUrl === 'string') {
                targetPath = new URL(rawUrl, window.location.origin).pathname;
            } else if (rawUrl?.pathname) {
                targetPath = rawUrl.pathname;
            }
            if (targetPath && targetPath.startsWith('/pos')) {
                setIsNavigating(true);
            }
        });
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    useEffect(() => {
        setMenuItems(formatProducts(initialProducts));
        setCategories(initialCategories);
    }, [initialProducts, initialCategories]);

    // Refs
    const searchInputRef = useRef(null);
    const cashInputRef = useRef(null);
    const submittingRef = useRef(false);
    const handleProcessOrderRef = useRef(null);
    const focusSearchAfterDeleteRef = useRef(false);

    // State
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [previewProduct, setPreviewProduct] = useState(null);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('pos_view_mode') === 'grid' ? 'grid' : 'list');
    const [customerName, setCustomerName] = useState(() => localStorage.getItem('pos_customer_name') || '');

    useEffect(() => {
        localStorage.setItem('pos_view_mode', viewMode);
    }, [viewMode]);

    // Cart State
    const [cart, setCart] = useState(() => readPosCart(localStorage));

    useEffect(() => {
        const syncCart = event => {
            if (event.storageArea === localStorage && (event.key === POS_CART_KEY || event.key === null)) {
                setCart(readPosCart(localStorage));
            }
        };
        window.addEventListener('storage', syncCart);
        return () => window.removeEventListener('storage', syncCart);
    }, []);

    // Sync State to LocalStorage
    useEffect(() => {
        localStorage.setItem(POS_CART_KEY, JSON.stringify(cart));
        localStorage.setItem('pos_customer_name', customerName);
    }, [cart, customerName]);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    // Canonical payment method values accepted by the backend.
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashReceived, setCashReceived] = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

    const [validationError, setValidationError] = useState('');

    const [qrisImageUrl, setQrisImageUrl] = useState(null);
    const [qrisImageLoading, setQrisImageLoading] = useState(false);
    const [qrisVerified, setQrisVerified] = useState(false);
    const [qrisReference, setQrisReference] = useState('');

    const resetQrisFlow = () => {
        setQrisVerified(false);
        setQrisReference('');
    };

    useEffect(() => {
        if (!isPaymentModalOpen || isOrderComplete) return;
        let active = true;
        setQrisImageLoading(true);
        axios.get('/api/settings/qris-image')
            .then(({ data }) => { if (active) setQrisImageUrl(data?.url || null); })
            .catch(() => { if (active) setQrisImageUrl(null); })
            .finally(() => { if (active) setQrisImageLoading(false); });
        return () => { active = false; };
    }, [isPaymentModalOpen, isOrderComplete]);

    // Centralized Validation Function before Payment
    const validateBeforePayment = () => {
        if (cart.length === 0) {
            return {
                isValid: false,
                message: 'Tambahkan minimal 1 item ke keranjang.'
            };
        }

        return { isValid: true, message: '' };
    };

    const handleOpenPaymentModal = () => {
        const { isValid, message } = validateBeforePayment();
        if (!isValid) {
            setValidationError(message);
            toast.error(message);
            return;
        }
        setValidationError('');
        setIsPaymentModalOpen(true);
    };

    // Calculation
    const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const taxEnabled = settings['tax.enabled'] !== 'false';
    const taxRate = parseFloat(settings['tax.percentage'] || '0') / 100;
    const tax = taxEnabled ? Math.round(subtotal * taxRate) : 0;
    const total = subtotal + tax;

    const changeAmount = Number(cashReceived) >= total ? Number(cashReceived) - total : 0;
    const cashShortfall = Number(cashReceived) < total ? total - Number(cashReceived) : 0;

    const formatRp = (val) => `Rp ${val.toLocaleString('id-ID')}`;

    const quickCashOptions = React.useMemo(() => {
        if (!total || total <= 0) return [];
        const opts = [total];
        const thresholds = [10000, 20000, 50000, 100000, 200000, 500000];
        for (const t of thresholds) {
            if (t > total && !opts.includes(t)) {
                opts.push(t);
            }
        }
        const step = total >= 100000 ? 50000 : 10000;
        const nextRound = Math.ceil(total / step) * step;
        if (nextRound > total && !opts.includes(nextRound)) {
            opts.push(nextRound);
        }
        return opts.sort((a, b) => a - b).slice(0, 4);
    }, [total]);

    // Label display yang ramah user, terpisah dari nilai canonical state
    const paymentMethodLabel = paymentMethod === 'cash' ? 'Tunai' : 'QRIS Manual';

    const parentCategories = categories.filter(category => !category.parent_id);
    const childCategories = categories.filter(category => category.parent_id === selectedParentId);
    const visibleCategoryIds = getVisibleCategoryIds(categories, selectedParentId, selectedChildId);
    const categoryFilterPredicate = (item) => !visibleCategoryIds || visibleCategoryIds.has(item.categoryId);

    const filteredMenu = fuzzyFilterProducts(menuItems, searchQuery, {
        filterPredicate: categoryFilterPredicate
    });

    // Cart Handlers
    const addToCart = (item) => {
        setValidationError('');
        try {
            const nextCart = addToPosCart(cart, item);
            const msg = cart.some(product => product.id === item.id)
                ? `+1 ${item.name} ditambahkan`
                : `${item.name} ditambahkan ke keranjang`;
            setCart(nextCart);
            toast.success(msg, { duration: 1200 });
        } catch (error) {
            toast.error(error.message);
        }
    };

    const updateQty = (id, delta) => {
        setValidationError('');
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                if (delta > 0 && newQty > item.stock) {
                    toast.error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock}).`);
                    return item;
                }
                if (newQty > MAX_QTY) {
                    toast.error(`Maksimal ${MAX_QTY} per item.`);
                    return item;
                }
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }));
    };

    const setQtyDirect = (id, val) => {
        setValidationError('');
        const parsed = parseInt(val, 10);
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                if (isNaN(parsed) || parsed <= 0) return { ...item, qty: 1 };
                if (parsed > item.stock) {
                    toast.error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock}).`);
                    return { ...item, qty: item.stock };
                }
                if (parsed > MAX_QTY) {
                    toast.error(`Maksimal ${MAX_QTY} per item.`);
                    return { ...item, qty: MAX_QTY };
                }
                return { ...item, qty: parsed };
            }
            return item;
        }));
    };

    const removeFromCart = (item) => setItemToDelete(item);

    const confirmRemoveFromCart = () => {
        if (!itemToDelete || submittingRef.current || isOrderComplete) return;
        const targetId = itemToDelete.id;
        focusSearchAfterDeleteRef.current = true;
        setValidationError('');
        if (itemToDelete.clearAll) {
            setCart([]);
            setCashReceived('');
            resetQrisFlow();
            toast.success('Keranjang berhasil dikosongkan.');
        } else {
            setCart(prev => prev.filter(i => i.id !== targetId));
        }
        setItemToDelete(null);
    };

    const updateNotes = (id, notes) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
    };

    // Handle Order Submission
    const buildOrderData = () => ({
        customer_name: customerName.trim(),
        notes: `Bayar via ${paymentMethodLabel}`,
        items: cart.map(i => ({
            product_id: i.id,
            quantity: i.qty,
            notes: i.notes || null
        }))
    });

    const handleProcessOrder = async () => {
        if (submittingRef.current) return;
        const { isValid, message } = validateBeforePayment();
        if (!isValid) {
            toast.error(message);
            setValidationError(message);
            setIsPaymentModalOpen(false);
            return;
        }

        if (paymentMethod === 'cash' && Number(cashReceived) < total) {
            toast.error('Nominal uang tunai kurang dari total tagihan.');
            if (cashInputRef.current) cashInputRef.current.focus();
            return;
        }

        if (paymentMethod === 'qris_manual' && (!qrisImageUrl || !qrisVerified)) {
            toast.error(!qrisImageUrl ? 'Gambar QRIS toko belum tersedia.' : 'Pastikan dana sudah masuk sebelum mengonfirmasi.');
            return;
        }

        submittingRef.current = true;
        setIsSubmittingOrder(true);

        try {
            // Simpan order dan pembayaran bersama setelah kasir mengonfirmasi dana masuk.
            const payload = {
                ...buildOrderData(),
                payment_method: paymentMethod,
                ...(paymentMethod === 'cash'
                    ? { amount_received: Number(cashReceived) }
                    : { reference_number: qrisReference.trim() || null }),
            };
            const requestId = checkoutRequestId(localStorage, `pos_checkout:${auth.user.id}`, payload);
            const sale = await createPosSale({ ...payload, request_id: requestId });
            const createdOrder = sale?.order;
            const payment = sale?.payment;
            if (!createdOrder?.id || !payment?.invoice_number) throw new Error('Respons transaksi tidak lengkap. Coba lagi untuk mengambil transaksi yang sama.');
            const serverTotal = Number(createdOrder?.total ?? total);

            setLastCreatedOrder({
                invoice_number: payment?.invoice_number || createdOrder?.order_number || 'ORD-SUCCESS',
                order: createdOrder,
                total_amount: serverTotal,
                cash_received: paymentMethod === 'cash' ? Number(payment.amount_received) : null,
                change_amount: Number(payment.change_amount),
            });
            setIsOrderComplete(true);

            if (settings['printer.auto_print_receipt'] === 'true') {
                setTimeout(() => window.print(), 150);
            }
        } catch (err) {
            console.error('Order Error:', err.response?.data || err.message);
            const errRes = err.response?.data;
            const validationErr = errRes?.errors ? (Array.isArray(Object.values(errRes.errors)[0]) ? Object.values(errRes.errors)[0][0] : Object.values(errRes.errors)[0]) : null;
            const errMsg = validationErr || (errRes?.message && errRes.message !== 'The given data was invalid.' ? errRes.message : null) || err.message || 'Terjadi kesalahan sistem.';
            toast.error('Gagal: ' + errMsg);
            setValidationError(errMsg);
        } finally {
            submittingRef.current = false;
            setIsSubmittingOrder(false);
        }
    };

    // Keep ref always pointing to latest handleProcessOrder
    useEffect(() => {
        handleProcessOrderRef.current = handleProcessOrder;
    });

    const handleNewOrder = () => {
        localStorage.removeItem(`pos_checkout:${auth.user.id}`);
        resetQrisFlow();
        setCart([]);
        setIsMobileCartOpen(false);
        setCustomerName('');
        setSearchQuery('');
        setIsPaymentModalOpen(false);
        setIsOrderComplete(false);
        setCashReceived('');
        setLastCreatedOrder(null);
        setValidationError('');
    };

    // Auto-focus Cash Input when Modal Opens
    useEffect(() => {
        if (isPaymentModalOpen && !isOrderComplete && paymentMethod === 'cash' && window.matchMedia('(min-width: 768px)').matches) {
            const timer = setTimeout(() => {
                if (cashInputRef.current) {
                    cashInputRef.current.focus();
                    cashInputRef.current.select();
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isPaymentModalOpen, isOrderComplete, paymentMethod]);

    // KEYBOARD SHORTCUTS LISTENER
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Modal mengurus Escape dan fokus; shortcut POS tidak aktif di belakangnya.
            if (itemToDelete || previewProduct) return;

            // F1: Toggle Shortcut Helper Modal
            if (e.key === 'F1') {
                e.preventDefault();
                setIsShortcutModalOpen(prev => !prev);
                return;
            }

            // IF PAYMENT MODAL IS OPEN & ORDER NOT COMPLETE:
            if (isPaymentModalOpen && !isOrderComplete) {
                // 1 / Alt+1: Select Cash
                if (e.key === '1' && (e.altKey || document.activeElement !== cashInputRef.current)) {
                    e.preventDefault();
                    resetQrisFlow();
                    setPaymentMethod('cash');
                    return;
                }
                // Alt + U: Uang Pas
                if ((e.altKey && (e.key === 'u' || e.key === 'U'))) {
                    e.preventDefault();
                    if (paymentMethod === 'cash') {
                        setCashReceived(total.toString());
                    }
                    return;
                }
                // Enter in payment modal: Confirm payment
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (handleProcessOrderRef.current) handleProcessOrderRef.current();
                    return;
                }
            }

            // IF ORDER COMPLETE SCREEN IS ACTIVE:
            if (isPaymentModalOpen && isOrderComplete) {
                // P: Cetak Struk
                if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    window.print();
                    return;
                }
                // Enter / N: Transaksi Baru
                if (e.key === 'Enter' || e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    handleNewOrder();
                    return;
                }
            }

            // F2 or '/': Focus Search Input
            if (e.key === 'F2' || (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName))) {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.select();
                }
                return;
            }

            if (e.key === 'Enter' && document.activeElement === searchInputRef.current && searchQuery.trim() && filteredMenu.length > 0) {
                e.preventDefault();
                const query = searchQuery.trim().toLowerCase();
                const exact = filteredMenu.find(item => item.sku.toLowerCase() === query || item.name.toLowerCase() === query);
                if (exact || filteredMenu.length === 1) {
                    addToCart(exact || filteredMenu[0]);
                    searchInputRef.current.select();
                } else {
                    toast.info('Ada beberapa produk cocok. Pilih ukuran yang benar.');
                }
                return;
            }


            // F8 or (Ctrl + Enter): Open Payment Modal
            if (e.key === 'F8' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                if (!isPaymentModalOpen) {
                    handleOpenPaymentModal();
                }
                return;
            }

            // Escape: Close Modals or Clear Search
            if (e.key === 'Escape') {
                if (isShortcutModalOpen) {
                    setIsShortcutModalOpen(false);
                    return;
                }
                if (isPaymentModalOpen) {
                    if (isSubmittingOrder || isOrderComplete) return;
                    resetQrisFlow();
                    setIsPaymentModalOpen(false);
                    setValidationError('');
                    return;
                }
                if (searchQuery) {
                    setSearchQuery('');
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, isPaymentModalOpen, isOrderComplete, paymentMethod, cashReceived, total, customerName, isSubmittingOrder, isShortcutModalOpen, searchQuery, filteredMenu, itemToDelete, previewProduct]);
return (
        <AuthenticatedLayout pageTitle="POS Kasir" noPadding={true}>
            <Head title="POS Kasir">
                <meta name="description" content="Sistem kasir POS cepat dan responsif untuk penjualan sparepart, pencetakan struk, dan pembayaran instan." />
            </Head>

            <div className="admin-pos flex min-h-0 flex-1 flex-col md:flex-row w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                {/* LEFT SIDE: Menu & Categories */}
                <div className={`${isMobileCartOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 min-h-0 overflow-hidden`}>
                    {/* Header Controls & Search */}
                    <div className="pos-toolbar bg-white dark:bg-slate-900 p-3 sm:p-4 border-b border-slate-300 dark:border-slate-800 space-y-2 sm:space-y-3 shrink-0 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={2.5} size={16} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari produk, motor, atau SKU..."
                                    className="admin-control w-full pl-10 pr-10 py-1.5 font-semibold placeholder-slate-400 transition"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Hapus pencarian produk"
                                        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <FiX size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Kategori induk menampilkan seluruh produk subkategorinya */}
                        <div className="pos-category-bar space-y-2 border-t border-slate-200 pt-2 sm:pt-3 dark:border-slate-800">
                            <div className="flex flex-col gap-2">
                                <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                    {categories.length > 0 ? (
                                        <>
                                            <button
                                                onClick={() => { setSelectedParentId(null); setSelectedChildId(null); }}
                                                aria-pressed={!selectedParentId}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border cursor-pointer ${!selectedParentId ? 'bg-primary text-white border-primary shadow-[0_3px_0_#FFDD00]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                All Produk
                                            </button>
                                            {parentCategories.map(category => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => { setSelectedParentId(category.id); setSelectedChildId(null); }}
                                                    aria-pressed={selectedParentId === category.id}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border cursor-pointer ${selectedParentId === category.id ? 'bg-primary text-white border-primary shadow-[0_3px_0_#FFDD00]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">Belum ada kategori</span>
                                    )}
                                </div>

                                <div className="flex w-full min-w-0 items-center gap-2">
                                    {selectedParentId && childCategories.length > 0 && (
                                        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="group" aria-label="Subkategori produk">
                                            <button
                                                onClick={() => setSelectedChildId(null)}
                                                aria-pressed={!selectedChildId}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${!selectedChildId ? 'border-accentYellow bg-accentYellow text-primaryDark' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                Semua subkategori
                                            </button>
                                            {childCategories.map(category => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => setSelectedChildId(category.id)}
                                                    aria-pressed={selectedChildId === category.id}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${selectedChildId === category.id ? 'border-accentYellow bg-accentYellow text-primaryDark' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="ml-auto flex shrink-0 items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {filteredMenu.length} produk
                                        </span>
                                        <div className="admin-view-switch" role="group" aria-label="Tampilan produk">
                                            {[
                                                { mode: 'list', label: 'Daftar', Icon: FiList },
                                                { mode: 'grid', label: 'Grid', Icon: FiGrid },
                                            ].map(({ mode, label, Icon }) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setViewMode(mode)}
                                                    aria-pressed={viewMode === mode}
                                                    title={label}
                                                    aria-label={label}
                                                    className={`flex min-h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${viewMode === mode ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                                                >
                                                    <Icon size={14} aria-hidden="true" />
                                                    <span className="hidden xl:inline">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setIsShortcutModalOpen(true)}
                                            className="hidden min-h-8 min-w-8 md:flex items-center justify-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition border border-slate-300 dark:border-slate-700 cursor-pointer"
                                            title="Petunjuk Keyboard Shortcut (F1)"
                                            aria-label="Petunjuk keyboard shortcut (F1)"
                                        >
                                            <FiHelpCircle className="w-3.5 h-3.5 text-primary dark:text-yellow-400" strokeWidth={2.5} />
                                            <span className="hidden xl:inline">Shortcut</span>
                                            <kbd className="hidden xl:inline px-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded text-[9px] font-mono">F1</kbd>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Grid ringkas untuk melihat foto, daftar untuk detail produk */}
                    <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] p-3">
                        {isNavigating ? (
                            <PosCardSkeleton count={8} mode={viewMode} />
                        ) : (
                        <div className={`grid items-stretch gap-2 ${viewMode === 'grid' ? 'grid-cols-2 min-[900px]:grid-cols-[repeat(auto-fill,minmax(144px,1fr))]' : 'grid-cols-1 2xl:grid-cols-2'}`}>
                            {filteredMenu.map(item => {
                                const isOutOfStock = item.stock <= 0;
                                const isInCart = cart.some(cartItem => cartItem.id === item.id);
                                const fitment = viewMode === 'list' ? item.motorcycles.slice(0, 2).map(m => `${m.brand} ${m.model}`).join(', ') : '';
                                const label = getProductLabel(item);
                                const applicationText = fitment ? `Cocok: ${fitment}${item.motorcycles.length > 2 ? ` +${item.motorcycles.length - 2} motor` : ''}` : label.application ? `Peruntukan: ${label.application}` : '';
                                return (
                                    <div
                                        key={item.id}
                                        className={`admin-catalog-card group flex w-full border bg-white text-left shadow-xs transition dark:bg-slate-900 ${viewMode === 'grid' ? 'flex-col rounded-xl overflow-hidden' : 'items-start gap-3 rounded-xl p-2.5'} ${
                                            isOutOfStock
                                                ? 'border-slate-200 dark:border-slate-800'
                                                : 'cursor-pointer border-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800'
                                        } ${isInCart ? '!shadow-[inset_3px_0_0_#FFDD00]' : ''}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setPreviewProduct(item)}
                                            aria-label={`Lihat detail ${item.name}`}
                                            aria-haspopup="dialog"
                                            className={`${viewMode === 'grid' ? 'aspect-square w-full shrink-0' : 'h-14 w-14 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700'} overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentYellow`}
                                        >
                                            <ProductPhoto src={item.image} name={item.name} category={item.category} className="h-full w-full" compact />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item)}
                                            disabled={isOutOfStock}
                                            aria-label={`Tambah ${item.name} ke keranjang`}
                                            className={`flex min-w-0 flex-1 flex-col text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentYellow ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'} ${viewMode === 'grid' ? 'w-full p-2.5' : ''}`}
                                        >
                                            <span className={`flex flex-col gap-2 ${viewMode === 'grid' ? 'flex-1' : ''}`}>
                                                <span className={`block min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] font-semibold text-slate-900 dark:text-white ${viewMode === 'grid' ? 'flex-1 text-xs leading-4' : 'text-sm leading-5'}`} title={label.name}>{label.name}</span>
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className={`admin-number shrink-0 whitespace-nowrap font-semibold text-slate-900 dark:text-white ${viewMode === 'grid' ? 'text-xs leading-4' : 'text-sm leading-5'}`}>{formatRp(item.price)}</span>
                                                    {viewMode === 'list' && <span className={`shrink-0 whitespace-nowrap text-[11px] leading-4 font-semibold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {isOutOfStock ? 'Stok habis' : `Stok ${Math.floor(item.stock)}`}
                                                    </span>}
                                                </span>
                                            </span>
                                            {viewMode === 'grid' ? (
                                                <>
                                                    <span className={`mt-auto pt-0.5 block text-[10px] font-semibold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {isOutOfStock ? 'Stok habis' : `Stok ${Math.floor(item.stock)}`}
                                                    </span>
                                                    {label.application && <span className="mt-1 block whitespace-normal break-words text-[10px] leading-4 text-slate-600 dark:text-slate-300">{applicationText}</span>}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="mt-1 flex items-center justify-between gap-3 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                                                        <span className="min-w-0 truncate">
                                                            {[!selectedChildId ? item.category : null, item.sku ? `SKU ${item.sku}` : null, item.rack_location ? `Rak ${item.rack_location}` : null].filter(Boolean).join(' · ')}
                                                        </span>
                                                    </span>
                                                    <span className={`mt-0.5 block min-h-4 text-[11px] leading-4 text-slate-600 dark:text-slate-300 ${label.application && !fitment ? 'whitespace-normal break-words' : 'truncate'}`} title={applicationText || undefined} aria-hidden={!applicationText}>
                                                        {applicationText}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}

                            {filteredMenu.length === 0 && (
                                <div className="col-span-full py-16 text-center text-slate-600 dark:text-slate-300">
                                    <FiTag className="w-8 h-8 mx-auto mb-2 text-slate-500 dark:text-slate-400" strokeWidth={2} />
                                    <p className="text-xs font-semibold">Tidak ada produk yang cocok</p>
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                    <div className="pos-mobile-cart-bar shrink-0 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 md:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileCartOpen(true)}
                            className="pos-mobile-cart-button flex w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-left text-sm font-bold text-white"
                        >
                            <span className="flex min-w-0 items-center gap-2"><FiShoppingBag className="shrink-0" aria-hidden="true" /> Keranjang <span className="text-[#fceb2d]">({cartItemCount})</span></span>
                            <span className="shrink-0 font-mono">{formatRp(total)}</span>
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE: Cart & Checkout Panel */}
                <div className={`pos-cart ${isMobileCartOpen ? 'flex' : 'hidden'} md:flex w-full md:w-96 lg:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 flex-col min-h-0 flex-1 md:flex-none h-full overflow-hidden shrink-0 transition-colors`}>

                    {/* Customer & Order Settings */}
                    <div className="pos-cart-header admin-section-header p-3.5 border-b border-slate-300 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-800 shrink-0">
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5"><FiShoppingBag className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2.5} /> Keranjang <span className="admin-cart-count rounded-md px-1.5 py-0.5 text-[10px] font-bold">{cartItemCount} item</span></span>
                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setItemToDelete({ clearAll: true })}
                                    disabled={cart.length === 0 || isSubmittingOrder || isOrderComplete}
                                    aria-label="Kosongkan keranjang"
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
                                >
                                    <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" /> Kosongkan
                                </button>
                                <button type="button" onClick={() => setIsMobileCartOpen(false)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-primary dark:text-primary md:hidden" aria-label="Kembali ke daftar produk"><FiArrowLeft aria-hidden="true" /> Produk</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiUser className="text-slate-500 dark:text-slate-400 w-4 h-4 shrink-0" strokeWidth={2.5} />
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nama pelanggan (opsional)"
                                aria-label="Nama pelanggan (opsional)"
                                className="admin-control w-full px-2.5 py-1.5 font-semibold"
                            />
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-200 dark:divide-slate-800 min-h-0">
                        {cart.map(item => {
                            const label = getProductLabel(item);
                            return (
                            <div key={item.id} className="pt-3 first:pt-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="whitespace-normal text-sm font-bold text-slate-900 dark:text-white break-words [overflow-wrap:anywhere]">{label.name}</h4>
                                        {label.application && <p className="mt-0.5 whitespace-normal break-words text-[11px] leading-4 text-slate-600 dark:text-slate-300">Peruntukan: {label.application}</p>}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item)}
                                        aria-label={`Hapus ${item.name} dari keranjang`}
                                        title="Hapus produk"
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                    <span className="min-w-0 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{item.qty} × {formatRp(item.price)}</span>
                                    <span className="shrink-0 whitespace-nowrap text-sm font-extrabold text-slate-900 dark:text-white">{formatRp(item.price * item.qty)}</span>
                                </div>

                                <div className="flex items-start justify-between mt-2 gap-2">
                                    <details className="min-w-0 flex-1">
                                        <summary className="block cursor-pointer truncate text-xs font-medium text-primary hover:underline dark:text-primary" title={item.notes || 'Tambah catatan untuk produk ini'}>
                                            {item.notes ? `Catatan: ${item.notes}` : '+ Catatan'}
                                        </summary>
                                        <input
                                            type="text"
                                            placeholder="Catatan produk..."
                                            value={item.notes || ''}
                                            onChange={(e) => updateNotes(item.id, e.target.value)}
                                            aria-label={`Catatan untuk ${item.name}`}
                                            className="mt-2 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:ring-0 focus:border-primary focus:outline-none text-slate-700 dark:text-slate-200"
                                        />
                                    </details>
                                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shrink-0 border border-slate-300 dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.id, -1)}
                                            disabled={item.qty === 1}
                                            aria-label={`Kurangi jumlah ${item.name}`}
                                            title={item.qty === 1 ? 'Jumlah minimal 1' : 'Kurangi jumlah'}
                                            className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <FiMinus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.stock || 999}
                                            value={item.qty}
                                            onChange={(e) => setQtyDirect(item.id, e.target.value)}
                                            aria-label={`Jumlah ${item.name}`}
                                            className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none focus:ring-0 focus:border-b focus:border-primary rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.id, 1)}
                                            aria-label={`Tambah jumlah ${item.name}`}
                                            title="Tambah jumlah"
                                            className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                        >
                                            <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
                        })}

                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 mb-2.5 border border-slate-200 dark:border-slate-700">
                                    <FiShoppingBag className="w-8 h-8 text-slate-400 dark:text-slate-500" strokeWidth={2} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Keranjang Masih Kosong</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pilih produk dari katalog</p>
                            </div>
                        )}
                    </div>

                    {/* Summary & Checkout Button */}
                    <div className="pos-cart-summary border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 pb-[env(safe-area-inset-bottom)] md:pb-0">
                        <div className="p-4 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRp(subtotal)}</span>
                            </div>
                            {taxEnabled && (
                                <div className="flex justify-between">
                                    <span>Pajak ({settings['tax.percentage'] || '0'}%)</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRp(tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-base text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-slate-800 items-baseline">
                                <span>Total Bayar</span>
                                <span className="text-primary dark:text-accentYellow font-mono text-xl">{formatRp(total)}</span>
                            </div>
                        </div>

                        {validationError && (
                            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t-2 border-red-500 text-red-700 dark:text-red-300 text-xs font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FiX className="w-4 h-4 shrink-0 text-red-500" strokeWidth={2.5} />
                                    <span>{validationError}</span>
                                </div>
                                <button onClick={() => setValidationError('')} className="text-red-400 hover:text-red-600">
                                    <FiX className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <button
                            disabled={cart.length === 0}
                            onClick={handleOpenPaymentModal}
                            className="pos-payment-button w-full py-4 bg-accentYellow hover:bg-yellow-300 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-primaryDark font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2.5 rounded-none border-t border-yellow-400 dark:border-slate-800 px-4 group cursor-pointer"
                        >
                            <FiCreditCard className="w-5 h-5" strokeWidth={2.5} />
                            <span>Proses Pembayaran ({formatRp(total)})</span>
                            <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.5 bg-primaryDark text-white rounded text-[10px] font-mono font-bold group-disabled:hidden">F8</kbd>
                        </button>
                    </div>
                </div>
            </div>

            {previewProduct && (
                <PartPreviewModal
                    previewPart={{ ...previewProduct, categoryLabel: previewProduct.category, image_url: previewProduct.image }}
                    setPreviewPart={setPreviewProduct}
                />
            )}

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <PaymentModal
                isSubmittingOrder={isSubmittingOrder}
                isOrderComplete={isOrderComplete}
                resetQrisFlow={resetQrisFlow}
                setIsPaymentModalOpen={setIsPaymentModalOpen}
                cart={cart}
                customerName={customerName}
                formatRp={formatRp}
                total={total}
                setPaymentMethod={setPaymentMethod}
                paymentMethod={paymentMethod}
                qrisImageLoading={qrisImageLoading}
                qrisImageUrl={qrisImageUrl}
                settings={settings}
                cashShortfall={cashShortfall}
                cashReceived={cashReceived}
                cashInputRef={cashInputRef}
                setCashReceived={setCashReceived}
                quickCashOptions={quickCashOptions}
                changeAmount={changeAmount}
                qrisReference={qrisReference}
                setQrisReference={setQrisReference}
                qrisVerified={qrisVerified}
                setQrisVerified={setQrisVerified}
                handleProcessOrder={handleProcessOrder}
                lastCreatedOrder={lastCreatedOrder}
                paymentMethodLabel={paymentMethodLabel}
                handleNewOrder={handleNewOrder}
            />
            )}

            {/* KEYBOARD SHORTCUT HELPER MODAL */}
            {isShortcutModalOpen && (
                <ShortcutModal
                setIsShortcutModalOpen={setIsShortcutModalOpen}
            />
            )}

            <Modal
                show={Boolean(itemToDelete)}
                maxWidth="sm"
                onClose={() => setItemToDelete(null)}
                afterLeave={() => {
                    if (focusSearchAfterDeleteRef.current) {
                        focusSearchAfterDeleteRef.current = false;
                        if (!isMobileCartOpen || window.matchMedia('(min-width: 768px)').matches) {
                            searchInputRef.current?.focus();
                        }
                    }
                }}
            >
                <div className="p-5">
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                        {itemToDelete?.clearAll ? 'Kosongkan keranjang?' : 'Hapus produk dari keranjang?'}
                    </DialogTitle>
                    <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
                        {itemToDelete?.clearAll ? `Semua ${cartItemCount} barang yang dipilih akan dihapus dari keranjang.` : itemToDelete?.name}
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            data-autofocus
                            onClick={() => setItemToDelete(null)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmRemoveFromCart}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                            {itemToDelete?.clearAll ? 'Ya, kosongkan' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* THERMAL PRINTABLE RECEIPT TEMPLATE (Targeted by @media print) */}
            <ThermalReceipt order={lastCreatedOrder?.order} settings={{
                store_name: settings['store.name'], store_address: settings['store.address'],
                store_phone: settings['store.phone'], paper_size: settings['printer.paper_size'],
                timezone: settings['system.timezone'],
            }} fallbackCashier={auth.user.name} />

        </AuthenticatedLayout>
    );
}
