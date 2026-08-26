import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { getProductImage } from '@/Utils/productImage';
import axios from 'axios';
import { toast } from 'sonner';
import {
    FiSearch,
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

export default function POSIndex({ initialProducts = [], initialCategories = [], settings = {} }) {
    // Format Products from Database or Fallback
    const formatProducts = (rawProducts) => {
        if (!rawProducts || rawProducts.length === 0) return [];
        return rawProducts.map(p => {
            const catName = p.category ? p.category.name : 'Sparepart';
            return {
                id: p.id,
                sku: p.sku || '',
                name: p.name,
                description: p.description || '',
                price: Number(p.price),
                category: catName,
                stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
                image: getProductImage(p.image_path, catName),
                motorcycles: p.motorcycles || []
            };
        });
    };


    // Format Categories
    const formatCategories = (rawCats) => {
        if (!rawCats || rawCats.length === 0) return ['All Produk'];
        return ['All Produk', ...rawCats.map(c => c.name)];
    };

    const [menuItems, setMenuItems] = useState(formatProducts(initialProducts));
    const [categories, setCategories] = useState(formatCategories(initialCategories));

    useEffect(() => {
        if (initialProducts && initialProducts.length > 0) setMenuItems(formatProducts(initialProducts));
        if (initialCategories && initialCategories.length > 0) setCategories(formatCategories(initialCategories));
    }, [initialProducts, initialCategories]);

    // Refs
    const searchInputRef = useRef(null);
    const cashInputRef = useRef(null);
    const pendingOrderRef = useRef(null);
    const handleProcessOrderRef = useRef(null);

    // State
    const [selectedCategory, setSelectedCategory] = useState('All Produk');
    const [searchQuery, setSearchQuery] = useState('');
    const [customerName, setCustomerName] = useState(() => localStorage.getItem('pos_customer_name') || '');

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

    // Label display yang ramah user, terpisah dari nilai canonical state
    const paymentMethodLabel = paymentMethod === 'cash' ? 'Tunai' : paymentMethod === 'qris' ? 'QRIS' : 'Debit';

    // Filter Logic
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
            toast.error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock} porsi, di keranjang: ${currentQty}).`);
            return;
        }

        // Cek limit sebelum update agar toast tidak dipanggil dari dalam updater (pure fn)
        if (currentInCart && currentInCart.qty >= MAX_QTY) {
            toast.error(`Maksimal ${MAX_QTY} porsi per item.`);
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
                return newQty > 0 ? { ...item, qty: newQty } : null;
            }
            return item;
        }).filter(Boolean));
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

    const removeFromCart = (id) => {
        setValidationError('');
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const updateNotes = (id, notes) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
    };

    // Handle Order Submission
    const buildOrderData = () => ({
        customer_name: customerName.trim(),
        order_type: 'take_away', // Toko sparepart: semua penjualan = ambil di toko
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
        if (isSubmittingOrder) return;
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

            // Cash / Debit: buat order → proses pembayaran langsung
            const createdOrder = await ensureOrderCreated();
            const method = paymentMethod; // sudah canonical (cash|qris|debit)
            const serverTotal = Number(createdOrder?.total ?? total);

            const payment = await axios.post('/api/payments', {
                order_id: createdOrder.id,
                payment_method: method,
                amount_received: method === 'cash' ? Number(cashReceived) : serverTotal,
                notes: `POS - ${paymentMethodLabel}`,
            });

            pendingOrderRef.current = null; // Reset setelah payment berhasil

            setLastCreatedOrder({
                invoice_number: payment.data?.data?.invoice_number || createdOrder?.order_number || 'ORD-SUCCESS',
                total_amount: serverTotal,
                cash_received: method === 'cash' ? Number(cashReceived) : null,
                change_amount: method === 'cash' ? Math.max(0, Number(cashReceived) - serverTotal) : 0,
            });
            setIsOrderComplete(true);

            if (settings['restaurant.auto_print_receipt'] === 'true') {
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
                    if (settings['restaurant.auto_print_receipt'] === 'true') {
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
                // 2 / Alt+2: Select QRIS
                if (e.key === '2' && (e.altKey || document.activeElement !== cashInputRef.current)) {
                    e.preventDefault();
                    resetQrisFlow();
                    setPaymentMethod('qris');
                    return;
                }
                // 3 / Alt+3: Select Card
                if (e.key === '3' && (e.altKey || document.activeElement !== cashInputRef.current)) {
                    e.preventDefault();
                    resetQrisFlow();
                    setPaymentMethod('debit');
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
    }, [cart, isPaymentModalOpen, isOrderComplete, paymentMethod, cashReceived, total, customerName, isSubmittingOrder, isShortcutModalOpen, searchQuery]);
return (
        <AuthenticatedLayout pageTitle="POS Kasir" noPadding={true}>
            <Head title="POS Kasir - Toko Sparepart">
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
                                    placeholder="Cari nama menu atau SKU (Tekan F2 atau /)..."
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

                        {/* Category Filter Pills */}
                        <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                                            selectedCategory === cat
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline-block">
                                    Total {filteredMenu.length} Menu
                                </span>
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
                    </div>

                    {/* Menu Items Grid */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {filteredMenu.map(item => {
                                const isOutOfStock = item.stock <= 0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => !isOutOfStock && addToCart(item)}
                                        className={`bg-white dark:bg-slate-900 border rounded-xl shadow-xs transition-all duration-150 flex flex-col justify-between group overflow-hidden ${
                                            isOutOfStock 
                                                ? 'opacity-50 grayscale cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' 
                                                : 'border-slate-300 dark:border-slate-800 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer active:scale-95 active:border-blue-600'
                                        }`}
                                    >
                                        <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border-b border-slate-200 dark:border-slate-800">
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className={`w-full h-full object-cover transition duration-300 ${!isOutOfStock ? 'group-hover:scale-105' : ''}`}
                                            />
                                            {isOutOfStock ? (
                                                <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow-xs">
                                                    Stok Habis
                                                </span>
                                            ) : (
                                                <span className="absolute top-2 right-2 bg-slate-900/85 text-white text-[10px] px-2 py-0.5 rounded-md font-mono font-bold shadow-xs">
                                                    Stok: {Math.floor(item.stock)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                                            <div className="flex-1 min-w-0 mb-2">
                                                <h3 className={`font-bold text-xs line-clamp-2 sm:line-clamp-3 leading-snug transition ${isOutOfStock ? 'text-slate-500' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-yellow-400'}`}>
                                                    {item.name}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-tight mt-0.5">{item.category}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                                                <span className="font-bold text-slate-900 dark:text-white text-xs">{formatRp(item.price)}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isOutOfStock) addToCart(item);
                                                    }}
                                                    disabled={isOutOfStock}
                                                    className={`p-1.5 rounded-md transition shadow-xs cursor-pointer ${
                                                        isOutOfStock 
                                                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 opacity-40 cursor-not-allowed' 
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                >
                                                    <FiPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredMenu.length === 0 && (
                                <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
                                    <FiTag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" strokeWidth={2} />
                                    <p className="text-xs font-semibold">Tidak ada menu yang cocok</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Cart & Checkout Panel */}
                <div className="w-full md:w-96 lg:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 flex flex-col h-full overflow-hidden shrink-0 transition-colors">
                    
                    {/* Customer & Order Settings */}
                    <div className="p-3.5 border-b border-slate-300 dark:border-slate-800 space-y-2 bg-slate-50/70 dark:bg-slate-800/70 shrink-0 h-[106px] flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <FiUser className="text-slate-500 dark:text-slate-400 w-4 h-4 shrink-0" strokeWidth={2.5} />
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Nama pelanggan..."
                                    className="text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            {/* Order type badge (toko sparepart: ambil di toko) */}
                            <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 font-bold gap-2 bg-yellow-50 dark:bg-yellow-950/60 border border-yellow-200 dark:border-yellow-700 px-2.5 py-1 rounded-lg shrink-0">
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                                <span>Ambil di Toko</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm h-8">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                                <FiShoppingBag className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2.5} /> Penjualan Langsung
                            </span>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-200 dark:divide-slate-800 min-h-0">
                        {cart.map(item => (
                            <div key={item.id} className="pt-3 first:pt-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatRp(item.price)}</span>
                                    </div>
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRp(item.price * item.qty)}</span>
                                </div>

                                <div className="flex items-center justify-between mt-2.5 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Catatan..."
                                        value={item.notes || ''}
                                        onChange={(e) => updateNotes(item.id, e.target.value)}
                                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 flex-1 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-slate-700 dark:text-slate-200"
                                    />

                                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shrink-0 border border-slate-300 dark:border-slate-700">
                                        <button
                                            onClick={() => updateQty(item.id, -1)}
                                            className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                        >
                                            <FiMinus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.stock || 999}
                                            value={item.qty}
                                            onChange={(e) => setQtyDirect(item.id, e.target.value)}
                                            className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 py-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => updateQty(item.id, 1)}
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
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Klik menu di sebelah kiri untuk memilih pesanan</p>
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
                            <div className="flex justify-between">
                                <span>Pajak ({settings['tax.percentage'] || '10'}%)</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRp(tax)}</span>
                            </div>
                            <div className="flex justify-between font-black text-base text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-slate-800 items-baseline">
                                <span>Total Bayar</span>
                                <span className="text-blue-600 dark:text-yellow-400 font-mono text-xl">{formatRp(total)}</span>
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
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2.5 rounded-none border-t border-blue-700 dark:border-slate-800 px-4 group cursor-pointer"
                        >
                            <FiCreditCard className="w-5 h-5" strokeWidth={2.5} />
                            <span>Proses Pembayaran ({formatRp(total)})</span>
                            <kbd className="ml-auto px-1.5 py-0.5 bg-blue-700 dark:bg-blue-800 text-blue-100 rounded text-[10px] font-mono font-bold group-disabled:hidden">F8</kbd>
                        </button>
                    </div>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                        
                        {!isOrderComplete ? (
                            <>
                                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pembayaran Pesanan</h3>
                                    <button onClick={() => { resetQrisFlow(); setIsPaymentModalOpen(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                        <FiX className="w-5 h-5" strokeWidth={2.5} />
                                    </button>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/60 p-4 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                                        <p className="text-blue-600 dark:text-yellow-400 font-bold text-xs mb-0.5">TOTAL TAGIHAN</p>
                                        <h3 className="text-2xl font-black text-blue-600 dark:text-yellow-400">{formatRp(total)}</h3>
                                    </div>

                                    {/* Payment Method Selector */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Metode Pembayaran</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { resetQrisFlow(); setPaymentMethod('cash'); }}
                                                className={`py-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition relative cursor-pointer ${
                                                    paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-yellow-400' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                <span className="absolute top-1 right-1 text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1 rounded font-mono font-bold">1</span>
                                                <FiDollarSign className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">Tunai / Cash</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { resetQrisFlow(); setPaymentMethod('qris'); }}
                                                className={`py-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition relative cursor-pointer ${
                                                    paymentMethod === 'qris' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-yellow-400' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                <span className="absolute top-1 right-1 text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1 rounded font-mono font-bold">2</span>
                                                <FiSmartphone className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">QRIS / E-Wallet</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { resetQrisFlow(); setPaymentMethod('debit'); }}
                                                className={`py-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition relative cursor-pointer ${
                                                    paymentMethod === 'debit' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-yellow-400' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                <span className="absolute top-1 right-1 text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1 rounded font-mono font-bold">3</span>
                                                <FiCreditCard className="w-5 h-5" />
                                                <span className="text-[10px] font-bold">Debit / Card</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cash Input */}
                                    <div className="space-y-4 pb-1">
                                        {paymentMethod === 'cash' && (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Uang Diterima (Rp)</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCashReceived(total.toString())}
                                                        className="text-[10px] font-bold text-blue-600 dark:text-yellow-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Uang Pas ({formatRp(total)})</span>
                                                        <kbd className="text-[9px] bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded px-1 font-mono">Alt+U</kbd>
                                                    </button>
                                                </div>
                                                <input
                                                    ref={cashInputRef}
                                                    type="number"
                                                    placeholder="Contoh: 50000"
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                />
                                                {Number(cashReceived) > 0 && (
                                                    cashShortfall > 0 ? (
                                                        <div className="flex justify-between text-xs pt-1">
                                                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Kurang:</span>
                                                            <span className="font-black font-mono text-sm text-rose-600 dark:text-rose-400">
                                                                {formatRp(cashShortfall)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between text-xs pt-1">
                                                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Kembalian:</span>
                                                            <span className="font-black font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                                                {formatRp(changeAmount)}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* QRIS via Doku */}
                                        {paymentMethod === 'qris' && (
                                            <div className="text-center p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700">
                                                {qrisStatus === 'creating' && (
                                                    <div className="py-4 flex flex-col items-center gap-2">
                                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">Menyiapkan pembayaran QRIS...</p>
                                                    </div>
                                                )}

                                                {qrisStatus === 'pending' && qrisPaymentUrl && (
                                                    <>
                                                        <div className="w-32 h-32 mx-auto rounded bg-white p-1.5 border border-slate-300 dark:border-slate-600 shadow-inner">
                                                            <QRCodeSVG value={qrisPaymentUrl} size={120} level="M" marginSize={1} />
                                                        </div>
                                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 font-semibold">Minta pelanggan scan QR lalu bayar di halaman Doku.</p>
                                                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-yellow-400 mt-1.5">
                                                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                            <span>Menunggu pembayaran...</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={switchToCash}
                                                            className="mt-2 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                                                        >
                                                            Batal & Bayar Tunai
                                                        </button>
                                                    </>
                                                )}

                                                {(qrisStatus === 'failed' || qrisStatus === 'expired') && (
                                                    <div className="space-y-2">
                                                        <p className={`text-[11px] font-bold ${qrisStatus === 'expired' ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {qrisStatus === 'expired' ? 'Pembayaran kedaluwarsa.' : 'Pembayaran gagal.'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Silakan coba lagi atau gunakan metode lain.</p>
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={retryQris}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                                            >
                                                                Coba Lagi
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={switchToCash}
                                                                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
                                                            >
                                                                Bayar Tunai
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {qrisStatus === 'idle' && (
                                                    <div className="flex items-start gap-2 text-left">
                                                        <FiAlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                                                            Customer membayar melalui QRIS Doku.{' '}
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">Klik "Buat Pembayaran QRIS"</span> untuk memulai.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleProcessOrder}
                                            disabled={isSubmittingOrder || (paymentMethod === 'qris' && (qrisStatus === 'creating' || qrisStatus === 'pending'))}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5 group cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            <FiCheck className="w-4 h-4" strokeWidth={2.5} />
                                            <span>
                                                {paymentMethod === 'qris'
                                                    ? (qrisStatus === 'creating' || qrisStatus === 'pending')
                                                        ? 'Menunggu Pembayaran...'
                                                        : 'Buat Pembayaran QRIS'
                                                    : (isSubmittingOrder ? 'Memproses Transaksi...' : 'Konfirmasi Selesai Pembayaran')}
                                            </span>
                                            <kbd className="ml-auto px-1.5 py-0.5 bg-emerald-700 text-emerald-100 rounded text-[10px] font-mono font-bold group-disabled:hidden">Enter</kbd>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* ORDER COMPLETE SUCCESS SCREEN */
                            <div className="p-5 text-center space-y-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                                    <FiCheck className="w-6 h-6" strokeWidth={2.5} />
                                </div>

                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Transaksi Berhasil!</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        No. Invoice: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{lastCreatedOrder?.invoice_number}</span>
                                    </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 text-left text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Metode:</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Total Tagihan:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{formatRp(total)}</span>
                                    </div>
                                    {paymentMethod === 'cash' && lastCreatedOrder?.cash_received != null && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-slate-400">Uang Diterima:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{formatRp(lastCreatedOrder.cash_received)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-slate-400">Kembalian:</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRp(lastCreatedOrder.change_amount)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex space-x-2 pt-1">
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <FiPrinter className="w-4 h-4" strokeWidth={2.5} />
                                        <span>Cetak Struk</span>
                                        <kbd className="px-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono ml-0.5">P</kbd>
                                    </button>
                                    <button
                                        onClick={handleNewOrder}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <span>Transaksi Baru</span>
                                        <kbd className="px-1 bg-blue-700 text-blue-100 rounded text-[9px] font-mono ml-0.5">Enter</kbd>
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
                                { key: '1 / 2 / 3', desc: 'Pilih metode bayar (Tunai / QRIS / Card)' },
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

            {/* THERMAL PRINTABLE RECEIPT TEMPLATE (Targeted by @media print) */}
            <div id="thermal-printable-receipt" className="hidden">
                <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                    <h2 className="font-bold text-sm uppercase tracking-wider">{settings['restaurant.name'] || 'TOKO SPAREPART'}</h2>
                    <p className="text-[10px]">Toko Sparepart</p>
                    {settings['restaurant.address'] && <p className="text-[9px]">{settings['restaurant.address']}</p>}
                    {settings['restaurant.phone'] && <p className="text-[9px]">Telp: {settings['restaurant.phone']}</p>}
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
                    <p>Selamat Menikmati Hidangan Kami</p>
                    <p>Simpan Struk Ini Sebagai Bukti Pembayaran</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
