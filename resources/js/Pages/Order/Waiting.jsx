import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { FiRefreshCw, FiCopy, FiShoppingBag } from 'react-icons/fi';
import useStorefront from '@/Hooks/useStorefront';
import useCustomerOrders from '@/Hooks/useCustomerOrders';
import { customerOrderState, orderDate, rupiah } from '@/Utils/customerOrderState';
import { OrderWorkspace, ConnectionNotice, OrderItems, PickupDetails, RefundDetails } from '@/Components/Customer/OrderWorkspace';
import OrderPaymentActions from '@/Components/Customer/OrderPaymentActions';

export default function Waiting() {
    const { storage, storeUrl } = useStorefront();
    const { orders, syncing, refresh, update, storageError } = useCustomerOrders(storage);
    const id = new URLSearchParams(window.location.search).get('order');
    const order = id ? orders.find(row => row.order_id === id) : orders[0];
    const [copied, setCopied] = useState(false);
    const state = order && customerOrderState(order);
    const copy = async () => {
        try { await navigator.clipboard.writeText(order.order_number); setCopied(true); }
        catch { setCopied(false); }
    };

    return (
        <OrderWorkspace title="Detail pesanan" back="/order/status" backLabel="Pesanan saya" compact>
            <div className="order-page-title">
                <h1>Detail pesanan</h1>
                <button type="button" className="order-icon-button" onClick={() => refresh()} disabled={syncing} aria-label={syncing ? 'Memeriksa status pesanan' : 'Perbarui status pesanan'} title="Perbarui">
                    <FiRefreshCw size={18} />
                </button>
            </div>
            {!order ? (
                <section className="order-panel order-empty">
                    <FiShoppingBag size={32} /><h2>Pesanan belum tersedia</h2>
                    <p>Buka riwayat di perangkat yang digunakan saat memesan.</p>
                    <Link href={storeUrl('/order/status')} className="order-button">Lihat pesanan saya</Link>
                </section>
            ) : <>
                {(storageError || new URLSearchParams(window.location.search).get('receipt') === 'temporary') && <div className="order-notice order-error" role="alert">Pesanan sudah dibuat, tetapi belum tersimpan di browser. Salin nomor pesanan sebelum menutup halaman ini.</div>}
                <ConnectionNotice order={order} />
                <article className="order-receipt">
                    <header className="order-receipt-header">
                        <div><strong>{order.order_number}</strong><p>{orderDate(order.ordered_at || order.created_at)} · {order.customer_name}</p></div>
                        <button type="button" className="order-icon-button" onClick={copy} aria-label={copied ? 'Nomor disalin' : 'Salin nomor pesanan'} title={copied ? 'Disalin' : 'Salin nomor'}><FiCopy size={16} /></button>
                    </header>
                    <section className="order-receipt-status">
                        <h2>{state.title}</h2>
                        <p>{state.description}</p>
                        <OrderPaymentActions order={order} onUpdate={update} refresh={refresh} />
                    </section>
                    <section className="order-receipt-items">
                        <h2>Barang pesanan</h2>
                        <OrderItems items={order.items} />
                        <div className="order-receipt-total"><span>Total pesanan</span><strong>{rupiah(order.total)}</strong></div>
                        <details className="order-disclosure">
                            <summary>Rincian pembayaran</summary>
                            <dl>
                                <div><dt>Subtotal</dt><dd>{rupiah(order.subtotal)}</dd></div>
                                {Number(order.discount_amount) > 0 && <div><dt>Diskon</dt><dd>−{rupiah(order.discount_amount)}</dd></div>}
                                <div><dt>Pajak</dt><dd>{rupiah(order.tax_amount)}</dd></div>
                                <div><dt>Pembayaran</dt><dd>{state.payment}</dd></div>
                                <div><dt>Metode</dt><dd>{order.payment_method === 'qris_manual' || order.payment_preference === 'qris' ? 'QRIS' : 'Bayar di kasir'}</dd></div>
                                {order.paid_at && <div><dt>Dibayar</dt><dd>{orderDate(order.paid_at)}</dd></div>}
                                {order.invoice_number && <div><dt>Invoice</dt><dd>{order.invoice_number}</dd></div>}
                                {order.payment_reference && <div><dt>Referensi</dt><dd>{order.payment_reference}</dd></div>}
                                {state.review && <div><dt>Konfirmasi dikirim</dt><dd>{orderDate(order.payment_review_requested_at)}</dd></div>}
                            </dl>
                        </details>
                    </section>
                    <RefundDetails order={order} flat />
                    <PickupDetails flat />
                </article>
                {(state.cancelled || state.expired || order.order_status === 'completed') && <Link href={storeUrl('/')} className="order-button order-button-primary order-shop-again">Belanja lagi</Link>}
            </>}
        </OrderWorkspace>
    );
}
