import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import PaymentSkeleton from '@/Components/Skeletons/PaymentSkeleton';
import {
    FiArrowLeft,
    FiCheck,
    FiShoppingBag,
    FiUser,
    FiMapPin,
    FiGrid,
    FiAlertCircle,
    FiDollarSign,
    FiTrash2
} from 'react-icons/fi';

const ORDER_KEY = 'motorku_pending_order';
const LEGACY_ORDER_KEY = 'mie_amour_pending_order';
const CART_KEY = 'motorku_cart';
const LEGACY_CART_KEY = 'mie_amour_cart';
const PAYMENT_KEY = 'motorku_order_for_payment';
const CURRENT_ORDER_KEY = 'motorku_current_order';
const HISTORY_KEY = 'motorku_orders_history';

export default function Payment({ qrisEnabled = false }) {
    useForceLightTheme();
    const [orderData, setOrderData] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(qrisEnabled ? null : 'kasir');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const customerNameInputRef = useRef(null);

    const handleClearAndReturn = () => {
        localStorage.removeItem(ORDER_KEY);
        localStorage.removeItem(LEGACY_ORDER_KEY);
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(LEGACY_CART_KEY);
        localStorage.removeItem('motorku_cart_time');
        localStorage.removeItem('mie_amour_cart_time');
        router.visit('/');
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem(ORDER_KEY) || localStorage.getItem(LEGACY_ORDER_KEY);
            if (!raw) {
                router.visit('/');
                return;
            }
            const data = JSON.parse(raw);
            if (!data || !data.cart || data.cart.length === 0) {
                handleClearAndReturn();
                return;
            }
            setOrderData(data);
        } catch {
            handleClearAndReturn();
        }
    }, []);

    const formatRp = (val) => `Rp ${val.toLocaleString('id-ID')}`;

    if (!orderData) {
        return <PaymentSkeleton />;
    }

    const handleSubmitOrder = async () => {
        setError(null);
        if (!customerName.trim()) {
            setError('Harap isi nama pemesan terlebih dahulu!');
            customerNameInputRef.current?.focus();
            customerNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (!paymentMethod) {
            setError('Harap pilih metode pembayaran!');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            customer_name: customerName,
            notes: `Pre-order Web | Pembayaran: ${paymentMethod === 'qris' ? 'QRIS' : 'Bayar di Kasir'}`,
            items: orderData.cart.map(i => ({
                product_id: i.id,
                quantity: i.qty,
                notes: i.notes || null
            }))
        };

        try {
            const res = await axios.post('/api/customer/order', payload);
            const order = res.data?.data;

            localStorage.removeItem(ORDER_KEY);
            localStorage.removeItem(LEGACY_ORDER_KEY);
            localStorage.removeItem(CART_KEY);
            localStorage.removeItem(LEGACY_CART_KEY);
            localStorage.removeItem('motorku_cart_time');
            localStorage.removeItem('mie_amour_cart_time');

            // Build items array for immediate display on Waiting page
            const cartItems = orderData.cart.map(i => ({
                product_name: i.name,
                quantity: i.qty,
                subtotal: i.price * i.qty,
                notes: i.notes || null,
            }));

            const paymentData = {
                order_id: order.id,
                order_number: order.order_number,
                customer_token: order.customer_token,
                total: order.total,
                subtotal: orderData.subtotal,
                tax_amount: orderData.tax,
                table_name: 'Ambil di Toko',
                order_type: 'take_away',
                customer_name: customerName,
                payment_method: paymentMethod,
                order_status: 'pending',
                created_at: new Date().toISOString(),
                items: cartItems,
            };

            localStorage.setItem(PAYMENT_KEY, JSON.stringify(paymentData));
            localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(paymentData));
            localStorage.setItem('mie_amour_order_for_payment', JSON.stringify(paymentData));
            localStorage.setItem('mie_amour_current_order', JSON.stringify(paymentData));

            // Append to order history list in localStorage
            try {
                const rawHistory = localStorage.getItem(HISTORY_KEY) || localStorage.getItem('mie_amour_orders_history');
                let history = rawHistory ? JSON.parse(rawHistory) : [];
                if (!Array.isArray(history)) history = [];
                // Prevent duplicate order_id
                history = history.filter(o => o.order_id !== order.id);
                history.push(paymentData);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                localStorage.setItem('mie_amour_orders_history', JSON.stringify(history));
            } catch {}

            // Redirect based on payment method
            if (paymentMethod === 'qris') {
                router.visit('/payment/qris');
            } else {
                router.visit('/order/waiting');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto">
            <Head title="Konfirmasi Pembayaran - Toko Sparepart">
                <meta name="description" content="Selesaikan pesanan dan bayar di kasir toko." />
            </Head>

            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col pb-24">
                {/* HEADER */}
                <header className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                    <Link href="/" className="text-slate-600 hover:text-slate-800 p-1">
                        <FiArrowLeft size={20} />
                    </Link>
                    <h1 className="font-black text-slate-900 text-sm">Pembayaran</h1>
                </header>

                {/* CONTENT */}
                <div className="flex-1 p-4 space-y-4">

                    {/* ORDER INFO */}
                    <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-blue-800">
                            <FiShoppingBag size={14} />
                            <span className="font-bold">Ambil di Toko</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-800">
                            <FiShoppingBag size={14} />
                            <span>{orderData.cart.length} item</span>
                        </div>
                    </div>

                    {/* ORDER ITEMS */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <h3 className="text-xs font-bold text-slate-800">Ringkasan Pesanan</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-500 font-semibold">{orderData.cart.length} Item</span>
                                <button
                                    type="button"
                                    onClick={handleClearAndReturn}
                                    className="text-[11px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Kosongkan keranjang"
                                >
                                    <FiTrash2 size={12} />
                                    <span>Kosongkan</span>
                                </button>
                            </div>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1.5 px-0.5">
                            <span className="col-span-6">Nama Produk</span>
                            <span className="col-span-2 text-center">Qty</span>
                            <span className="col-span-4 text-right">Subtotal</span>
                        </div>

                        {/* Items Row */}
                        <div className="space-y-2">
                            {orderData.cart.map((item) => (
                                <div key={item.cartItemId} className="grid grid-cols-12 gap-2 items-center text-xs px-0.5 py-0.5 border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                                    <div className="col-span-6 min-w-0 pr-1">
                                        <p className="font-bold text-slate-800 leading-snug">{item.name}</p>
                                        {item.notes && <p className="text-[10px] text-blue-600 truncate">{item.notes}</p>}
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className="text-[11px] font-black text-slate-800 bg-slate-200/80 border border-slate-300/60 px-2 py-0.5 rounded text-center">
                                            x{item.qty}
                                        </span>
                                    </div>
                                    <span className="col-span-4 font-bold text-slate-700 text-right">
                                        {formatRp(item.price * item.qty)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-200 pt-2 space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal</span><span>{formatRp(orderData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Pajak</span><span>{formatRp(orderData.tax)}</span>
                            </div>
                            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                                <span>Total Bayar</span>
                                <span className="text-blue-600">{formatRp(orderData.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* CUSTOMER NAME */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FiUser size={14} /> Nama Pemesan
                        </label>
                        <input
                            ref={customerNameInputRef}
                            type="text"
                            placeholder="Masukkan nama Anda..."
                            value={customerName}
                            onChange={(e) => { setCustomerName(e.target.value); if (error) setError(null); }}
                            className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                                error && !customerName.trim() ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                            }`}
                        />
                    </div>

                    {/* PAYMENT METHOD */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 block">Metode Pembayaran</label>
                        <div className="space-y-2">
                            {qrisEnabled && <button
                                onClick={() => setPaymentMethod('qris')}
                                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                                    paymentMethod === 'qris'
                                        ? 'border-blue-600 bg-blue-50 shadow-md'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    paymentMethod === 'qris' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    <FiGrid size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-xs text-slate-800">QRIS</p>
                                    <p className="text-[10px] text-slate-500">Scan QR code untuk pembayaran instan</p>
                                </div>
                                {paymentMethod === 'qris' && (
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                        <FiCheck size={12} className="text-white" />
                                    </div>
                                )}
                            </button>}

                            <button
                                onClick={() => setPaymentMethod('kasir')}
                                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                                    paymentMethod === 'kasir'
                                        ? 'border-blue-600 bg-blue-50 shadow-md'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    paymentMethod === 'kasir' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    <FiDollarSign size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-xs text-slate-800">Bayar di Kasir</p>
                                    <p className="text-[10px] text-slate-500">Tunjukkan pesanan ini ke kasir</p>
                                </div>
                                {paymentMethod === 'kasir' && (
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                        <FiCheck size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SUBMIT */}
                <div className="p-4 border-t border-slate-100 bg-white space-y-2">
                    {error && (
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                                <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold">{error}</p>
                                    <p className="text-[11px] text-red-500 mt-0.5">Produk di keranjang mungkin sudah tidak tersedia atau data lama tersimpan di browser.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearAndReturn}
                                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer"
                            >
                                <FiTrash2 size={14} />
                                <span>Kosongkan Keranjang & Belanja Ulang</span>
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                        <FiCheck size={16} />
                        {isSubmitting ? 'Mengirim Pesanan...' : 'Kirim Pesanan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
