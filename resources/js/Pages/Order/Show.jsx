import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiArrowLeft, FiClock, FiCheckCircle, FiPrinter, FiUser, FiMapPin } from 'react-icons/fi';

const formatRp = (val) => `Rp ${(Number(val) || 0).toLocaleString('id-ID')}`;

export default function OrderShow({ orderId }) {
    const isOwner = usePage().props.auth?.roles?.includes('owner');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [returningItem, setReturningItem] = useState(null);
    const [returnQty, setReturnQty] = useState(1);
    const [restock, setRestock] = useState(true);
    const [returnReason, setReturnReason] = useState('');
    const [cashRefunded, setCashRefunded] = useState(false);
    const [savingReturn, setSavingReturn] = useState(false);
    const returnRequestId = useRef(null);

    useEffect(() => {
        if (!orderId) return;
        const fetch = async () => {
            try {
                const res = await axios.get(`/api/orders/${orderId}`);
                setOrder(res.data?.data || null);
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

    const returnedQty = (itemId) => (order.returns || []).filter(r => r.order_item_id === itemId).reduce((sum, r) => sum + Number(r.quantity), 0);
    const returnAmount = returningItem ? (() => {
        const prior = (order.returns || []).reduce((sum, r) => sum + Number(r.amount), 0);
        const allQty = (order.items || []).reduce((sum, item) => sum + Number(item.quantity), 0);
        const alreadyQty = (order.returns || []).reduce((sum, r) => sum + Number(r.quantity), 0);
        if (alreadyQty + Number(returnQty) === allQty) return Math.max(0, Number(order.total) - prior);
        return Number(order.subtotal) > 0
            ? Math.min(Math.max(0, Number(order.total) - prior), Math.round(Number(order.total) * Number(returningItem.subtotal) / Number(order.subtotal) * Number(returnQty) / Number(returningItem.quantity) * 100) / 100)
            : 0;
    })() : 0;

    const submitReturn = async () => {
        if (!returningItem || savingReturn) return;
        setSavingReturn(true);
        try {
            const response = await axios.post(`/api/orders/${order.id}/returns`, {
                order_item_id: returningItem.id,
                request_id: returnRequestId.current,
                quantity: Number(returnQty),
                restock,
                reason: returnReason,
                cash_refunded: cashRefunded,
            });
            setOrder(response.data.data);
            setReturningItem(null);
            returnRequestId.current = null;
            setReturnReason('');
            setCashRefunded(false);
            toast.success('Retur tercatat. Uang dan stok sudah diperbarui.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mencatat retur. Periksa data lalu coba lagi.');
        } finally {
            setSavingReturn(false);
        }
    };

    return (
        <AuthenticatedLayout pageTitle={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`}>
                <meta name="description" content={`Detail rincian transaksi dan status pesanan ${order.order_number} di Motorku.`} />
            </Head>
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                    <FiArrowLeft size={16} />
                    Kembali ke Pesanan
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
                                order.payment_status === 'paid' ? 'bg-emerald-600 text-white' : order.payment_status === 'refunded' ? 'bg-slate-600 text-white' : 'bg-amber-500 text-white'
                            }`}>{order.payment_status === 'refunded' ? 'RETUR PENUH' : order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</span>
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
                            <h4 className="font-black text-slate-900">Rincian Barang</h4>
                        </div>
                        {order.items?.length > 0 && (
                            <div className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="px-5 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{item.product_name}</p>
                                            {item.notes && <p className="text-xs text-slate-400 mt-0.5">"{item.notes}"</p>}
                                            {returnedQty(item.id) > 0 && <p className="text-xs text-amber-700 mt-1">Diretur: {returnedQty(item.id)} dari {item.quantity}</p>}
                                            {isOwner && order.payment_method === 'cash' && order.payment_status === 'paid' && returnedQty(item.id) < item.quantity && (
                                                <button type="button" onClick={() => { setReturningItem(item); returnRequestId.current = crypto.randomUUID(); setReturnQty(1); setRestock(true); setReturnReason(''); setCashRefunded(false); }} className="text-xs font-bold text-blue-600 mt-2">Retur barang ini</button>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">{formatRp(item.subtotal)}</p>
                                            <p className="text-xs text-slate-400 font-semibold">{item.quantity}x @ {formatRp(item.unit_price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {returningItem && (
                            <div className="p-5 border-t border-slate-200 bg-blue-50 space-y-3">
                                <p className="text-sm font-bold">Retur: {returningItem.product_name}</p>
                                <label className="block text-xs font-semibold">Jumlah (maks. {returningItem.quantity - returnedQty(returningItem.id)})
                                    <input type="number" min="1" max={returningItem.quantity - returnedQty(returningItem.id)} value={returnQty} onChange={e => setReturnQty(e.target.value)} className="mt-1 w-full rounded border-slate-300" />
                                </label>
                                <label className="block text-xs font-semibold">Alasan
                                    <input type="text" maxLength="255" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Contoh: ukuran tidak cocok" className="mt-1 w-full rounded border-slate-300" />
                                </label>
                                <label className="flex gap-2 text-xs"><input type="checkbox" checked={restock} onChange={e => setRestock(e.target.checked)} /> Barang masih layak jual, masukkan kembali ke stok</label>
                                <p className="text-sm font-bold">Uang yang dikembalikan: {formatRp(returnAmount)}</p>
                                <label className="flex gap-2 text-xs"><input type="checkbox" checked={cashRefunded} onChange={e => setCashRefunded(e.target.checked)} /> Saya sudah mengembalikan uang tunai kepada pelanggan</label>
                                <div className="flex gap-2">
                                    <button type="button" disabled={savingReturn || !returnReason.trim() || !cashRefunded || Number(returnQty) < 1 || Number(returnQty) > returningItem.quantity - returnedQty(returningItem.id)} onClick={submitReturn} className="rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{savingReturn ? 'Menyimpan...' : 'Catat Retur'}</button>
                                    <button type="button" disabled={savingReturn} onClick={() => { setReturningItem(null); returnRequestId.current = null; }} className="text-xs">Batal</button>
                                </div>
                            </div>
                        )}
                        {(order.returns || []).length > 0 && (
                            <div className="p-5 border-t border-slate-200 space-y-1 text-xs">
                                <p className="font-bold">Riwayat retur</p>
                                {order.returns.map(r => <p key={r.id}>{r.product_name}: {r.quantity} × · {formatRp(r.amount)} · {r.restocked ? 'stok kembali' : 'tidak masuk stok'}</p>)}
                            </div>
                        )}
                        <div className="p-5 bg-slate-50/50 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500 font-semibold"><span>Subtotal</span><span>{formatRp(order.subtotal)}</span></div>
                            {Number(order.discount_amount) > 0 && <div className="flex justify-between text-sm text-red-500 font-semibold"><span>Diskon</span><span>-{formatRp(order.discount_amount)}</span></div>}
                            {Number(order.tax_amount) > 0 && <div className="flex justify-between text-sm text-slate-500 font-semibold"><span>Pajak</span><span>{formatRp(order.tax_amount)}</span></div>}
                            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>{formatRp(order.total)}</span></div>
                            {(order.returns || []).length > 0 && <>
                                <div className="flex justify-between text-sm text-rose-600"><span>Uang Diretur</span><span>− {formatRp(order.returns.reduce((sum, r) => sum + Number(r.amount), 0))}</span></div>
                                <div className="flex justify-between text-sm font-bold"><span>Penjualan Tersisa</span><span>{formatRp(Number(order.total) - order.returns.reduce((sum, r) => sum + Number(r.amount), 0))}</span></div>
                            </>}
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
