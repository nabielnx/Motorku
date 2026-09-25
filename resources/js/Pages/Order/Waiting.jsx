import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import WaitingSkeleton from '@/Components/Skeletons/WaitingSkeleton';
import axios from 'axios';
import {
    FiCheck,
    FiClock,
    FiMapPin,
    FiShoppingBag,
    FiUser,
    FiArrowRight,
    FiAlertCircle,
    FiRefreshCw,
    FiFileText,
    FiXCircle,
    FiAlertTriangle
} from 'react-icons/fi';

const PAYMENT_KEY = 'motorku_order_for_payment';
const CURRENT_ORDER_KEY = 'motorku_current_order';
const POLL_INTERVAL = 6000;

export default function WaitingConfirmation() {
    useForceLightTheme();
    const [orderInfo, setOrderInfo] = useState(null);
    const [orderStatus, setOrderStatus] = useState('pending');
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelError, setCancelError] = useState(null);

    const openCancelModal = () => {
        setCancelError(null);
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        if (!orderInfo || !orderInfo.order_id || !orderInfo.customer_token) return;

        setCancelling(true);
        setCancelError(null);
        try {
            await axios.post(`/api/customer/order/${orderInfo.order_id}/cancel`, {
                customer_token: orderInfo.customer_token,
            });

            const updatedInfo = { ...orderInfo, order_status: 'cancelled' };
            setOrderInfo(updatedInfo);
            setOrderStatus('cancelled');
            setShowCancelModal(false);

            try {
                const historyKey = 'motorku_orders_history';
                const rawHistory = localStorage.getItem(historyKey);
                let history = rawHistory ? JSON.parse(rawHistory) : [];
                if (Array.isArray(history)) {
                    const idx = history.findIndex(o => o.order_id === orderInfo.order_id);
                    if (idx > -1) history[idx] = updatedInfo;
                    localStorage.setItem(historyKey, JSON.stringify(history));
                }
            } catch {}
        } catch (err) {
            setCancelError(err.response?.data?.message || 'Gagal membatalkan pesanan.');
        } finally {
            setCancelling(false);
        }
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem(PAYMENT_KEY);
            if (!raw) { router.visit('/'); return; }
            setOrderInfo(JSON.parse(raw));
        } catch { router.visit('/'); }
    }, []);

    useEffect(() => {
        if (!orderInfo) return;

        const pollOrder = async () => {
            try {
                const res = await axios.get(`/api/customer/order/${orderInfo.order_id}/status`, {
                    params: { customer_token: orderInfo.customer_token, t: Date.now() }
                });
                const d = res.data?.data;
                if (!d?.order_status) return;
                const info = {
                    ...orderInfo,
                    order_status: d.order_status,
                    payment_status: d.payment_status,
                    total: d.total,
                    subtotal: d.subtotal,
                    tax_amount: d.tax_amount,
                    discount_amount: d.discount_amount,
                    items: d.items,
                    customer_name: d.customer_name || orderInfo.customer_name,
                    table_name: d.table_name || orderInfo.table_name,
                    ordered_at: d.ordered_at,
                };
                setOrderInfo(info);
                localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(info));
                try {
                    const historyKey = 'motorku_orders_history';
                    const rawHistory = localStorage.getItem(historyKey);
                    let history = rawHistory ? JSON.parse(rawHistory) : [];
                    if (Array.isArray(history)) {
                        const idx = history.findIndex(o => o.order_id === info.order_id);
                        if (idx > -1) {
                            history[idx] = info;
                        } else {
                            history.push(info);
                        }
                        localStorage.setItem(historyKey, JSON.stringify(history));
                    }
                } catch {}
                setOrderStatus(d.order_status);
                if (d.payment_status === 'paid') { setPaymentStatus('paid'); }
                setPaymentStatus(d.payment_status);
            } catch (err) {
                if (err.response?.status === 404) {
                    try {
                        localStorage.removeItem(PAYMENT_KEY);
                        localStorage.removeItem(CURRENT_ORDER_KEY);
                    } catch {}
                    router.visit('/');
                }
            }
        };

        // Polling status pesanan secara berkala dengan perlindungan customer_token
        pollOrder();
        const interval = setInterval(() => { pollOrder(); }, POLL_INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [orderInfo?.order_id, orderInfo?.customer_token, paymentStatus]);

    const formatRp = (val) => `Rp ${Number(val).toLocaleString('id-ID')}`;

    if (!orderInfo) {
        return <WaitingSkeleton />;
    }

    return (
        <div className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto">
            <Head title="Pesanan Diterima">
                <meta name="description" content="Status penerimaan pesanan Motorku. Lacak pembayaran dan konfirmasi kasir." />
            </Head>

            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col items-center p-6 space-y-6">

                {/* HEADER ICON & TITLE */}
                <div className="text-center space-y-2 pt-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <FiCheck size={32} />
                    </div>
                    <h1 className="text-xl font-black text-slate-900">Pesanan Berhasil Terkirim!</h1>
                    <p className="text-sm text-slate-500">Harap tunggu, pesanan Anda sedang diproses</p>
                </div>

                {/* ORDER DETAILS */}
                <div className="w-full bg-slate-50 rounded-2xl p-5 space-y-3">
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
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                            <FiUser size={14} />
                            <span>Pemesan</span>
                        </div>
                        <span className="font-bold text-slate-800">{orderInfo.customer_name || '-'}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Total</span>
                        <span className="font-black text-lg text-blue-600">{formatRp(orderInfo.total)}</span>
                    </div>
                </div>

                {/* INVOICE / RINCIAN PESANAN */}
                {orderInfo.items && orderInfo.items.length > 0 && (
                    <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <FiFileText size={14} className="text-blue-500" />
                                Rincian Pesanan
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

                {/* PAYMENT STATUS */}
                {paymentStatus === 'paid' ? (
                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                            <FiCheck size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800">Pembayaran Berhasil!</p>
                            <p className="text-[10px] text-emerald-600">Rp {Number(orderInfo.total).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                ) : null}

                {/* PAYMENT & ORDER STATUS BANNER */}
                {(paymentStatus === 'pending' || paymentStatus === 'unpaid') ? (
                    <div className="w-full bg-yellow-50 border border-yellow-200/80 rounded-2xl p-4 flex items-center gap-3">
                        <FiClock size={20} className="text-yellow-500 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-yellow-800">Menunggu Konfirmasi Kasir</p>
                            <p className="text-[11px] text-yellow-600 leading-tight">
                                Tunjukkan nomor pesanan di atas ke kasir toko untuk pembayaran tunai.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={`w-full rounded-2xl border p-4 flex items-center gap-3 ${
                        orderStatus === 'ready' ? 'bg-emerald-50 border-emerald-200' :
                        orderStatus === 'completed' ? 'bg-green-50 border-green-200' :
                        orderStatus === 'cancelled' ? 'bg-red-50 border-red-200' :
                        'bg-blue-50 border-blue-200'
                    }`}>
                        <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                            orderStatus === 'ready' ? 'bg-emerald-500' :
                            orderStatus === 'completed' ? 'bg-green-500' :
                            orderStatus === 'cancelled' ? 'bg-red-500' :
                            'bg-blue-500 animate-pulse'
                        }`}></div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">
                                {{
                                    pending: 'Menunggu Toko Menyiapkan',
                                    preparing: 'Toko Sedang Menyiapkan',
                                    ready: 'Pesanan Siap Diambil',
                                    completed: 'Pesanan Selesai',
                                    cancelled: 'Pesanan Dibatalkan',
                                }[orderStatus] || 'Status Pesanan Diperbarui'}
                            </p>
                            <p className="text-[10px] text-slate-500">Status terhubung langsung ke sistem kasir.</p>
                        </div>
                    </div>
                )}

                {/* CANCEL ORDER BUTTON (for unpaid pending orders only) */}
                {orderStatus === 'pending' && paymentStatus !== 'paid' && (
                    <button
                        onClick={openCancelModal}
                        disabled={cancelling}
                        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                        <FiXCircle size={14} />
                        <span>Batalkan Pesanan</span>
                    </button>
                )}

                {/* PROCEED BUTTON */}
                <Link
                    href="/order/status"
                    onClick={() => {
                        localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(orderInfo));
                    }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                    <span>Lihat Status Pesanan</span>
                    <FiArrowRight size={14} />
                </Link>

                {/* BACK TO MENU */}
                <Link
                    href="/"
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                    Kembali ke Menu
                </Link>
            </div>

            {/* CUSTOM CANCEL CONFIRMATION MODAL */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center border border-slate-100 transform transition-all">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <FiAlertTriangle size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900">Batalkan Pesanan?</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Apakah Anda yakin ingin membatalkan <span className="font-bold text-slate-800">Pesanan #{orderInfo.order_number}</span>? Tindakan ini tidak dapat dibatalkan.
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
                                    setCancelError(null);
                                }}
                                disabled={cancelling}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
                            >
                                {cancelling ? (
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
