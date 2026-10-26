import { Link, useForm, usePage } from '@inertiajs/react';
import { OrderWorkspace } from '@/Components/Customer/OrderWorkspace';
import useStorefront from '@/Hooks/useStorefront';
import { AccountField } from './Auth';
import AccountAvatar from '@/Components/Customer/AccountAvatar';
import { customerProfileSchema } from '@/Utils/customerAuth';
import { FiCheckCircle, FiLogOut, FiShoppingBag } from 'react-icons/fi';
import '../../../css/customer-account.css';

export default function CustomerAccount() {
    const { customer, flash, errors, google_login_enabled } = usePage().props;
    const { storeUrl } = useStorefront();
    const form = useForm({ name: customer?.name || '', phone: customer?.phone || '', address: customer?.address || '' });
    const google = useForm({ current_password: '' });
    const action = useForm({});
    const joinedAt = customer?.joined_at ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(`${customer.joined_at}T00:00:00`)) : null;
    const submit = event => {
        event.preventDefault();
        form.clearErrors();
        const parsed = customerProfileSchema.safeParse(form.data);
        if (!parsed.success) {
            parsed.error.issues.forEach(issue => form.setError(issue.path[0], issue.message));
            return;
        }
        form.transform(() => parsed.data);
        form.patch(storeUrl('/customer/account'), { preserveScroll: true });
    };
    return <OrderWorkspace title="Akun pelanggan" compact>
        <section className="customer-account-card">
            <header className="customer-account-summary">
                <AccountAvatar customer={customer} large />
                <div><p className="customer-account-eyebrow">Akun pelanggan · Sudah masuk</p><h1>{customer?.name}</h1><p className="customer-account-description">{customer?.email}</p></div>
            </header>
            {flash?.success && <p className="customer-account-message" role="status">{flash.success}</p>}
            {errors?.google && <p className="customer-account-error" role="alert">{errors.google}</p>}
            <dl className="customer-account-details">
                <div><dt>Status email</dt><dd>{customer?.verified ? <span className="customer-account-verified"><FiCheckCircle aria-hidden="true" />Terverifikasi</span> : 'Belum diverifikasi'}</dd></div>
                <div><dt>Metode login</dt><dd>{[customer?.google_linked && 'Google', customer?.has_password && 'Email & password'].filter(Boolean).join(' · ') || 'Belum tersedia'}</dd></div>
                {joinedAt && <div><dt>Bergabung sejak</dt><dd>{joinedAt}</dd></div>}
            </dl>
            <Link className="order-button order-button-primary" href={storeUrl('/order/status')}><FiShoppingBag aria-hidden="true" />Lihat pesanan saya</Link>
            {!customer?.verified && <div className="customer-account-message"><p>Email belum diverifikasi. Verifikasi untuk memastikan alamat email Anda benar.</p><button type="button" disabled={action.processing} onClick={() => action.post(storeUrl('/customer/verification-notification'))}>Kirim email verifikasi</button></div>}
            <form className="customer-account-form customer-account-profile" onSubmit={submit}>
                <div><h2>Informasi pribadi</h2><p className="customer-account-help">Lengkapi profil akun untuk mempermudah pemesanan berikutnya.</p></div>
                <AccountField form={form} name="name" label="Nama lengkap" autoComplete="name" maxLength={120} />
                <AccountField form={form} name="phone" label="Nomor telepon (opsional)" type="tel" autoComplete="tel" maxLength={20} required={false} />
                <AccountField form={form} name="address" label="Alamat (opsional)" autoComplete="street-address" multiline maxLength={500} required={false} />
                <button className="order-button" disabled={form.processing} type="submit">{form.processing ? 'Menyimpan…' : 'Simpan informasi'}</button>
            </form>
            <div className="customer-account-security">
                <h2>Keamanan akun</h2>
                {customer?.google_linked ? <p>Google sudah terhubung.</p> : google_login_enabled && <form className="customer-account-form" onSubmit={event => { event.preventDefault(); google.post(storeUrl('/customer/google/link'), { onFinish: () => google.reset() }); }}>
                    <p>Tautkan Google setelah mengonfirmasi password pelanggan.</p>
                    <AccountField form={google} name="current_password" label="Password pelanggan saat ini" type="password" autoComplete="current-password" />
                    <button type="submit" disabled={google.processing} className="order-button">Tautkan Google</button>
                </form>}
                <Link href={storeUrl('/customer/forgot-password')}>{customer?.has_password ? 'Ganti password lewat email' : 'Buat password lewat email'}</Link>
            </div>
            <button className="order-button" type="button" disabled={action.processing} onClick={() => action.post(storeUrl('/customer/logout'))}><FiLogOut aria-hidden="true" />Keluar akun pelanggan</button>
        </section>
    </OrderWorkspace>;
}
