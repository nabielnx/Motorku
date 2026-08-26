import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { FiArrowLeft, FiClock, FiCheckCircle, FiPrinter, FiUser, FiMapPin } from 'react-icons/fi';

const formatRp = (val) => `Rp ${(Number(val) || 0).toLocaleString('id-ID')}`;

export default function OrderShow({ orderId }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        const fetch = async () => {
            try {
                const res = await axios.get(`/api/orders/${orderId}`);
                setOrder(res.data);
            } catch {
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [orderId]);

    if (loading) {
        return (
            <AuthenticatedLayout pageTitle="Loading...">
                <div className="max-w-4xl mx-auto py-12 text-center text-sm text-slate-400">Memuat data pesanan...</div>
            </AuthenticatedLayout>
        );
    }

    if (!order) {
        return (
            <AuthenticatedLayout pageTitle="Order Not Found">
                <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
                    <p className="text-sm text-slate-500">Pesanan tidak ditemukan</p>
                    <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">Kembali</Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    const statusTimeline = [
        { label: 'Diterima', time: order.created_at, done: true },
        { label: 'Diproses', time: order.ordered_at, done: ['preparing', 'ready', 'completed'].includes(order.order_status) },
        { label: 'Siap', time: null, done: ['ready', 'completed'].includes(order.order_status) },
        { label: 'Selesai', time: null, done: order.order_status === 'completed' },
    ];

    return (
        <AuthenticatedLayout pageTitle={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number} - Toko Sparepart`}>
                <meta name="description" content={`Detail rincian transaksi dan status pesanan ${order.order_number} di Toko Sparepart.`} />
            </Head>
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                    <FiArrowLeft size={16} />
                    Back to Orders
                </Link>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">{order.order_number}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><FiUser size={13} /> {order.customer_name || 'Walk-in'}</span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md"><FiMapPin size={13} /> Ambil di Toko</span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><FiClock size={13} /> {order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs ${
                                order.payment_status === 'paid' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                            }`}>{order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase shadow-2xs ${
                                order.order_status === 'completed' ? 'bg-blue-600 text-white' :
                                order.order_status === 'cancelled' ? 'bg-rose-600 text-white' : 
                                order.order_status === 'ready' ? 'bg-emerald-600 text-white' :
                                'bg-yellow-400 text-white'
                            }`}>{order.order_status}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h4 className="font-black text-slate-900">Order Items</h4>
                        </div>
                        {order.items?.length > 0 && (
                            <div className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="px-5 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{item.product_name}</p>
                                            {item.notes && <p className="text-xs text-slate-400 mt-0.5">"{item.notes}"</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">{formatRp(item.subtotal)}</p>
                                            <p className="text-xs text-slate-400 font-semibold">{item.quantity}x @ {formatRp(item.unit_price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-5 bg-slate-50/50 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500 font-semibold"><span>Subtotal</span><span>{formatRp(order.subtotal)}</span></div>
                            {Number(order.discount_amount) > 0 && <div className="flex justify-between text-sm text-red-500 font-semibold"><span>Diskon</span><span>-{formatRp(order.discount_amount)}</span></div>}
                            {Number(order.tax_amount) > 0 && <div className="flex justify-between text-sm text-slate-500 font-semibold"><span>Pajak</span><span>{formatRp(order.tax_amount)}</span></div>}
                            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>{formatRp(order.total)}</span></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm h-fit">
                        <h4 className="font-black text-slate-900 mb-5">Status Timeline</h4>
                        <div className="space-y-0">
                            {statusTimeline.map((step, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full mt-1 ${step.done ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                        {idx < statusTimeline.length - 1 && <div className={`w-0.5 h-10 ${step.done ? 'bg-blue-200' : 'bg-slate-100'}`}></div>}
                                    </div>
                                    <div className="pb-6">
                                        <p className={`text-sm font-bold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                                        {step.time && <p className="text-xs text-slate-400 font-semibold">{new Date(step.time).toLocaleString('id-ID')}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {order.cashier && <div className="pt-4 border-t border-slate-100 mt-2"><p className="text-xs font-bold text-slate-400 uppercase">Cashier</p><p className="text-sm font-black text-slate-800 mt-1">{order.cashier?.name || '-'}</p></div>}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
