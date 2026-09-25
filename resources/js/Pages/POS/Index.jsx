import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PosCardSkeleton from '@/Components/Skeletons/PosCardSkeleton';
import { Head, router, usePage } from '@inertiajs/react';
import { getProductImage } from '@/Utils/productImage';
import { getVisibleCategoryIds } from '@/Utils/posCategoryFilter';
import { fuzzyFilterProducts } from '@/Utils/fuzzySearch';
import axios from 'axios';
import { toast } from 'sonner';
import { DialogTitle } from '@headlessui/react';
import {
    FiSearch,
    FiGrid,
    FiList,
    FiPlus,
    FiMinus,
    FiTrash2,
    FiShoppingBag,
    FiCreditCard,
    FiSmartphone,
    FiPrinter,
    FiCheck,
    FiX,
    FiUser,
    FiTag,
    FiDollarSign,
    FiHelpCircle,
    FiAlertCircle
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

function ProductPhoto({ src, name }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => setFailed(false), [src]);

    if (!src || failed) {
        return (
            <span className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <FiShoppingBag size={24} aria-hidden="true" />
            </span>
        );
    }

    return <img src={src} alt={name} onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

export default function POSIndex({ initialProducts = [], initialCategories = [], settings = {} }) {
    // Format Products from Database or Fallback
    const formatProducts = (rawProducts) => {
        if (!rawProducts || rawProducts.length === 0) return [];
        return rawProducts.map(p => {
            const catName = p.category ? p.category.name : 'Sparepart';
            return {
                id: p.id,
                sku: p.sku || '',
                brand: p.brand || '',
                rack_location: p.rack_location || '',
                name: p.name,
                description: p.description || '',
                price: Number(p.price),
                category: catName,
                categoryId: p.category_id,
                stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
                image: getProductImage(p.image_path, catName),
                motorcycles: p.motorcycles || []
            };
        });
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
    const pendingOrderRef = useRef(null);
    const submittingRef = useRef(false);
    const handleProcessOrderRef = useRef(null);
    const focusSearchAfterDeleteRef = useRef(false);

    // State
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('pos_view_mode') === 'grid' ? 'grid' : 'list');
    const [customerName, setCustomerName] = useState(() => localStorage.getItem('pos_customer_name') || '');

    useEffect(() => {
        localStorage.setItem('pos_view_mode', viewMode);
    }, [viewMode]);

    // Cart State
    const [cart, setCart] = useState(() => {
        try { const local = localStorage.getItem('pos_cart'); return local ? JSON.parse(local) : []; } catch { return []; }
    });

    // Sync State to LocalStorage
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
        localStorage.setItem('pos_customer_name', customerName);
    }, [cart, customerName]);

    // Reset pending order ref jika kasir mengubah cart sebelum retry payment
    // Mencegah payment diproses untuk order lama dengan total yang berbeda
    useEffect(() => {
        pendingOrderRef.current = null;
    }, [cart, customerName]);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    // Canonical payment method values: 'cash' | 'qris' | 'debit' (match backend enum)
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashReceived, setCashReceived] = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

    const [validationError, setValidationError] = useState('');

    // QRIS via Doku (POS)
    // status: idle | creating | pending | paid | failed | expired
    const [qrisStatus, setQrisStatus] = useState('idle');
    const [qrisPaymentUrl, setQrisPaymentUrl] = useState(null);
    const qrisPollRef = useRef(null);

    const stopQrisPolling = () => {
        if (qrisPollRef.current) {
            clearInterval(qrisPollRef.current);
            qrisPollRef.current = null;
        }
    };

    const resetQrisFlow = () => {
        stopQrisPolling();
        setQrisStatus('idle');
        setQrisPaymentUrl(null);
    };

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
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const taxEnabled = settings['tax.enabled'] !== 'false';
    const taxRate = parseFloat(settings['tax.percentage'] || '10') / 100;
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
    const paymentMethodLabel = paymentMethod === 'cash' ? 'Tunai' : paymentMethod === 'qris' ? 'QRIS' : 'Debit';

    const parentCategories = categories.filter(category => !category.parent_id);
    const childCategories = categories.filter(category => category.parent_id === selectedParentId);
    const visibleCategoryIds = getVisibleCategoryIds(categories, selectedParentId, selectedChildId);
    const categoryFilterPredicate = (item) => !visibleCategoryIds || visibleCategoryIds.has(item.categoryId);

    const filteredMenu = fuzzyFilterProducts(menuItems, searchQuery, {
        filterPredicate: categoryFilterPredicate
    });

    const MAX_QTY = 200;
    const MAX_ITEMS = 20;

    // Cart Handlers
    const addToCart = (item) => {
        setValidationError('');
        if (item.stock <= 0) {
            toast.error(`${item.name} sudah habis (Stok: 0).`);
            return;
        }

        const currentInCart = cart.find(i => i.id === item.id);
        const currentQty = currentInCart ? currentInCart.qty : 0;

        if (currentQty + 1 > item.stock) {
            toast.error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock} unit, di keranjang: ${currentQty}).`);
            return;
        }

        // Cek limit sebelum update agar toast tidak dipanggil dari dalam updater (pure fn)
        if (currentInCart && currentInCart.qty >= MAX_QTY) {
            toast.error(`Maksimal ${MAX_QTY} unit per item.`);
            return;
        }
        if (!currentInCart && cart.length >= MAX_ITEMS) {
            toast.error(`Maksimal ${MAX_ITEMS} jenis item per pesanan.`);
            return;
        }

        // Toast dipanggil di sini (luar updater) agar tidak double-fire di StrictMode
        const msg = currentInCart
            ? `+1 ${item.name} ditambahkan`
            : `${item.name} ditambahkan ke keranjang`;
        toast.success(msg, { duration: 1200 });

        setCart(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) {
                if (exists.qty >= MAX_QTY) return prev;
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, { ...item, qty: 1, notes: '' }];
        });
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
        if (!itemToDelete) return;
        const targetId = itemToDelete.id;
        focusSearchAfterDeleteRef.current = true;
        setValidationError('');
        setCart(prev => prev.filter(i => i.id !== targetId));
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

    // Buat order bila belum ada; reuse pendingOrderRef saat retry agar tidak dobel order.
    const ensureOrderCreated = async () => {
        if (pendingOrderRef.current) return pendingOrderRef.current;
        const res = await axios.post('/api/orders', buildOrderData());
        pendingOrderRef.current = res.data?.data;
        return pendingOrderRef.current;
    };

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

        submittingRef.current = true;
        setIsSubmittingOrder(true);

        try {
            // QRIS via Doku: buat order → buat invoice → polling status (di useEffect)
            if (paymentMethod === 'qris') {
                const createdOrder = await ensureOrderCreated();
                setQrisStatus('creating');
                const qrRes = await axios.post('/api/payments/doku-qris', { order_id: createdOrder.id });
                setQrisPaymentUrl(qrRes.data?.data?.payment_url);
                setQrisStatus('pending');
                return;
            }

            // Tunai: order dan pembayaran disimpan bersama, tanpa order menggantung.
            const sale = await axios.post('/api/orders/pos-sale', {
                ...buildOrderData(),
                amount_received: Number(cashReceived),
            });
            const createdOrder = sale.data?.data?.order;
            const payment = sale.data?.data?.payment;
            const serverTotal = Number(createdOrder?.total ?? total);

            pendingOrderRef.current = null; // Reset setelah payment berhasil

            setLastCreatedOrder({
                invoice_number: payment?.invoice_number || createdOrder?.order_number || 'ORD-SUCCESS',
                total_amount: serverTotal,
                cash_received: Number(cashReceived),
                change_amount: Math.max(0, Number(cashReceived) - serverTotal),
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
            // Jika pembuatan invoice Doku gagal, kembali idle agar bisa coba lagi / pindah metode
            if (paymentMethod === 'qris') {
                setQrisStatus(qrisPaymentUrl ? 'failed' : 'idle');
            }
        } finally {
            submittingRef.current = false;
            setIsSubmittingOrder(false);
        }
    };

    // Retry: buat invoice Doku baru untuk order yang sama (invoice lama otomatis di-cancel backend)
    const retryQris = async () => {
        setQrisStatus('creating');
        setQrisPaymentUrl(null);
        await handleProcessOrder();
    };

    // Batal QRIS → pindah ke metode Tunai
    const switchToCash = () => {
        resetQrisFlow();
        setPaymentMethod('cash');
    };

    // Keep ref always pointing to latest handleProcessOrder
    useEffect(() => {
        handleProcessOrderRef.current = handleProcessOrder;
    });

    // Polling status QRIS-Doku saat invoice masih pending
    useEffect(() => {
        if (qrisStatus !== 'pending') return;
        const orderId = pendingOrderRef.current?.id;
        if (!orderId) return;

        stopQrisPolling();
        qrisPollRef.current = setInterval(async () => {
            try {
                const res = await axios.post('/api/payments/doku-qris/check-status', { order_id: orderId });
                const status = res.data?.status;
                if (status === 'paid') {
                    stopQrisPolling();
                    const createdOrder = pendingOrderRef.current;
                    pendingOrderRef.current = null; // Reset setelah payment berhasil
                    setLastCreatedOrder({
                        invoice_number: createdOrder?.order_number || 'ORD-SUCCESS',
                        total_amount: Number(createdOrder?.total ?? total),
                        cash_received: null,
                        change_amount: 0,
                    });
                    setQrisStatus('paid');
                    setIsOrderComplete(true);
                    if (settings['printer.auto_print_receipt'] === 'true') {
                        setTimeout(() => window.print(), 150);
                    }
                } else if (status === 'failed' || status === 'expired') {
                    stopQrisPolling();
                    setQrisStatus(status);
                }
                // 'pending' / 'unknown' / 'unpaid' → lanjut polling
            } catch (err) {
                // Network error: biarkan polling lanjut; akan berhenti saat paid/failed/expired
                console.error('QRIS polling error:', err);
            }
        }, 4000);

        return () => stopQrisPolling();
    }, [qrisStatus]);

    const handleNewOrder = () => {
        resetQrisFlow();
        setCart([]);
        setCustomerName('');
        setSearchQuery('');
        setIsPaymentModalOpen(false);
        setIsOrderComplete(false);
        setCashReceived('');
        setLastCreatedOrder(null);
        setValidationError('');
        pendingOrderRef.current = null;
    };

    // Auto-focus Cash Input when Modal Opens
    useEffect(() => {
        if (isPaymentModalOpen && !isOrderComplete && paymentMethod === 'cash') {
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
            if (itemToDelete) return;

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
    }, [cart, isPaymentModalOpen, isOrderComplete, paymentMethod, cashReceived, total, customerName, isSubmittingOrder, isShortcutModalOpen, searchQuery, filteredMenu, itemToDelete]);
return (
        <AuthenticatedLayout pageTitle="POS Kasir" noPadding={true}>
            <Head title="POS Kasir">
                <meta name="description" content="Sistem kasir POS cepat dan responsif untuk penjualan sparepart, pencetakan struk, dan pembayaran instan." />
            </Head>

            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                {/* LEFT SIDE: Menu & Categories */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {/* Header Controls & Search */}
                    <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-300 dark:border-slate-800 space-y-3 shrink-0 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={2.5} size={16} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama, ukuran, motor, atau SKU (F2 atau /)..."
                                    className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <FiX size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Kategori induk menampilkan seluruh produk subkategorinya */}
                        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                            <div className="flex flex-col gap-1 2xl:flex-row 2xl:items-center 2xl:justify-between">
                                <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                    {categories.length > 0 ? (
                                        <>
                                            <button
                                                onClick={() => { setSelectedParentId(null); setSelectedChildId(null); }}
                                                aria-pressed={!selectedParentId}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border cursor-pointer ${!selectedParentId ? 'bg-primary text-white border-primary shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                All Produk
                                            </button>
                                            {parentCategories.map(category => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => { setSelectedParentId(category.id); setSelectedChildId(null); }}
                                                    aria-pressed={selectedParentId === category.id}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border cursor-pointer ${selectedParentId === category.id ? 'bg-primary text-white border-primary shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">Belum ada kategori</span>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2 self-end">
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline-block">
                                        Total {filteredMenu.length} Produk
                                    </span>
                                    <div className="flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800" role="group" aria-label="Tampilan produk">
                                        {[
                                            { mode: 'list', label: 'Daftar', Icon: FiList },
                                            { mode: 'grid', label: 'Grid', Icon: FiGrid },
                                        ].map(({ mode, label, Icon }) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setViewMode(mode)}
                                                aria-pressed={viewMode === mode}
                                                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${viewMode === mode ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-blue-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                                            >
                                                <Icon size={14} aria-hidden="true" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setIsShortcutModalOpen(true)}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition border border-slate-300 dark:border-slate-700 cursor-pointer"
                                        title="Petunjuk Keyboard Shortcut (F1)"
                                    >
                                        <FiHelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" strokeWidth={2.5} />
                                        <span className="hidden md:inline">Shortcut</span>
                                        <kbd className="px-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded text-[9px] font-mono">F1</kbd>
                                    </button>
                                </div>
                            </div>
                            {selectedParentId && childCategories.length > 0 && (
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="group" aria-label="Subkategori produk">
                                    <button
                                        onClick={() => setSelectedChildId(null)}
                                        aria-pressed={!selectedChildId}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${!selectedChildId ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
                                    >
                                        Semua subkategori
                                    </button>
                                    {childCategories.map(category => (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedChildId(category.id)}
                                            aria-pressed={selectedChildId === category.id}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer ${selectedChildId === category.id ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grid ringkas untuk melihat foto, daftar untuk detail produk */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-3">
                        {isNavigating ? (
                            <PosCardSkeleton count={8} mode={viewMode} />
                        ) : (
                        <div className={`grid gap-2 ${viewMode === 'grid' ? 'grid-cols-[repeat(auto-fill,minmax(144px,1fr))]' : 'grid-cols-1 2xl:grid-cols-2'}`}>
                            {filteredMenu.map(item => {
                                const isOutOfStock = item.stock <= 0;
                                const fitment = viewMode === 'list' ? item.motorcycles.slice(0, 2).map(m => `${m.brand} ${m.model}`).join(', ') : '';
                                return (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        disabled={isOutOfStock}
                                        className={`group flex w-full border bg-white text-left shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900 ${viewMode === 'grid' ? 'flex-col rounded-xl overflow-hidden' : 'items-center gap-3 rounded-xl p-2.5'} ${
                                            isOutOfStock
                                                ? 'cursor-not-allowed border-slate-200 opacity-55 dark:border-slate-800'
                                                : 'cursor-pointer border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className={`${viewMode === 'grid' ? 'aspect-square w-full' : 'h-14 w-14 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700'} overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}>
                                            <ProductPhoto src={item.image} name={item.name} />
                                        </span>
                                        <span className={`block min-w-0 ${viewMode === 'grid' ? 'w-full p-2.5 flex-1' : 'flex-1'}`}>
                                            <span className={`flex gap-1 ${viewMode === 'grid' ? 'flex-col' : 'items-start justify-between gap-3'}`}>
                                                <span className={`min-w-0 font-semibold leading-snug text-slate-900 line-clamp-2 dark:text-white ${viewMode === 'grid' ? 'min-h-8 text-xs' : 'text-sm'}`} title={item.name}>{item.name}</span>
                                                <span className={`shrink-0 whitespace-nowrap font-bold text-slate-900 dark:text-white ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>{formatRp(item.price)}</span>
                                            </span>
                                            {viewMode === 'grid' ? (
                                                <span className={`mt-0.5 block text-[10px] font-semibold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {isOutOfStock ? 'Stok habis' : `Stok ${Math.floor(item.stock)}`}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="mt-1 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span className="min-w-0 truncate">
                                                            {[!selectedChildId ? item.category : null, item.sku ? `SKU ${item.sku}` : null, item.rack_location ? `Rak ${item.rack_location}` : null].filter(Boolean).join(' · ')}
                                                        </span>
                                                        <span className={`shrink-0 font-semibold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {isOutOfStock ? 'Stok habis' : `Stok ${Math.floor(item.stock)}`}
                                                        </span>
                                                    </span>
                                                    {fitment && <span className="mt-0.5 block truncate text-[11px] text-blue-700 dark:text-blue-300" title={`Cocok: ${fitment}`}>
                                                        Cocok: {fitment}{item.motorcycles.length > 2 ? ` +${item.motorcycles.length - 2} motor` : ''}
                                                    </span>}
                                                </>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}

                            {filteredMenu.length === 0 && (
                                <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
                                    <FiTag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" strokeWidth={2} />
                                    <p className="text-xs font-semibold">Tidak ada produk yang cocok</p>
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: Cart & Checkout Panel */}
                <div className="w-full md:w-96 lg:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 flex flex-col h-full overflow-hidden shrink-0 transition-colors">
                    
                    {/* Customer & Order Settings */}
                    <div className="p-3.5 border-b border-slate-300 dark:border-slate-800 space-y-2 bg-slate-50/70 dark:bg-slate-800/70 shrink-0">
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                            <FiShoppingBag className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2.5} /> Penjualan Langsung
                        </div>
                        <div className="flex items-center gap-2">
                            <FiUser className="text-slate-500 dark:text-slate-400 w-4 h-4 shrink-0" strokeWidth={2.5} />
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nama pelanggan (opsional)"
                                aria-label="Nama pelanggan (opsional)"
                                className="text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-200 dark:divide-slate-800 min-h-0">
                        {cart.map(item => (
                            <div key={item.id} className="pt-3 first:pt-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0 pr-1">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white break-words">{item.name}</h4>
                                        {item.qty > 1 && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.qty} × {formatRp(item.price)}</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="whitespace-nowrap text-sm font-extrabold text-slate-900 dark:text-white">{formatRp(item.price * item.qty)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item)}
                                            aria-label={`Hapus ${item.name} dari keranjang`}
                                            title="Hapus produk"
                                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                        >
                                            <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between mt-2.5 gap-2">
                                    <details className="min-w-0 flex-1">
                                        <summary className="block cursor-pointer truncate text-xs font-medium text-blue-700 hover:underline dark:text-blue-300" title={item.notes || 'Tambah catatan untuk produk ini'}>
                                            {item.notes ? `Catatan: ${item.notes}` : '+ Catatan'}
                                        </summary>
                                        <input
                                            type="text"
                                            placeholder="Catatan produk..."
                                            value={item.notes || ''}
                                            onChange={(e) => updateNotes(item.id, e.target.value)}
                                            aria-label={`Catatan untuk ${item.name}`}
                                            className="mt-2 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-slate-700 dark:text-slate-200"
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
                                            className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        ))}

                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 mb-2.5 border border-slate-200 dark:border-slate-700">
                                    <FiShoppingBag className="w-8 h-8 text-slate-400 dark:text-slate-500" strokeWidth={2} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Keranjang Masih Kosong</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pilih produk di sebelah kiri</p>
                            </div>
                        )}
                    </div>

                    {/* Summary & Checkout Button */}
                    <div className="border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                        <div className="p-4 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRp(subtotal)}</span>
                            </div>
                            {taxEnabled && (
                                <div className="flex justify-between">
                                    <span>Pajak ({settings['tax.percentage'] || '10'}%)</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRp(tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-base text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-slate-800 items-baseline">
                                <span>Total Bayar</span>
                                <span className="text-primary dark:text-accentYellow font-mono text-xl">{formatRp(total)}</span>
                            </div>
                        </div>

                        {validationError && (
                            <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
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
                            className="w-full py-4 bg-accentYellow hover:bg-yellow-300 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-primaryDark font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2.5 rounded-none border-t border-yellow-400 dark:border-slate-800 px-4 group cursor-pointer"
                        >
                            <FiCreditCard className="w-5 h-5" strokeWidth={2.5} />
                            <span>Proses Pembayaran ({formatRp(total)})</span>
                            <kbd className="ml-auto px-1.5 py-0.5 bg-primaryDark text-white rounded text-[10px] font-mono font-bold group-disabled:hidden">F8</kbd>
                        </button>
                    </div>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isSubmittingOrder && !isOrderComplete) {
                            resetQrisFlow();
                            setIsPaymentModalOpen(false);
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        role="dialog"
                        aria-modal="true"
                    >
                        {!isOrderComplete ? (
                            <>
                                {/* Header */}
                                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/60">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <FiCreditCard className="w-4 h-4" strokeWidth={2.2} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pembayaran Pesanan</h3>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                {cart.length} item · {customerName ? customerName : 'Pelanggan Langsung'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        disabled={isSubmittingOrder}
                                        onClick={() => { resetQrisFlow(); setIsPaymentModalOpen(false); }}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
                                    >
                                        <FiX className="w-4 h-4" strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Total Tagihan Hero */}
                                <div className="px-5 py-4 text-center border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-800/40 dark:to-slate-900">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Total Tagihan
                                    </span>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 font-mono">
                                        {formatRp(total)}
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* Payment Method Tabs */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                            Metode Pembayaran
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { resetQrisFlow(); setPaymentMethod('cash'); }}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                                    paymentMethod === 'cash'
                                                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                                                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <FiDollarSign className="w-4 h-4" />
                                                <span>Tunai (Cash)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('qris')}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                                    paymentMethod === 'qris'
                                                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                                                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <FiSmartphone className="w-4 h-4" />
                                                <span>QRIS (Doku)</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cash Section */}
                                    {paymentMethod === 'cash' && (
                                        <div className="space-y-3 pt-1">
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        Uang Diterima
                                                    </label>
                                                    {cashShortfall > 0 && Number(cashReceived) > 0 && (
                                                        <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                                                            Kurang {formatRp(cashShortfall)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="relative flex items-center">
                                                    <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 font-bold text-base select-none pointer-events-none">
                                                        Rp
                                                    </span>
                                                    <input
                                                        ref={cashInputRef}
                                                        type="number"
                                                        placeholder="0"
                                                        value={cashReceived}
                                                        onChange={(e) => setCashReceived(e.target.value)}
                                                        className="w-full pl-11 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    {cashReceived && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCashReceived('')}
                                                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition cursor-pointer"
                                                        >
                                                            <FiX className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick Cash Chips */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                                    <span>Pilihan Nominal Cepat</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Alt+U = Uang Pas</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {quickCashOptions.map((amt, idx) => {
                                                        const isExact = amt === total;
                                                        const isSelected = Number(cashReceived) === amt;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setCashReceived(amt.toString())}
                                                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition cursor-pointer text-center truncate ${
                                                                    isSelected
                                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                                        : isExact
                                                                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                }`}
                                                            >
                                                                {isExact ? 'Uang Pas' : formatRp(amt).replace('Rp ', '')}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Live Change Amount Box */}
                                            {Number(cashReceived) > 0 && (
                                                <div className={`p-3 rounded-xl border transition-all ${
                                                    cashShortfall > 0
                                                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
                                                        : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50'
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-bold ${cashShortfall > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                                                            {cashShortfall > 0 ? 'Uang Masih Kurang' : 'Kembalian'}
                                                        </span>
                                                        <span className={`font-mono font-black text-lg ${cashShortfall > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            {formatRp(cashShortfall > 0 ? cashShortfall : changeAmount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* QRIS via Doku */}
                                    {paymentMethod === 'qris' && (
                                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                                            {qrisStatus === 'creating' && (
                                                <div className="py-6 flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Menyiapkan pembayaran QRIS Doku...</p>
                                                </div>
                                            )}

                                            {qrisStatus === 'pending' && qrisPaymentUrl && (
                                                <>
                                                    <div className="w-36 h-36 mx-auto rounded-xl bg-white p-2 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center">
                                                        <QRCodeSVG value={qrisPaymentUrl} size={130} level="M" marginSize={1} />
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Scan QR di atas untuk menyelesaikan pembayaran</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                                        <div className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                        <span>Menunggu verifikasi pembayaran...</span>
                                                    </div>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={switchToCash}
                                                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                                                        >
                                                            Batal & Beralih ke Tunai
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {(qrisStatus === 'failed' || qrisStatus === 'expired') && (
                                                <div className="space-y-2 py-2">
                                                    <p className={`text-xs font-bold ${qrisStatus === 'expired' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {qrisStatus === 'expired' ? 'Pembayaran QRIS kedaluwarsa.' : 'Pembayaran QRIS gagal diproses.'}
                                                    </p>
                                                    <div className="flex gap-2 justify-center pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={retryQris}
                                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                                        >
                                                            Coba Lagi
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={switchToCash}
                                                            className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                                                        >
                                                            Bayar Tunai
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {qrisStatus === 'idle' && (
                                                <div className="py-2 space-y-1 text-center">
                                                    <FiSmartphone className="w-7 h-7 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pembayaran Non-Tunai QRIS</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Klik tombol konfirmasi di bawah untuk membuat kode QR Doku resmi.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        type="button"
                                        onClick={handleProcessOrder}
                                        disabled={
                                            isSubmittingOrder ||
                                            (paymentMethod === 'cash' && (!cashReceived || cashShortfall > 0)) ||
                                            (paymentMethod === 'qris' && (qrisStatus === 'creating' || qrisStatus === 'pending'))
                                        }
                                        className="w-full py-3.5 px-4 bg-primary hover:bg-primaryDark disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <FiCheck className="w-4 h-4" strokeWidth={2.5} />
                                        <span>
                                            {paymentMethod === 'qris'
                                                ? (qrisStatus === 'creating' || qrisStatus === 'pending')
                                                    ? 'Menunggu Pembayaran...'
                                                    : 'Buat Pembayaran QRIS'
                                                : (isSubmittingOrder ? 'Memproses Transaksi...' : `Selesaikan Pembayaran (${formatRp(total)})`)}
                                        </span>
                                        <kbd className="ml-auto px-1.5 py-0.5 bg-primaryDark text-white rounded text-[10px] font-mono font-bold group-disabled:hidden">
                                            Enter
                                        </kbd>
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* ORDER COMPLETE SUCCESS SCREEN */
                            <div className="p-6 text-center space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                                    <FiCheck className="w-7 h-7" strokeWidth={2.5} />
                                </div>

                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Transaksi Berhasil!</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        No. Invoice: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{lastCreatedOrder?.invoice_number}</span>
                                    </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Metode:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{paymentMethodLabel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Total Tagihan:</span>
                                        <span className="font-bold text-slate-900 dark:text-white font-mono">{formatRp(lastCreatedOrder?.total_amount || total)}</span>
                                    </div>
                                    {paymentMethod === 'cash' && lastCreatedOrder?.cash_received != null && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-slate-400">Uang Diterima:</span>
                                                <span className="font-bold text-slate-900 dark:text-white font-mono">{formatRp(lastCreatedOrder.cash_received)}</span>
                                            </div>
                                            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-sm">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Kembalian:</span>
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatRp(lastCreatedOrder.change_amount)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="flex-1 py-3 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <FiPrinter className="w-4 h-4" />
                                        <span>Cetak Struk</span>
                                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono">P</kbd>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNewOrder}
                                        className="flex-1 py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <FiPlus className="w-4 h-4" strokeWidth={2.5} />
                                        <span>Transaksi Baru</span>
                                        <kbd className="px-1.5 py-0.5 bg-blue-700 text-blue-100 rounded text-[9px] font-mono">Enter</kbd>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* KEYBOARD SHORTCUT HELPER MODAL */}
            {isShortcutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <div className="flex items-center gap-2">
                                <FiHelpCircle className="w-4 h-4 text-blue-600 dark:text-yellow-400" strokeWidth={2.5} />
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Petunjuk Keyboard Shortcut POS</h3>
                            </div>
                            <button onClick={() => setIsShortcutModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                <FiX className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="p-4 space-y-2 text-xs">
                            {[
                                { key: 'F2 atau /', desc: 'Fokus langsung ke pencarian produk' },
                                { key: 'F8 / Ctrl+Enter', desc: 'Buka modal proses pembayaran' },
                                { key: '1', desc: 'Pilih pembayaran tunai' },
                                { key: 'Alt + U', desc: 'Otomatis isi nominal Uang Pas' },
                                { key: 'Enter', desc: 'Konfirmasi bayar / Transaksi baru' },
                                { key: 'P', desc: 'Cetak struk pembayaran' },
                                { key: 'Esc', desc: 'Tutup modal / hapus teks pencarian' },
                                { key: 'F1', desc: 'Buka / tutup panduan shortcut ini' },
                            ].map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{s.desc}</span>
                                    <kbd className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded font-mono font-bold shadow-2xs">
                                        {s.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center">
                            <button
                                onClick={() => setIsShortcutModalOpen(false)}
                                className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                                Mengerti (Esc)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                show={Boolean(itemToDelete)}
                maxWidth="sm"
                onClose={() => setItemToDelete(null)}
                afterLeave={() => {
                    if (focusSearchAfterDeleteRef.current) {
                        focusSearchAfterDeleteRef.current = false;
                        searchInputRef.current?.focus();
                    }
                }}
            >
                <div className="p-5">
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                        Hapus produk dari keranjang?
                    </DialogTitle>
                    <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
                        {itemToDelete?.name}
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
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>

            {/* THERMAL PRINTABLE RECEIPT TEMPLATE (Targeted by @media print) */}
            <div id="thermal-printable-receipt" className="hidden">
                <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                    <h2 className="font-bold text-sm uppercase tracking-wider">{settings['store.name'] || 'MOTORKU'}</h2>
                    <p className="text-[10px]">{settings['store.name'] || 'Motorku'}</p>
                    {settings['store.address'] && <p className="text-[9px]">{settings['store.address']}</p>}
                    {settings['store.phone'] && <p className="text-[9px]">Telp: {settings['store.phone']}</p>}
                </div>

                <div className="py-1 border-b border-dashed border-black text-[10px] space-y-0.5 mb-2">
                    <div className="flex justify-between">
                        <span>No. Struk:</span>
                        <span className="font-bold">{lastCreatedOrder?.invoice_number || 'ORD-POS'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Waktu:</span>
                        <span>{new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pelanggan:</span>
                        <span className="font-bold">{customerName || 'Walk-in Guest'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tipe Order:</span>
                        <span>Ambil di Toko</span>
                    </div>
                </div>

                {/* ITEMS LIST */}
                <div className="py-1 border-b border-dashed border-black text-[10px] mb-2">
                    <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
                        <span>Item</span>
                        <span>Total</span>
                    </div>
                    {cart.map((item, idx) => (
                        <div key={idx} className="mb-1">
                            <div className="flex justify-between font-bold">
                                <span>{item.name} x{item.qty}</span>
                                <span>{formatRp(item.price * item.qty)}</span>
                            </div>
                            <div className="text-[9px] text-gray-600 pl-1">
                                @ {formatRp(item.price)} {item.notes ? `(${item.notes})` : ''}
                            </div>
                        </div>
                    ))}
                </div>

                {/* FINANCIAL TOTALS */}
                <div className="py-1 border-b border-dashed border-black text-[10px] space-y-0.5 mb-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatRp(subtotal)}</span>
                    </div>
                    {tax > 0 && (
                        <div className="flex justify-between">
                            <span>Pajak ({settings['tax.percentage'] || '10'}%)</span>
                            <span>{formatRp(tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-[12px] pt-1 border-t border-black">
                        <span>TOTAL TAGIHAN</span>
                        <span>{formatRp(total)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span>Metode Bayar:</span>
                        <span className="font-bold">{paymentMethod}</span>
                    </div>
                    {paymentMethod === 'cash' && lastCreatedOrder?.cash_received != null && (
                        <>
                            <div className="flex justify-between">
                                <span>Uang Diterima:</span>
                                <span>{formatRp(lastCreatedOrder.cash_received)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Kembalian:</span>
                                <span>{formatRp(lastCreatedOrder.change_amount)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="pt-2 text-center text-[9px] space-y-0.5">
                    <p className="font-bold">*** TERIMA KASIH ***</p>
                    <p>Semoga Kendaraan Anda Makin Awet</p>
                    <p>Simpan Struk Ini Sebagai Bukti Pembayaran</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
