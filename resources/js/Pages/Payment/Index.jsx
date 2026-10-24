import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { z } from 'zod';
import { FiArrowRight, FiShoppingBag, FiCreditCard, FiMapPin } from 'react-icons/fi';
import { RiQrCodeLine } from 'react-icons/ri';
import useStorefront from '@/Hooks/useStorefront';
import { createCustomerOrder } from '@/Api/customerOrders';
import { CHECKOUT_ATTEMPT as ATTEMPT, CHECKOUT_DRAFT as DRAFT, prepareCustomerCheckout, finishCustomerCheckout } from '@/Utils/customerCheckout';
import { OrderWorkspace, OrderItems, OrderTotals, PickupDetails } from '@/Components/Customer/OrderWorkspace';

const schema = z.object({ customer_name: z.string().trim().min(2, 'Isi nama pemesan minimal 2 karakter.').max(255), payment_preference: z.enum(['kasir', 'qris']) });
const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };

export default function Payment() {
    const { storage, storeUrl } = useStorefront();
    const qrisEnabled = usePage().props.app_settings?.customer_qris_enabled === true;
    const [data, setData] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [name, setName] = useState('');
    const [method, setMethod] = useState('kasir');
    const [attempt, setAttempt] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [changed, setChanged] = useState(false);
    const submitting = useRef(false);
    const nameRef = useRef(null);
    useEffect(() => {
        try {
            const pending = parse(storage.getItem(ATTEMPT));
            const draft = parse(storage.getItem(DRAFT));
            setData(pending?.display || parse(storage.getItem('motorku_pending_order')));
            setAttempt(pending?.payload ? pending : null);
            setName(pending?.payload?.customer_name || draft?.name || '');
            setMethod(pending?.payload?.payment_preference || draft?.method || 'kasir');
        } catch { setError('Penyimpanan browser tidak tersedia. Aktifkan penyimpanan untuk membuat pesanan.'); }
        setLoaded(true);
    }, [storage]);
    useEffect(() => {
        if (loaded && !attempt) { try { storage.setItem(DRAFT, JSON.stringify({ name, method })); } catch { /* Submission checks persistence before creating an order. */ } }
    }, [name, method, loaded, attempt, storage]);
    const submit = async event => {
        event.preventDefault();
        if (submitting.current || changed) return;
        setError('');
        const validated = schema.safeParse({ customer_name: name, payment_preference: method });
        if (!validated.success) { setError(validated.error.issues[0].message); nameRef.current?.focus(); return; }
        submitting.current = true; setBusy(true);
        let request = attempt;
        try {
            if (!request) {
                request = prepareCustomerCheckout(storage, data, validated.data);
                setAttempt(request);
            }
            const order = await createCustomerOrder(request.payload);
            const saved = finishCustomerCheckout(storage, order);
            router.visit(storeUrl(`/order/waiting?order=${encodeURIComponent(order.id)}${saved.persisted ? '' : '&receipt=temporary'}`));
        } catch (error) {
            const status = error.response?.status;
            if ([400, 403, 422].includes(status)) {
                try { storage.removeItem(ATTEMPT); setAttempt(null); } catch { /* Keep the exact previous attempt if removal fails. */ }
                if (error.response?.data?.errors?.expected_total || error.response?.data?.errors?.items) setChanged(true);
            }
            const retry = error.response?.headers?.['retry-after'];
            setError(status === 429 ? `Terlalu banyak percobaan. Tunggu ${retry || 60} detik, lalu coba lagi.` : error.response?.data?.message || error.message || 'Koneksi terputus. Coba lagi untuk memeriksa pesanan yang sama.');
        } finally { submitting.current = false; setBusy(false); }
    };
    return <OrderWorkspace title="Checkout">
        <div className="order-page-title"><div><span className="order-eyebrow">Selesaikan pesanan</span><h1>Checkout</h1><p>Periksa barang dan pilih cara pembayaran.</p></div></div>
        {!loaded ? <section className="order-panel" role="status">Memuat keranjang…</section> : !data?.cart?.length ? <section className="order-panel order-empty"><FiShoppingBag size={36} /><h2>Keranjang belum tersedia</h2><p>{error || 'Pilih sparepart yang Anda butuhkan terlebih dahulu.'}</p><Link className="order-button order-button-primary" href={storeUrl('/')}>Mulai belanja</Link></section> : <div className="order-grid order-grid-checkout">
            <div className="order-stack"><section className="order-panel"><div className="order-section-title"><h2>Barang pesanan</h2><small>{data.cart.reduce((sum, item) => sum + item.qty, 0)} barang</small></div><OrderItems items={data.cart} draft />
                {!attempt && <Link className="order-text-button" href={storeUrl('/')} style={{ marginTop: 16 }}>Ubah keranjang<FiArrowRight size={15} /></Link>}
            </section><PickupDetails /></div>
            <form onSubmit={submit} className="order-panel order-checkout-form">
                <h2 style={{ marginBottom: 20 }}>Detail pemesan</h2>
                <label htmlFor="customer-name">Nama pemesan<input ref={nameRef} id="customer-name" type="text" autoComplete="name" maxLength={255} value={name} onChange={event => setName(event.target.value)} disabled={busy || Boolean(attempt)} required aria-describedby="customer-name-help" /></label>
                <span id="customer-name-help" className="order-field-help">Nama ini digunakan saat mengambil pesanan.</span>
                <fieldset disabled={busy || Boolean(attempt)}><legend>Metode pembayaran</legend>
                    {[{ value: 'kasir', title: 'Bayar di kasir', help: 'Bayar saat datang ke toko.', Icon: FiCreditCard }, ...(qrisEnabled || method === 'qris' ? [{ value: 'qris', title: 'QRIS', help: 'Scan QRIS setelah pesanan dibuat.', Icon: RiQrCodeLine }] : [])].map(({ value, title, help, Icon }) => <label className="order-payment-option" key={value}><input type="radio" name="payment" value={value} checked={method === value} onChange={() => setMethod(value)} /><Icon size={21} aria-hidden="true" /><span><strong>{title}</strong><small>{help}</small></span></label>)}
                </fieldset>
                <OrderTotals order={data} />
                {attempt && !busy && <div className="order-notice" style={{ marginTop: 16 }} role="status">Pengiriman sebelumnya belum terkonfirmasi. Coba lagi untuk memeriksa pesanan yang sama; rincian dikunci agar tidak membuat pesanan ganda.</div>}
                {error && <div className="order-notice order-error" style={{ marginTop: 16 }} role="alert">{error}</div>}
                {changed ? <Link className="order-button order-button-primary" href={storeUrl('/')}>Perbarui keranjang<FiArrowRight size={16} /></Link> : <button type="submit" className="order-button order-button-primary" disabled={busy}>{busy ? 'Memproses pesanan…' : attempt ? 'Periksa & lanjutkan pesanan' : method === 'qris' ? 'Buat pesanan & bayar QRIS' : 'Buat pesanan'}<FiArrowRight size={16} /></button>}
                <p className="order-checkout-footnote"><FiMapPin size={12} style={{ display: 'inline', marginRight: 3 }} />Pengambilan di toko. Belum ada pembayaran yang ditarik.</p>
            </form>
        </div>}
    </OrderWorkspace>;
}
