import { Head, Link, usePage } from '@inertiajs/react';
import { FiArrowLeft, FiArrowUpRight, FiMapPin, FiPhone, FiPackage } from 'react-icons/fi';
import useStorefront from '@/Hooks/useStorefront';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import { orderDate, rupiah } from '@/Utils/customerOrderState';
import '../../../css/customer-orders.css';

export function OrderWorkspace({ title, backLabel = 'Kembali belanja', back = '/', children, compact = false }) {
    const { storeUrl } = useStorefront();
    const { app_settings: settings } = usePage().props;
    useForceLightTheme();
    return <div className={`customer-storefront order-workspace${compact ? ' order-workspace-simple' : ''}`}>
        <Head title={`${title} · ${settings?.store_name || 'Motorku'}`} />
        <header className="order-topbar"><div>
            <Link href={storeUrl('/')} className="order-brand"><span className="order-brand-icon"><FiPackage size={19} /></span>{settings?.store_name || 'Motorku'}</Link>
            <Link href={storeUrl(back)} className="order-text-button"><FiArrowLeft size={16} />{backLabel}</Link>
        </div></header>
        <main className="order-container">{children}</main>
        <footer className="order-footer"><span>{settings?.store_name || 'Motorku'}</span><span>Pesan online, ambil di toko.</span></footer>
    </div>;
}

export function ConnectionNotice({ order }) {
    if (order.connection === 'fresh') return null;
    if (!order.connection) return <p className="order-sync-line" role="status">Memeriksa status pesanan...</p>;
    const archive = ['completed', 'cancelled'].includes(order.order_status) && order.connection === 'unavailable';
    return <div className={`order-notice${archive ? ' order-archive-notice' : ''}`} role="status">
        <strong>{archive ? 'Salinan riwayat' : order.connection === 'unavailable' ? 'Status pesanan belum dapat diperiksa' : 'Status belum diperbarui'}</strong>
        <p>{archive ? 'Menampilkan riwayat yang tersimpan di perangkat ini. Status terbaru tidak dapat diverifikasi. Hubungi toko jika memerlukan pengecekan.' : order.connection === 'unavailable' ? 'Akses riwayat ini tidak cocok dengan data toko. Hubungi toko dengan nomor pesanan sebelum melakukan pembayaran.' : 'Menampilkan data terakhir di perangkat ini. Perbarui status sebelum melanjutkan pembayaran.'}</p>
        {order.lastSynced && <small>Terakhir diperbarui {orderDate(order.lastSynced)}</small>}
    </div>;
}

export function OrderItems({ items = [], draft = false }) {
    return <ul className="order-items">{items.map((item, index) => {
        const quantity = draft ? item.qty : item.quantity;
        const price = draft ? item.price : item.unit_price;
        return <li key={item.cartItemId || item.id || index}>
            <span className="order-item-qty">{quantity}×</span>
            <div className="order-item-name"><strong>{item.product_name || item.name}</strong><span>{rupiah(price)} / item</span>{item.notes && <small>Catatan: {item.notes}</small>}</div>
            <strong className="order-item-total">{rupiah(item.subtotal ?? price * quantity)}</strong>
        </li>;
    })}</ul>;
}

export function OrderTotals({ order }) {
    return <dl className="order-totals">
        <div><dt>Subtotal</dt><dd>{rupiah(order.subtotal)}</dd></div>
        {Number(order.discount_amount) > 0 && <div><dt>Diskon</dt><dd>−{rupiah(order.discount_amount)}</dd></div>}
        <div><dt>Pajak</dt><dd>{rupiah(order.tax_amount ?? order.tax)}</dd></div>
        <div className="order-total"><dt>Total pesanan</dt><dd>{rupiah(order.total)}</dd></div>
        {Number(order.refunded_amount) > 0 && <><div><dt>Dana dikembalikan</dt><dd>−{rupiah(order.refunded_amount)}</dd></div><div><dt>Nilai setelah refund</dt><dd>{rupiah(Math.max(0, Number(order.total) - Number(order.refunded_amount)))}</dd></div></>}
    </dl>;
}

export function PickupDetails({ flat = false }) {
    const { app_settings: settings } = usePage().props;
    const phone = settings?.store_phone;
    return <section className={flat ? 'order-receipt-pickup' : 'order-panel order-pickup'}><div className="order-section-title"><FiMapPin size={18} /><h2>Ambil di toko</h2></div>
        <strong>{settings?.store_name || 'Motorku'}</strong>
        <p>{settings?.store_address || 'Tunjukkan nomor pesanan kepada kasir saat pengambilan.'}</p>
        {phone && <a className="order-text-button" href={`tel:${phone.replace(/[^+\d]/g, '')}`}><FiPhone size={15} />{phone}<FiArrowUpRight size={14} /></a>}
    </section>;
}

export function RefundDetails({ order, flat = false }) {
    if (!order.refunds?.length) return null;
    return <section className={flat ? 'order-receipt-refunds' : 'order-panel'}><div className="order-section-title"><h2>Pengembalian dana</h2><span className="order-badge">{rupiah(order.refunded_amount)}</span></div>
        <ul className="order-refunds">{order.refunds.map(refund => <li key={refund.id}><div><strong>{refund.quantity}× {refund.product_name}</strong><p>{refund.reason}</p><small>{orderDate(refund.created_at)} · {refund.method === 'cash' ? 'Tunai' : refund.method === 'qris_manual' ? 'QRIS' : 'Transfer'}</small></div><strong>{rupiah(refund.amount)}</strong></li>)}</ul>
    </section>;
}
