import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import axios from 'axios';
import {
    FiCheck,
    FiClock,
    FiCoffee,
    FiPackage,
    FiCheckCircle,
    FiXCircle,
    FiMapPin,
    FiUser,
    FiShoppingBag,
    FiArrowRight,
    FiFileText,
    FiAlertCircle,
    FiAlertTriangle
} from 'react-icons/fi';

const HISTORY_KEY = 'mie_amour_orders_history';
const ORDER_KEY = 'mie_amour_current_order';
const PAYMENT_KEY = 'mie_amour_order_for_payment';
const POLL_INTERVAL = 5000;

const STATUS_STEPS = [
    { key: 'pending', label: 'Diterima', icon: FiClock, color: 'yellow' },
    { key: 'preparing', label: 'Diproses', icon: FiCoffee, color: 'blue' },
    { key: 'ready', label: 'Siap Diambil', icon: FiPackage, color: 'emerald' },
    { key: 'completed', label: 'Selesai', icon: FiCheckCircle, color: 'green' },
];

const STATUS_INDEX = {
    pending: 0,
    preparing: 1,
    ready: 2,
    completed: 3,
    cancelled: -1,
};

export default function OrderStatus() {
    useForceLightTheme();
    const [ordersList, setOrdersList] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [sessionError, setSessionError] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [targetOrderToCancel, setTargetOrderToCancel] = useState(null);

    const openCancelModal = (targetOrder) => {
        setCancelError(null);
        setTargetOrderToCancel(targetOrder);
        setShowCancelModal(true);
    };

    const handleConfirmCancelOrder = async () => {
        if (!targetOrderToCancel || !targetOrderToCancel.order_id || !targetOrderToCancel.customer_token) return;

        setIsCancelling(true);
        setCancelError(null);

        try {
            const res = await axios.post(`/api/customer/order/${targetOrderToCancel.order_id}/cancel`, {
                customer_token: targetOrderToCancel.customer_token,
            });

            const updatedStatus = res.data?.data?.order_status || 'cancelled';

            const updatedList = ordersList.map(o => o.order_id === targetOrderToCancel.order_id ? { ...o, order_status: updatedStatus } : o);
            setOrdersList(updatedList);
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedList));
            } catch {}

            setShowCancelModal(false);
            setTargetOrderToCancel(null);
        } catch (err) {
            setCancelError(err.response?.data?.message || 'Gagal membatalkan pesanan.');
        } finally {
            setIsCancelling(false);
        }
    };

    // Initial load: parse orders history array
    useEffect(() => {
        let list = [];
        try {
            const rawHistory = localStorage.getItem(HISTORY_KEY);
            if (rawHistory) {
                const parsed = JSON.parse(rawHistory);
                if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
            }
        } catch {}

        if (list.length === 0) {
            try {
                const rawSingle = localStorage.getItem(ORDER_KEY) || localStorage.getItem(PAYMENT_KEY);
                if (rawSingle) {
                    const single = JSON.parse(rawSingle);
                    if (single && single.order_id) list = [single];
                }
            } catch {}
        }

        if (list.length === 0) {
            router.visit('/');
            return;
        }

        setOrdersList(list);
        setSelectedIndex(list.length - 1); // Default select newest order
    }, []);

    // Periodic polling for all orders in list
    useEffect(() => {
        if (ordersList.length === 0) return;
        let pollInterval = null;

        const pollAllOrders = async () => {
            let updatedList = [...ordersList];
            let hasChanges = false;

            for (let i = 0; i < updatedList.length; i++) {
                const ord = updatedList[i];
                if (!ord || ord.order_status === 'completed' || ord.order_status === 'cancelled') continue;

                try {
                    const res = await axios.get(`/api/customer/order/${ord.order_id}/status`, {
                        params: { customer_token: ord.customer_token, t: Date.now() }
                    });
                    const latest = res.data?.data;
                    if (!latest?.order_status) continue;

                    const nextInfo = {
                        ...ord,
                        order_status: latest.order_status,
                        payment_status: latest.payment_status,
                        order_type: latest.order_type || ord.order_type,
                        total: latest.total,
                        subtotal: latest.subtotal,
                        tax_amount: latest.tax_amount,
                        discount_amount: latest.discount_amount,
                        items: latest.items,
                        customer_name: latest.customer_name || ord.customer_name,
                        table_name: 'Ambil di Toko',
                        ordered_at: latest.ordered_at || ord.ordered_at,
                    };

                    updatedList[i] = nextInfo;
                    hasChanges = true;
                } catch (err) {
                    if (err.response?.status === 404 || err.response?.status === 401) {
                        updatedList.splice(i, 1);
                        i--;
                        hasChanges = true;
                    }
                }
            }

            if (updatedList.length === 0) {
                try {
                    localStorage.removeItem(HISTORY_KEY);
                    localStorage.removeItem(PAYMENT_KEY);
                    localStorage.removeItem(ORDER_KEY);
                    // 'mie_amour_order_for_payment' juga dipakai di Qris.jsx
                    localStorage.removeItem('mie_amour_order_for_payment');
                } catch {}
                router.visit('/');
                return;
            }

            if (hasChanges) {
                setOrdersList(updatedList);
                if (selectedIndex >= updatedList.length) {
                    setSelectedIndex(Math.max(0, updatedList.length - 1));
                }
                try {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedList));
                } catch {}
            }
        };

        pollAllOrders();
        pollInterval = setInterval(pollAllOrders, POLL_INTERVAL);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [ordersList.length]);

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

    if (sessionError) {
        return (
            <div className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center items-center p-4 min-h-screen">
                <Head title="Sesi Berakhir - Toko Sparepart">
                    <meta name="description" content="Sesi pesanan telah berakhir. Silakan melakukan pemesanan baru." />
                </Head>
                <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl text-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto">
                        <FiXCircle size={32} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Sesi Berakhir</h2>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{sessionError}</p>
                    <Link
                        href="/"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors block"
                    >
                        Kembali ke Beranda / Scan QR
                    </Link>
                </div>
            </div>
        );
    }

    if (ordersList.length === 0) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-slate-400 text-xs">Memuat status pesanan...</div>
            </div>
        );
    }

    const orderInfo = ordersList[selectedIndex] || ordersList[0];
    const currentStatus = orderInfo?.order_status || 'pending';
    const stepIndex = STATUS_INDEX[currentStatus] ?? 0;
    const isCancelled = currentStatus === 'cancelled';

    return (
        <div className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto">
            <Head title="Status Pesanan - Toko Sparepart">
                <meta name="description" content="Lacak status pesanan Anda secara real-time hingga siap diambil di toko." />
            </Head>

            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col">

                {/* HEADER */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <h1 className="font-black text-slate-900 text-sm">Status Pesanan</h1>
                        {ordersList.length > 1 && (
                            <p className="text-[10px] text-slate-500 font-medium">{ordersList.length} pesanan dibuat</p>
                        )}
                    </div>
                    <Link href="/" className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-bold transition-all flex items-center gap-1">
                        <span>Pesan Tambahan</span>
                        <FiArrowRight size={13} />
                    </Link>
                </header>

                {/* CONTENT */}
                <div className="flex-1 p-4 space-y-4">

                    {/* MULTI-ORDER TABS SELECTOR */}
                    {ordersList.length > 1 && (
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800">Daftar Pesanan Sesi Ini</h3>
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
                                    {ordersList.length} Pesanan
                                </span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                                {ordersList.map((ord, idx) => {
                                    const isSelected = idx === selectedIndex;
                                    const st = ord.order_status || 'pending';
                                    const isPaid = ord.payment_status === 'paid';

                                    let badgeLabel = 'Pending';
                                    let badgeStyle = 'bg-yellow-100 text-yellow-600 border-yellow-200 animate-pulse';

                                    if (st === 'completed') {
                                        badgeLabel = 'Selesai';
                                        badgeStyle = 'bg-green-100 text-green-700 border-green-200';
                                    } else if (st === 'ready') {
                                        badgeLabel = 'Siap';
                                        badgeStyle = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                    } else if (st === 'preparing') {
                                        badgeLabel = 'Diproses';
                                        badgeStyle = 'bg-blue-100 text-blue-700 border-blue-200';
                                    } else if (st === 'cancelled') {
                                        badgeLabel = 'Batal';
                                        badgeStyle = 'bg-red-100 text-red-700 border-red-200';
                                    } else if (isPaid) {
                                        badgeLabel = 'Diterima';
                                        badgeStyle = 'bg-blue-100 text-blue-700 border-blue-200';
                                    }

                                    const firstItem = ord.items && ord.items.length > 0 ? ord.items[0].product_name : null;
                                    const moreItemsCount = ord.items && ord.items.length > 1 ? ord.items.length - 1 : 0;
                                    const itemsSummary = firstItem 
                                        ? (moreItemsCount > 0 ? `${firstItem} (+${moreItemsCount})` : firstItem)
                                        : null;

                                    return (
                                        <button
                                            key={ord.order_id || idx}
                                            onClick={() => setSelectedIndex(idx)}
                                            className={`flex-1 min-w-[155px] max-w-[180px] p-2.5 rounded-xl border text-left transition-all cursor-pointer snap-start flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                                                    : 'bg-white/60 border-slate-200 hover:bg-white'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
                                                    <span className="text-slate-500">Pesanan #{idx + 1}</span>
                                                    <span className={`px-1.5 py-0.5 rounded border text-[9px] ${badgeStyle}`}>
                                                        {badgeLabel}
                                                    </span>
                                                </div>
                                                
                                                {ord.customer_name && (
                                                    <p className="text-xs font-black text-slate-900 truncate leading-tight">
                                                        {ord.customer_name}
                                                    </p>
                                                )}

                                                <p className="font-mono text-[10px] font-bold text-slate-500 truncate">{ord.order_number}</p>
                                                
                                                {itemsSummary && (
                                                    <p className="text-[10px] font-semibold text-slate-600 truncate mt-0.5">
                                                        {itemsSummary}
                                                    </p>
                                                )}
                                            </div>

                                            <p className="text-xs font-black text-blue-600 mt-1 pt-1 border-t border-slate-100">{formatRp(ord.total)}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CANCELLED BANNER */}
                    {isCancelled && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                            <FiXCircle size={20} className="text-red-500 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-red-800">Pesanan Dibatalkan</p>
                                <p className="text-[10px] text-red-600">Pesanan ini telah dibatalkan.</p>
                            </div>
                        </div>
                    )}

                    {/* PROGRESS STEPS */}
                    {!isCancelled && (
                        <div className="bg-slate-50 rounded-2xl p-5">
                            <div className="space-y-0">
                                {STATUS_STEPS.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isActive = idx === stepIndex;
                                    const isDone = idx < stepIndex;
                                    const isCurrentOrderPaid = orderInfo?.payment_status === 'paid';
                                    const stepTitle = step.key === 'pending'
                                        ? (isCurrentOrderPaid ? 'Diterima' : 'Pending')
                                        : step.label;

                                    return (
                                        <div key={step.key} className="flex items-start gap-3">
                                            {/* LINE */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                    isDone ? 'bg-emerald-500 text-white' :
                                                    isActive ? 'bg-emerald-500 text-white animate-pulse' :
                                                    'bg-slate-200 text-slate-400'
                                                }`}>
                                                    {isDone ? <FiCheck size={14} /> : <Icon size={14} />}
                                                </div>
                                                {idx < STATUS_STEPS.length - 1 && (
                                                    <div className={`w-0.5 h-8 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
                                                )}
                                            </div>
                                            {/* LABEL */}
                                            <div className="pt-1.5">
                                                <p className={`text-xs font-bold ${
                                                    isActive ? 'text-slate-900' :
                                                    isDone ? 'text-emerald-600' :
                                                    'text-slate-400'
                                                }`}>{stepTitle}</p>
                                                {isActive && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {step.key === 'pending' && (
                                                            isCurrentOrderPaid 
                                                                ? 'Pesanan telah dikonfirmasi & diterima oleh kasir.' 
                                                                : 'Menunggu konfirmasi pembayaran di kasir...'
                                                        )}
                                                        {step.key === 'preparing' && 'Toko sedang menyiapkan...'}
                                                        {step.key === 'ready' && 'Pesanan siap diambil!'}
                                                        {step.key === 'completed' && 'Pesanan selesai. Terima kasih!'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ORDER DETAILS */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800">Detail Pesanan #{selectedIndex + 1}</h3>
                            <span className="text-[10px] text-slate-400 font-mono">{orderInfo.order_number}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <FiShoppingBag size={14} />
                                    <span>No. Order</span>
                                </div>
                                <span className="font-mono font-bold text-slate-800">{orderInfo.order_number}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <FiMapPin size={14} />
                                    <span>Tipe Pesanan</span>
                                </div>
                                <span className="font-bold text-blue-600">Ambil di Toko</span>
                            </div>
                            {orderInfo.customer_name && (
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <FiUser size={14} />
                                        <span>Pemesan</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{orderInfo.customer_name}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Total Pesanan Ini</span>
                                <span className="font-black text-base text-blue-600">{formatRp(orderInfo.total)}</span>
                            </div>

                            {/* CANCEL ORDER BUTTON (for unpaid pending orders only) */}
                            {orderInfo.order_status === 'pending' && orderInfo.payment_status !== 'paid' && (
                                <div className="pt-2 border-t border-slate-200">
                                    <button
                                        onClick={() => openCancelModal(orderInfo)}
                                        disabled={isCancelling}
                                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                                    >
                                        <FiXCircle size={14} />
                                        <span>Batalkan Pesanan Ini</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* INVOICE / RINCIAN PESANAN */}
                    {orderInfo.items && orderInfo.items.length > 0 && (
                        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <FiFileText size={14} className="text-blue-500" />
                                    Rincian Menu #{selectedIndex + 1}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-medium">{orderInfo.ordered_at || 'Baru Saja'}</span>
                            </div>
                            <div className="space-y-2.5">
                                {orderInfo.items.map((item, idx) => (
                                    <div key={item.id || idx} className="flex justify-between items-start text-xs">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-800">{item.product_name}</span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                                            </div>
                                            {item.notes && <p className="text-[10px] text-blue-600 mt-0.5 italic">Catatan: {item.notes}</p>}
                                        </div>
                                        <span className="font-bold text-slate-700 shrink-0">{formatRp(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-dashed border-slate-300 pt-2.5 space-y-1 text-xs">
                                {Number(orderInfo.subtotal) > 0 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>{formatRp(orderInfo.subtotal)}</span>
                                    </div>
                                )}
                                {Number(orderInfo.tax_amount) > 0 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span>Pajak</span>
                                        <span>{formatRp(orderInfo.tax_amount)}</span>
                                    </div>
                                )}
                                {Number(orderInfo.discount_amount) > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Diskon</span>
                                        <span>-{formatRp(orderInfo.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                                    <span>Total Pembayaran</span>
                                    <span className="text-blue-600">{formatRp(orderInfo.total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* READY MESSAGE */}
                    {currentStatus === 'ready' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                            <FiPackage size={20} className="text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-emerald-800">Pesanan Siap!</p>
                                <p className="text-[10px] text-emerald-600">Silakan ambil pesanan Anda di kasir.</p>
                            </div>
                        </div>
                    )}

                    {/* COMPLETED MESSAGE */}
                    {currentStatus === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                            <FiCheckCircle size={20} className="text-green-500 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-green-800">Pesanan Selesai!</p>
                                <p className="text-[10px] text-green-600">Terima kasih telah memesan di Toko Sparepart</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <Link
                        href="/"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                        <span>Tambah Pesanan Lagi</span>
                        <FiArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* CUSTOM CANCEL CONFIRMATION MODAL */}
            {showCancelModal && targetOrderToCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center border border-slate-100 transform transition-all">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <FiAlertTriangle size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900">Batalkan Pesanan?</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Apakah Anda yakin ingin membatalkan <span className="font-bold text-slate-800">Pesanan #{targetOrderToCancel.order_number}</span>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>

                        {cancelError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium text-left flex items-center gap-2">
                                <FiAlertCircle size={14} className="shrink-0" />
                                <span>{cancelError}</span>
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setTargetOrderToCancel(null);
                                    setCancelError(null);
                                }}
                                disabled={isCancelling}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleConfirmCancelOrder}
                                disabled={isCancelling}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                            >
                                {isCancelling ? (
                                    <span>Membatalkan...</span>
                                ) : (
                                    <>
                                        <FiXCircle size={14} />
                                        <span>Ya, Batalkan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
