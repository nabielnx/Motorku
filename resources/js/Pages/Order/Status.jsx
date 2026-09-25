import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import OrderStatusSkeleton from '@/Components/Skeletons/OrderStatusSkeleton';
import axios from 'axios';
import {
    FiCheck,
    FiClock,
    FiTool,
    FiPackage,
    FiCheckCircle,
    FiXCircle,
    FiMapPin,
    FiUser,
    FiShoppingBag,
    FiArrowRight,
    FiFileText,
    FiAlertCircle,
    FiAlertTriangle,
    FiCopy,
    FiChevronDown,
    FiChevronUp,
    FiRefreshCw,
    FiShoppingCart,
} from 'react-icons/fi';
import clsx from 'clsx';

const HISTORY_KEY = 'motorku_orders_history';
const ORDER_KEY = 'motorku_current_order';
const PAYMENT_KEY = 'motorku_order_for_payment';
const POLL_INTERVAL = 5000;

// ─── Status config ───
const STATUS_CONFIG = {
    pending: {
        label: 'Menunggu Konfirmasi',
        shortLabel: 'Pending',
        icon: FiClock,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700 border-amber-300',
        dot: 'bg-amber-400',
        text: 'text-amber-700',
        desc: 'Menunggu konfirmasi pembayaran di kasir',
        animate: true,
    },
    preparing: {
        label: 'Sedang Diproses',
        shortLabel: 'Diproses',
        icon: FiTool,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700 border-blue-300',
        dot: 'bg-blue-500',
        text: 'text-blue-700',
        desc: 'Toko sedang menyiapkan pesanan Anda',
        animate: true,
    },
    ready: {
        label: 'Siap Diambil',
        shortLabel: 'Siap',
        icon: FiPackage,
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        desc: 'Pesanan siap! Silakan ambil di kasir',
        animate: false,
    },
    completed: {
        label: 'Selesai',
        shortLabel: 'Selesai',
        icon: FiCheckCircle,
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-500 border-slate-300',
        dot: 'bg-slate-400',
        text: 'text-slate-500',
        desc: 'Pesanan telah selesai',
        animate: false,
    },
    cancelled: {
        label: 'Dibatalkan',
        shortLabel: 'Batal',
        icon: FiXCircle,
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-600 border-red-300',
        dot: 'bg-red-400',
        text: 'text-red-600',
        desc: 'Pesanan telah dibatalkan',
        animate: false,
    },
};

// ─── Copy to clipboard helper ───
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
}

