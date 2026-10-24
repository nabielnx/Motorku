import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { z } from 'zod';
import { FiArrowLeft, FiShoppingBag, FiCreditCard, FiMapPin, FiPackage } from 'react-icons/fi';
import { RiQrCodeLine } from 'react-icons/ri';
import useStorefront from '@/Hooks/useStorefront';
import { createCustomerOrder } from '@/Api/customerOrders';
import { CHECKOUT_ATTEMPT as ATTEMPT, CHECKOUT_DRAFT as DRAFT, prepareCustomerCheckout, finishCustomerCheckout } from '@/Utils/customerCheckout';
import { rupiah } from '@/Utils/customerOrderState';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import '../../../css/customer-orders.css';

const schema = z.object({ customer_name: z.string().trim().min(2, 'Isi nama pemesan minimal 2 karakter.').max(255), payment_preference: z.enum(['kasir', 'qris']) });
const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };

export default function Payment() {
    const { storage, storeUrl } = useStorefront();
    const page = usePage();
    useForceLightTheme();
    const qrisEnabled = page.props.app_settings?.customer_qris_enabled === true;
    const [data, setData] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [name, setName] = useState('');
    const [method, setMethod] = useState('kasir');
    const [attempt, setAttempt] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [nameError, setNameError] = useState('');
    const [changed, setChanged] = useState(false);
    const submitting = useRef(false);
    const nameRef = useRef(null);
    const feedbackRef = useRef(null);
    useEffect(() => { if (error) feedbackRef.current?.scrollIntoView({ block: 'center' }); }, [error]);
    useEffect(() => {
        try {
            const pending = parse(storage.getItem(ATTEMPT));
            const draft = parse(storage.getItem(DRAFT));
            setData(pending?.display || parse(storage.getItem('motorku_pending_order')));
            setAttempt(pending?.payload ? pending : null);
            setName(pending?.payload?.customer_name || draft?.name || '');
            setMethod(pending?.payload?.payment_preference || (qrisEnabled && draft?.method === 'qris' ? 'qris' : 'kasir'));
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
        setNameError('');
        const validated = schema.safeParse({ customer_name: name, payment_preference: method });
        if (!validated.success) { setNameError(validated.error.issues[0].message); nameRef.current?.focus(); nameRef.current?.scrollIntoView({ block: 'center' }); return; }
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

    const settings = page.props.app_settings || {};
    const itemCount = data?.cart?.reduce((sum, item) => sum + Number(item.qty), 0) || 0;
    const locked = busy || Boolean(attempt);
    const methods = [
        { value: 'kasir', title: 'Bayar di kasir', description: 'Bayar saat mengambil pesanan.', Icon: FiCreditCard },
        ...(qrisEnabled || attempt?.payload?.payment_preference === 'qris'
            ? [{ value: 'qris', title: 'QRIS', description: 'Kode QR tersedia setelah pesanan dibuat.', Icon: RiQrCodeLine }] : []),
    ];

    return (
        <div className="customer-storefront order-workspace checkout-page">
            <Head title={`Checkout · ${settings.store_name || 'Motorku'}`} />
            <header className="checkout-header">
                <div>
                    <Link href={storeUrl('/?openCart=1')} className="checkout-back" aria-label="Kembali ke keranjang"><FiArrowLeft size={21} /></Link>
                    <h1>Checkout</h1>
                    <Link className="checkout-store" href={storeUrl('/')}>{settings.store_name || 'Motorku'}</Link>
                </div>
            </header>
            <main className="checkout-content">
                {!loaded ? <div className="checkout-empty" role="status">Memuat keranjang…</div> : !data?.cart?.length ? (
                    <section className="checkout-empty">
                        <FiShoppingBag size={32} aria-hidden="true" />
                        <h2>Keranjang belum tersedia</h2>
                        <p>{error || 'Pilih barang terlebih dahulu untuk melanjutkan checkout.'}</p>
                        <Link className="order-button order-button-primary" href={storeUrl('/')}>Mulai belanja</Link>
                    </section>
                ) : (
                    <form className="checkout-layout" onSubmit={submit} noValidate aria-busy={busy}>
                        <div className="checkout-sheet">
                            <section className="checkout-section checkout-pickup">
                                <h2><FiMapPin size={18} aria-hidden="true" />Ambil di toko</h2>
                                <p><strong>{settings.store_name || 'Motorku'}</strong>{settings.store_address && <> · {settings.store_address}</>}</p>
                                <label htmlFor="customer-name">Nama pemesan</label>
                                <input
                                    ref={nameRef} id="customer-name" type="text" autoComplete="name"
                                    placeholder="Nama untuk pengambilan" maxLength={255} value={name}
                                    onChange={event => { setName(event.target.value); setNameError(''); }}
                                    disabled={locked} required aria-invalid={Boolean(nameError)}
                                    aria-describedby={nameError ? 'customer-name-error' : undefined}
                                />
                                {nameError && <p id="customer-name-error" className="checkout-field-error" role="alert">{nameError}</p>}
                            </section>
                            <section className="checkout-section checkout-products">
                                <div className="checkout-section-heading">
                                    <h2>Produk dipesan <span>({itemCount})</span></h2>
                                    {!attempt && <Link href={storeUrl('/?openCart=1')}>Ubah</Link>}
                                </div>
                                <ul>
                                    {data.cart.map((item, index) => <CheckoutProduct key={item.cartItemId || `${item.id}-${index}`} item={item} />)}
                                </ul>
                            </section>
                            <fieldset className="checkout-section checkout-methods" disabled={locked}>
                                <legend>Metode pembayaran</legend>
                                {methods.map(({ value, title, description, Icon }) => (
                                    <label className="checkout-method" key={value}>
                                        <Icon size={20} aria-hidden="true" />
                                        <span><strong>{title}</strong><small>{description}</small></span>
                                        <input type="radio" name="payment" value={value} checked={method === value} onChange={() => setMethod(value)} />
                                    </label>
                                ))}
                            </fieldset>
                        </div>
                        <aside className="checkout-summary">
                            <h2>Ringkasan pembayaran</h2>
                            <dl>
                                <div><dt>Subtotal ({itemCount} barang)</dt><dd>{rupiah(data.subtotal)}</dd></div>
                                {Number(data.tax) > 0 && <div><dt>Pajak</dt><dd>{rupiah(data.tax)}</dd></div>}
                                <div className="checkout-summary-total"><dt>Total pembayaran</dt><dd>{rupiah(data.total)}</dd></div>
                            </dl>
                            {attempt && !busy && !error && <div className="checkout-feedback" role="status">Pesanan sebelumnya belum terkonfirmasi. Tekan “Periksa pesanan” untuk melanjutkan pesanan yang sama.</div>}
                            {error && <div ref={feedbackRef} className="checkout-feedback checkout-feedback-error" role="alert">{error}</div>}
                            <div className="checkout-submit">
                                <div className="checkout-mobile-total"><span>Total pembayaran</span><strong>{rupiah(data.total)}</strong></div>
                                {changed ? <Link className="order-button order-button-primary" href={storeUrl('/?openCart=1')}>Perbarui keranjang</Link> : (
                                    <button type="submit" className="order-button order-button-primary" disabled={busy}>
                                        {busy ? 'Memproses…' : attempt ? 'Periksa pesanan' : 'Buat pesanan'}
                                    </button>
                                )}
                            </div>
                        </aside>
                    </form>
                )}
            </main>
        </div>
    );
}

function CheckoutProduct({ item }) {
    const [failed, setFailed] = useState(false);
    return (
        <li className="checkout-product">
            <div className="checkout-product-image">
                {item.image && !failed
                    ? <img src={item.image} alt="" loading="lazy" onError={() => setFailed(true)} />
                    : <FiPackage size={24} aria-hidden="true" />}
            </div>
            <div className="checkout-product-info">
                <h3>{item.name}</h3>
                {item.notes && <p>{item.notes}</p>}
                <div><strong>{rupiah(item.price)}</strong><span>×{item.qty}</span></div>
            </div>
        </li>
    );
}
