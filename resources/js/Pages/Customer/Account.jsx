import { Link, useForm, usePage } from '@inertiajs/react';
import { OrderWorkspace } from '@/Components/Customer/OrderWorkspace';
import useStorefront from '@/Hooks/useStorefront';
import { AccountField } from './Auth';
import '../../../css/customer-account.css';

export default function CustomerAccount() {
    const { customer, flash, errors, google_login_enabled } = usePage().props;
    const { storeUrl } = useStorefront();
    const form = useForm({ name: customer?.name || '', phone: customer?.phone || '' });
    const google = useForm({ current_password: '' });
    const action = useForm({});
    return <OrderWorkspace title="Akun pelanggan" compact>
        <section className="customer-account-card">
            <h1>Akun pelanggan</h1>
            <p className="customer-account-description">{customer?.email}</p>
            {flash?.success && <p className="customer-account-message" role="status">{flash.success}</p>}
            {errors?.google && <p className="customer-account-error" role="alert">{errors.google}</p>}
            <Link className="order-button order-button-primary" href={storeUrl('/order/status')}>Lihat pesanan saya</Link>
            {!customer?.verified && <div className="customer-account-message"><p>Email belum diverifikasi. Verifikasi untuk memastikan alamat email Anda benar.</p><button type="button" disabled={action.processing} onClick={() => action.post(storeUrl('/customer/verification-notification'))}>Kirim email verifikasi</button></div>}
            <form className="customer-account-form" onSubmit={event => { event.preventDefault(); form.patch(storeUrl('/customer/account')); }}>
                <h2>Data pengambilan di toko ini</h2>
                <AccountField form={form} name="name" label="Nama pemesan" autoComplete="name" />
                <AccountField form={form} name="phone" label="Nomor telepon (opsional)" type="tel" autoComplete="tel" required={false} />
                <button className="order-button" disabled={form.processing} type="submit">{form.processing ? 'Menyimpan…' : 'Simpan data'}</button>
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
            <button className="order-button" type="button" disabled={action.processing} onClick={() => action.post(storeUrl('/customer/logout'))}>Keluar akun pelanggan</button>
        </section>
    </OrderWorkspace>;
}
