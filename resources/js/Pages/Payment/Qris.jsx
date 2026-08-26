import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import { FiAlertCircle, FiRefreshCw, FiExternalLink } from 'react-icons/fi';

const PAYMENT_KEY = 'mie_amour_order_for_payment';

export default function QrisPayment() {
    useForceLightTheme();
    const [orderInfo, setOrderInfo] = useState(null);
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isInvalidOrder, setIsInvalidOrder] = useState(false);
    const [loading, setLoading] = useState(true);

    const mounted = useRef(false);

    const createPayment = useCallback(async (info) => {
        setLoading(true);
        setError(null);
        setIsInvalidOrder(false);

        // Check if we already have a valid payment URL stored
        try {
            const storedRaw = localStorage.getItem(PAYMENT_KEY);
            if (storedRaw) {
                const stored = JSON.parse(storedRaw);
                if (stored.payment_url && stored.order_id === info.order_id) {
                    setPaymentUrl(stored.payment_url);
                    setLoading(false);
                    window.location.href = stored.payment_url;
                    return;
                }
            }
        } catch {}

        try {
            const res = await axios.post('/api/customer/payment/qris', {
                order_id: info.order_id,
                customer_token: info.customer_token,
            });
            if (!mounted.current) return;
            const url = res.data?.data?.payment_url;
            if (url) {
                setPaymentUrl(url);
                try {
                    const updatedInfo = { ...info, payment_url: url };
                    localStorage.setItem(PAYMENT_KEY, JSON.stringify(updatedInfo));
                } catch {}
                window.location.href = url;
            } else {
                setError('Gagal mendapatkan URL pembayaran');
            }
        } catch (err) {
            if (mounted.current) {
                const errMsg = err.response?.data?.message || 'Gagal membuat pembayaran';
                const status = err.response?.status;
                if (status === 404 || status === 422 || errMsg.toLowerCase().includes('invalid')) {
                    try {
                        localStorage.removeItem(PAYMENT_KEY);
                        localStorage.removeItem('mie_amour_current_order');
                        const historyRaw = localStorage.getItem('mie_amour_orders_history');
                        if (historyRaw) {
                            const list = JSON.parse(historyRaw);
                            if (Array.isArray(list)) {
                                const filtered = list.filter(o => o.order_id !== info.order_id);
                                localStorage.setItem('mie_amour_orders_history', JSON.stringify(filtered));
                            }
                        }
                    } catch {}
                    setIsInvalidOrder(true);
                } else {
                    setError(errMsg);
                }
            }
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        let raw;
        try {
            raw = localStorage.getItem(PAYMENT_KEY);
        } catch {}
        if (!raw) {
            router.visit('/');
            return;
        }
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = null; }
        if (!parsed) {
            router.visit('/');
            return;
        }
        setOrderInfo(parsed);
        createPayment(parsed);
        return () => { mounted.current = false; };
    }, [createPayment]);

    if (!orderInfo) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-slate-400 text-xs">Memuat data pembayaran...</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto">
            <Head title="Pembayaran QRIS - Toko Sparepart">
                <meta name="description" content="Proses pembayaran QRIS online aman dan instan untuk pesanan toko Toko Sparepart." />
            </Head>

            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col items-center justify-center p-6">

                {loading ? (
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-bold text-slate-800">Menyiapkan halaman pembayaran...</p>
                        <p className="text-xs text-slate-400">Anda akan diarahkan ke halaman pembayaran Doku</p>
                    </div>
                ) : isInvalidOrder ? (
                    <div className="text-center space-y-4">
                        <FiAlertCircle size={44} className="text-red-500 mx-auto" />
                        <p className="text-sm font-bold text-slate-800">Pesanan Tidak Ditemukan</p>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            Pesanan ini sudah tidak ada atau transaksi telah di-reset oleh toko.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all mt-2"
                        >
                            Buat Pesanan Baru
                        </Link>
                    </div>
                ) : error ? (
                    <div className="text-center space-y-4">
                        <FiAlertCircle size={40} className="text-red-400 mx-auto" />
                        <p className="text-sm font-bold text-slate-800">Gagal Membuat Pembayaran</p>
                        <p className="text-xs text-red-500">{error}</p>
                        <button
                            onClick={() => createPayment(orderInfo)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mx-auto"
                        >
                            <FiRefreshCw size={12} /> Coba Lagi
                        </button>
                        <Link
                            href="/payment"
                            className="block text-xs text-slate-400 hover:text-slate-600 underline mt-2"
                        >
                            Kembali ke pembayaran
                        </Link>
                    </div>
                ) : paymentUrl ? (
                    <div className="text-center space-y-4">
                        <FiExternalLink size={40} className="text-blue-500 mx-auto" />
                        <p className="text-sm font-bold text-slate-800">Mengarahkan ke Doku...</p>
                        <p className="text-xs text-slate-400">
                            Jika tidak diarahkan otomatis,
                            <br />
                            <a href={paymentUrl} className="text-blue-600 font-bold underline">klik di sini</a>
                        </p>
                    </div>
                ) : null}

                {/* ORDER INFO */}
                {orderInfo && (
                    <div className="w-full bg-slate-50 rounded-2xl p-4 space-y-2 text-xs mt-6">
                        <div className="flex justify-between">
                            <span className="text-slate-400">No. Order</span>
                            <span className="font-mono font-bold text-slate-800">{orderInfo.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total</span>
                            <span className="font-bold text-blue-600">
                                Rp {Number(orderInfo.total).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Tipe Pesanan</span>
                            <span className="font-bold text-blue-600">Ambil di Toko</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
