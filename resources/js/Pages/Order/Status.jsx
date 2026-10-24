import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { FiRefreshCw, FiShoppingBag, FiChevronRight } from 'react-icons/fi';
import useStorefront from '@/Hooks/useStorefront';
import useCustomerOrders from '@/Hooks/useCustomerOrders';
import { customerOrderState, isActiveOrder, orderDate, rupiah } from '@/Utils/customerOrderState';
import { OrderWorkspace } from '@/Components/Customer/OrderWorkspace';

function HistoryRow({ order, storeUrl }) {
    const state = customerOrderState(order);
    const items = order.items || [];
    const quantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const label = state.cancelled || state.expired ? state.fulfillment
        : state.paid && !state.refunded && !state.partialRefund ? state.fulfillment : state.payment;

    return (
        <Link className="order-list-row" href={storeUrl(`/order/waiting?order=${encodeURIComponent(order.order_id)}`)} aria-label={`Lihat pesanan ${order.order_number}`}>
            <div className="order-list-top">
                <span className="order-list-number">{order.order_number}</span>
                <span className={`order-badge order-badge-${state.tone}`}>{label}</span>
            </div>
            <div className="order-list-main">
                <div>
                    <h2>{items[0]?.product_name || items[0]?.name || 'Pesanan toko'}</h2>
                    <p>{quantity} barang · {orderDate(order.ordered_at || order.created_at)}</p>
                    {order.connection === 'unavailable' && (isActiveOrder(order) ? <small>Status pesanan belum dapat diperiksa</small> : <small className="order-archive-note">Salinan riwayat di perangkat ini</small>)}
                    {order.connection === 'stale' && <small>Status belum diperbarui</small>}
                </div>
                <strong>{rupiah(order.total)}</strong>
                <FiChevronRight size={18} aria-hidden="true" />
            </div>
            {Number(order.refunded_amount) > 0 && <p className="order-list-refund">Refund {rupiah(order.refunded_amount)}</p>}
        </Link>
    );
}

export default function Status() {
    const { storage, storeUrl } = useStorefront();
    const { orders, syncing, refresh, storageError, archivedCount, cleanArchived, restoreArchived } = useCustomerOrders(storage);
    const [filter, setFilter] = useState('all');
    const active = orders.filter(isActiveOrder);
    const closed = orders.filter(order => !isActiveOrder(order));
    const visible = filter === 'active' ? active : filter === 'closed' ? closed : orders;
    const inaccessibleClosed = closed.filter(order => order.connection === 'unavailable').length;
    const filters = [
        { value: 'all', label: 'Semua', count: orders.length },
        { value: 'active', label: 'Aktif', count: active.length },
        { value: 'closed', label: 'Selesai', count: closed.length },
    ];

    return (
        <OrderWorkspace title="Pesanan saya" compact>
            <div className="order-page-title">
                <div><h1>Pesanan saya</h1><p>Riwayat di perangkat ini</p></div>
                <button type="button" className="order-icon-button" onClick={() => refresh()} disabled={syncing} aria-label={syncing ? 'Memeriksa pesanan' : 'Perbarui semua pesanan'} title="Perbarui">
                    <FiRefreshCw size={18} />
                </button>
            </div>
            {storageError && <div className="order-notice order-error" role="alert">Riwayat belum dapat disimpan. Catat nomor pesanan Anda.</div>}
            <div className="order-filters" aria-label="Filter pesanan">
                {filters.map(option => (
                    <button type="button" key={option.value} aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
                        {option.label}<span className="order-filter-count">{option.count}</span>
                    </button>
                ))}
            </div>
            {visible.length ? (
                <div className="order-list">
                    {visible.map(order => <HistoryRow key={order.order_id} order={order} storeUrl={storeUrl} />)}
                </div>
            ) : (
                <section className="order-panel order-empty">
                    <FiShoppingBag size={32} />
                    <h2>{orders.length ? 'Tidak ada pesanan di sini' : 'Belum ada pesanan'}</h2>
                    <p>{orders.length ? 'Lihat pesanan melalui filter lainnya.' : 'Pesanan Anda akan muncul setelah checkout.'}</p>
                    <Link href={storeUrl('/')} className="order-button order-button-primary">Mulai belanja</Link>
                </section>
            )}
            {(archivedCount > 0 || inaccessibleClosed > 0) && <div className="order-history-cleanup">
                {archivedCount > 0 && <><span>{archivedCount} riwayat lama disembunyikan.</span><button type="button" className="order-text-button" onClick={restoreArchived}>Pulihkan</button></>}
                {inaccessibleClosed > 0 && <button type="button" className="order-text-button" onClick={cleanArchived}>Bersihkan riwayat lama</button>}
            </div>}
        </OrderWorkspace>
    );
}
