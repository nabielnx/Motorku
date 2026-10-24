import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { FiX } from 'react-icons/fi';
import { cancelCustomerOrder, reportCustomerPayment } from '@/Api/customerOrders';
import { customerOrderState, rupiah } from '@/Utils/customerOrderState';
import CustomerQrisPayment from './CustomerQrisPayment';

export default function OrderPaymentActions({ order, onUpdate, refresh }) {
    const enabled = usePage().props.app_settings?.customer_qris_enabled === true;
    const state = customerOrderState(order);
    const [dialog, setDialog] = useState(null);
    const [reference, setReference] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const open = type => { setError(''); setDialog(type); };
    const allowed = dialog === 'cancel' ? state.canCancel : state.canPay;
    const submit = async event => {
        event.preventDefault();
        if (busy || !allowed) return;
        setBusy(true); setError('');
        try {
            const data = dialog === 'report'
                ? await reportCustomerPayment(order.order_id, order.customer_token, reference.trim())
                : await cancelCustomerOrder(order.order_id, order.customer_token);
            onUpdate({ ...data, order_id: order.order_id, customer_token: order.customer_token });
            setDialog(null);
        } catch (error) {
            setError(error.response?.data?.message || 'Permintaan belum dapat dipastikan. Perbarui status lalu coba lagi.');
            refresh();
        } finally { setBusy(false); }
    };

    return <>
        {state.canPay && <div className="order-inline-payment">
            {order.expires_at && <small>Bayar sebelum {new Date(order.expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>}
            {order.payment_review_note && <div className="order-notice" role="status"><p>Hubungi toko jika dana sudah terpotong. Jangan transfer ulang sebelum mendapat kepastian.</p></div>}
            <div className="order-inline-actions">
                {enabled && <button className={`order-button ${order.payment_preference === 'qris' ? 'order-button-primary' : ''}`} type="button" onClick={() => open('qris')}>Bayar dengan QRIS</button>}
                <button className="order-text-button" type="button" onClick={() => open('cancel')}>Batalkan pesanan</button>
            </div>
        </div>}
        <Dialog open={Boolean(dialog)} onClose={() => !busy && setDialog(null)} className="order-dialog">
            <div className="order-dialog-backdrop" aria-hidden="true" />
            <div className="order-dialog-position">
                <DialogPanel className="order-dialog-panel">
                    <button type="button" className="order-dialog-close" aria-label="Tutup dialog" onClick={() => setDialog(null)} disabled={busy}><FiX size={20} /></button>
                    <DialogTitle>{dialog === 'qris' ? 'Bayar dengan QRIS' : dialog === 'report' ? 'Sudah berhasil membayar?' : 'Batalkan pesanan ini?'}</DialogTitle>
                    {dialog === 'qris' ? <>
                        {state.canPay ? <CustomerQrisPayment order={order} initiallyOpen compact>
                            <button className="order-button order-button-primary" type="button" onClick={() => open('report')}>Saya sudah membayar</button>
                        </CustomerQrisPayment> : <p>Status pesanan berubah. Tutup dialog untuk melihat informasi terbaru.</p>}
                    </> : <>
                        <p>{dialog === 'report' ? `Pastikan transaksi ${rupiah(order.total)} berhasil. Kasir akan memeriksa dana yang masuk sebelum pesanan ditandai lunas.` : 'Lanjutkan hanya jika Anda belum membayar. Barang akan dikembalikan ke stok toko.'}</p>
                        <form onSubmit={submit}>
                            {dialog === 'report' && <label>Referensi transaksi <span>(opsional)</span><input autoFocus autoComplete="off" maxLength={100} value={reference} onChange={event => setReference(event.target.value)} placeholder="Lihat bukti pembayaran" /></label>}
                            {error && <div className="order-notice order-error" role="alert">{error}</div>}
                            {!allowed && <p role="status">Status pesanan berubah. Tutup dialog dan periksa informasi terbaru.</p>}
                            <div className="order-dialog-actions">
                                <button type="button" className="order-button" onClick={() => setDialog(null)} disabled={busy}>Kembali</button>
                                <button type="submit" className="order-button order-button-primary" disabled={busy || !allowed}>{busy ? 'Mengirim…' : dialog === 'report' ? 'Kirim konfirmasi' : 'Ya, batalkan'}</button>
                            </div>
                        </form>
                    </>}
                </DialogPanel>
            </div>
        </Dialog>
    </>;
}