// ─── Format date helper ───
function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatTime(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════
// Order Card Component
// ═══════════════════════════════════════════
function OrderCard({ order, onCancel, isCancelling, formatRp }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const status = order.order_status || 'pending';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;
    const isPaid = order.payment_status === 'paid';
    const isCancelled = status === 'cancelled';
    const isCompleted = status === 'completed';
    const canCancel = status === 'pending' && !isPaid;

    // Items display
    const items = order.items || [];
    const MAX_VISIBLE = 2;
    const hasMore = items.length > MAX_VISIBLE;
    const visibleItems = expanded ? items : items.slice(0, MAX_VISIBLE);
    const hiddenCount = items.length - MAX_VISIBLE;

    const handleCopy = () => {
        if (order.order_number) {
            copyToClipboard(order.order_number);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Override pending label if paid
    const statusLabel = (status === 'pending' && isPaid) ? 'Diterima' : cfg.shortLabel;

    return (
        <div className={clsx(
            'rounded-2xl border overflow-hidden transition-all',
            cfg.border,
            (status === 'ready') && 'ring-2 ring-emerald-300 shadow-md shadow-emerald-100',
        )}>
            {/* ── Card Header: Status + Date ── */}
            <div className={clsx('px-4 py-3 flex items-center justify-between', cfg.bg)}>
                <div className="flex items-center gap-2.5">
                    <div className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        cfg.dot,
                        cfg.animate && 'animate-pulse',
                    )} />
                    <div className="flex items-center gap-2">
                        <span className={clsx(
                            'text-xs font-bold px-2 py-0.5 rounded-md border',
                            cfg.badge,
                        )}>
                            {statusLabel}
                        </span>
                        {status === 'ready' && (
                            <span className="text-[10px] font-bold text-emerald-600 animate-bounce">
                                Ambil sekarang!
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    {order.ordered_at || order.created_at ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] text-slate-500 font-medium">
                                {formatDate(order.ordered_at || order.created_at)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {formatTime(order.ordered_at || order.created_at)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-400">Baru saja</span>
                    )}
                </div>
            </div>

            {/* ── Order Number + Copy ── */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 min-w-0">
                    <FiFileText size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-500">No. Pesanan</span>
                    <span className="text-[11px] font-bold text-slate-800 font-mono truncate">
                        {order.order_number || '-'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className={clsx(
                        'flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all cursor-pointer shrink-0',
                        copied
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'text-blue-600 hover:bg-blue-50 border border-transparent'
                    )}
                >
                    {copied ? (
                        <>
                            <FiCheck size={11} />
                            <span>Tersalin</span>
                        </>
                    ) : (
                        <>
                            <FiCopy size={11} />
                            <span>Salin</span>
                        </>
                    )}
                </button>
            </div>

            {/* ── Customer Info Row ── */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-4 flex-wrap text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                    <FiMapPin size={12} className="text-slate-400" />
                    <span className="font-semibold text-blue-600">Ambil di Toko</span>
                </div>
                {order.customer_name && (
                    <div className="flex items-center gap-1.5">
                        <FiUser size={12} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{order.customer_name}</span>
                    </div>
                )}
            </div>

            {/* ── Items List ── */}
            {items.length > 0 && (
                <div className="bg-white">
                    <div className="divide-y divide-slate-50">
                        {visibleItems.map((item, idx) => (
                            <div key={item.id || idx} className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
                                        {item.product_name}
                                    </p>
                                    {item.notes && (
                                        <p className="text-[10px] text-blue-500 mt-0.5 truncate italic">
                                            {item.notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        x{item.quantity}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 tabular-nums min-w-[70px] text-right">
                                        {formatRp(item.subtotal)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Expand / Collapse */}
                    {hasMore && (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="w-full px-4 py-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer border-t border-slate-100"
                        >
                            {expanded ? (
                                <>
                                    <FiChevronUp size={13} />
                                    <span>Sembunyikan</span>
                                </>
                            ) : (
                                <>
                                    <FiChevronDown size={13} />
                                    <span>+{hiddenCount} produk lainnya</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* ── Totals ── */}
            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 space-y-1">
                {Number(order.subtotal) > 0 && Number(order.tax_amount) > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatRp(order.subtotal)}</span>
                    </div>
                )}
                {Number(order.tax_amount) > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Pajak</span>
                        <span className="tabular-nums">{formatRp(order.tax_amount)}</span>
                    </div>
                )}
                {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-600">
                        <span>Diskon</span>
                        <span className="tabular-nums">-{formatRp(order.discount_amount)}</span>
                    </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-bold text-slate-600">Total Pembayaran</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">
                        {formatRp(order.total)}
                    </span>
                </div>
            </div>

            {/* ── Status Message Banner ── */}
            {status === 'ready' && (
                <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-200 flex items-center gap-2.5">
                    <FiPackage size={16} className="text-emerald-600 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-emerald-800">Pesanan Siap Diambil!</p>
                        <p className="text-[10px] text-emerald-600">Silakan datang ke kasir untuk mengambil pesanan.</p>
                    </div>
                </div>
            )}

            {status === 'completed' && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5">
                    <FiCheckCircle size={16} className="text-green-500 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-slate-700">Pesanan Selesai</p>
                        <p className="text-[10px] text-slate-500">Terima kasih telah belanja di Motorku!</p>
                    </div>
                </div>
            )}

            {isCancelled && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2.5">
                    <FiXCircle size={16} className="text-red-500 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-red-700">Pesanan Dibatalkan</p>
                        <p className="text-[10px] text-red-500">Pesanan ini telah dibatalkan.</p>
                    </div>
                </div>
            )}

            {(status === 'pending' && !isPaid) && (
                <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2.5">
                    <FiClock size={16} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-amber-800">Menunggu Konfirmasi Kasir</p>
                        <p className="text-[10px] text-amber-600">Tunjukkan nomor pesanan ke kasir untuk pembayaran.</p>
                    </div>
                </div>
            )}

            {(status === 'pending' && isPaid) && (
                <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 flex items-center gap-2.5">
                    <FiCheck size={16} className="text-blue-600 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-blue-800">Pembayaran Diterima</p>
                        <p className="text-[10px] text-blue-600">Pesanan akan segera diproses oleh toko.</p>
                    </div>
                </div>
            )}

            {status === 'preparing' && (
                <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-blue-800">Sedang Disiapkan</p>
                        <p className="text-[10px] text-blue-600">Toko sedang menyiapkan pesanan Anda.</p>
                    </div>
                </div>
            )}

            {/* ── Action Buttons ── */}
            {canCancel && (
                <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <button
                        onClick={() => onCancel(order)}
                        disabled={isCancelling}
                        className="w-full py-2.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    >
                        <FiXCircle size={14} />
                        <span>Batalkan Pesanan</span>
                    </button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════
export default function OrderStatus() {
    useForceLightTheme();
    const [ordersList, setOrdersList] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [targetOrderToCancel, setTargetOrderToCancel] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

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

    // Initial load
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

        setOrdersList(list);
        setIsLoaded(true);
    }, []);

    // Polling
    useEffect(() => {
        if (ordersList.length === 0) return;
        let pollInterval = null;

        const pollAllOrders = async () => {
            setIsPolling(true);
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
                    localStorage.removeItem('motorku_order_for_payment');
                } catch {}
                router.visit('/');
                return;
            }

            if (hasChanges) {
                setOrdersList(updatedList);
                try {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedList));
                } catch {}
            }

            setTimeout(() => setIsPolling(false), 600);
        };

        pollAllOrders();
        pollInterval = setInterval(pollAllOrders, POLL_INTERVAL);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [ordersList.length]);

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

    // ── Sort: active orders first (pending/preparing/ready), then completed, then cancelled ──
    const sortedOrders = [...ordersList].sort((a, b) => {
        const priority = { ready: 0, preparing: 1, pending: 2, completed: 3, cancelled: 4 };
        const pa = priority[a.order_status] ?? 2;
        const pb = priority[b.order_status] ?? 2;
        if (pa !== pb) return pa - pb;
        // Within same status, newest first
        const ta = new Date(a.ordered_at || a.created_at || 0).getTime();
        const tb = new Date(b.ordered_at || b.created_at || 0).getTime();
        return tb - ta;
    });

    const activeCount = ordersList.filter(o => !['completed', 'cancelled'].includes(o.order_status)).length;

    if (!isLoaded) {
        return <OrderStatusSkeleton />;
    }

    // ── Empty state ──
    if (ordersList.length === 0) {
        return (
            <div className="h-full w-full bg-white font-sans text-slate-800 flex justify-center min-h-screen">
                <Head title="Pesanan Saya">
                    <meta name="description" content="Belum ada pesanan. Mulai belanja di Motorku." />
                </Head>
                <div className="w-full max-w-md bg-white flex flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
                        <div className="px-4 py-3.5 flex items-center justify-between">
                            <h1 className="text-base font-black text-slate-900">Pesanan Saya</h1>
                            <Link
                                href="/"
                                className="text-[11px] bg-[#0f172a] hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-[0.97]"
                            >
                                <FiShoppingBag size={13} />
                                <span>Belanja</span>
                            </Link>
                        </div>
                    </header>
                    {/* Empty Content */}
                    <div className="flex-1 flex flex-col items-center justify-center px-8 py-20">
                        <FiShoppingCart size={40} strokeWidth={1.4} className="text-slate-300" />
                        <h2 className="mt-5 text-base font-bold text-slate-900">Belum ada pesanan</h2>
                        <p className="mt-1.5 text-xs text-slate-500 text-center leading-relaxed">
                            Pesanan Anda akan muncul di sini setelah checkout.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 min-h-10 rounded-xl bg-[#0f172a] hover:bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition-colors flex items-center gap-2"
                        >
                            <FiShoppingBag size={14} />
                            Mulai belanja
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto">
            <Head title="Pesanan Saya">
                <meta name="description" content="Lacak status pesanan Anda secara real-time hingga siap diambil di toko." />
            </Head>

            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col">

                {/* ═══ STICKY HEADER ═══ */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                    <div className="px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-base font-black text-slate-900">Pesanan Saya</h1>
                            {activeCount > 0 && (
                                <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                    {activeCount}
                                </span>
                            )}
                            {isPolling && (
                                <FiRefreshCw size={12} className="text-slate-300 animate-spin" />
                            )}
                        </div>
                        <Link
                            href="/"
                            className="text-[11px] bg-[#0f172a] hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-[0.97]"
                        >
                            <FiShoppingBag size={13} />
                            <span>Belanja Lagi</span>
                        </Link>
                    </div>
                </header>

                {/* ═══ ORDER CARDS LIST ═══ */}
                <div className="flex-1 p-4 space-y-4">

                    {/* Active orders section */}
                    {sortedOrders.filter(o => !['completed', 'cancelled'].includes(o.order_status)).length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                                Pesanan Aktif
                            </h2>
                            {sortedOrders
                                .filter(o => !['completed', 'cancelled'].includes(o.order_status))
                                .map((order) => (
                                    <OrderCard
                                        key={order.order_id}
                                        order={order}
                                        onCancel={openCancelModal}
                                        isCancelling={isCancelling}
                                        formatRp={formatRp}
                                    />
                                ))
                            }
                        </div>
                    )}

                    {/* Completed / Cancelled orders section */}
                    {sortedOrders.filter(o => ['completed', 'cancelled'].includes(o.order_status)).length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                                Riwayat
                            </h2>
                            {sortedOrders
                                .filter(o => ['completed', 'cancelled'].includes(o.order_status))
                                .map((order) => (
                                    <OrderCard
                                        key={order.order_id}
                                        order={order}
                                        onCancel={openCancelModal}
                                        isCancelling={isCancelling}
                                        formatRp={formatRp}
                                    />
                                ))
                            }
                        </div>
                    )}

                    {/* Bottom padding */}
                    <div className="pb-4" />
                </div>
            </div>

            {/* ═══ CANCEL CONFIRMATION MODAL ═══ */}
            {showCancelModal && targetOrderToCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center border border-slate-100 transform transition-all">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <FiAlertTriangle size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900">Batalkan Pesanan?</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Apakah Anda yakin ingin membatalkan <span className="font-bold text-slate-800">Pesanan {targetOrderToCancel.order_number}</span>? Tindakan ini tidak dapat dibatalkan.
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
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
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
