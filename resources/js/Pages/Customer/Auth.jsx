import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { customerAuthSchemas } from '@/Utils/customerAuth';
import GoogleButton from '@/Components/Auth/GoogleButton';
import useStorefront from '@/Hooks/useStorefront';
import { OrderWorkspace } from '@/Components/Customer/OrderWorkspace';
import '../../../css/customer-account.css';

const titles = { login: 'Masuk pelanggan', register: 'Daftar pelanggan', forgot: 'Lupa password', reset: 'Password baru' };
const paths = { login: '/customer/login', register: '/customer/register', forgot: '/customer/forgot-password', reset: '/customer/reset-password' };

export default function CustomerAuth({ mode, token, email, returnTo = '/' }) {
    const { storeUrl } = useStorefront();
    const { flash, errors: pageErrors } = usePage().props;
    const form = useForm({ name: '', email: email || '', password: '', password_confirmation: '', token: token || '' });
    const signup = mode === 'register';
    const passwordNeeded = mode !== 'forgot';
    const submit = event => {
        event.preventDefault();
        form.clearErrors();
        const schema = customerAuthSchemas[mode];
        const parsed = schema.safeParse(form.data);
        if (!parsed.success) {
            parsed.error.issues.forEach(issue => form.setError(issue.path[0], issue.message));
            return;
        }
        form.post(storeUrl(paths[mode]), { onFinish: () => form.reset('password', 'password_confirmation') });
    };
    return <OrderWorkspace title={titles[mode]} compact>
        <Head title={titles[mode]} />
        <section className="customer-account-card customer-auth-card">
            <h1>{titles[mode]}</h1>
            <p className="customer-account-description">{signup ? 'Simpan riwayat belanja dan buka pesanan dari perangkat lain.' : mode === 'login' ? 'Masuk untuk melihat pesanan dan mempercepat checkout.' : 'Gunakan email akun pelanggan Anda.'}</p>
            {flash?.success && <p className="customer-account-message" role="status">{flash.success}</p>}
            {pageErrors?.google && <p className="customer-account-error" role="alert">{pageErrors.google}</p>}
            {['login', 'register'].includes(mode) && <GoogleButton href={storeUrl('/customer/google')} />}
            <form onSubmit={submit} className="customer-account-form">
                {signup && <AccountField form={form} name="name" label="Nama" autoComplete="name" />}
                <AccountField form={form} name="email" label="Email" type="email" autoComplete="email" />
                {passwordNeeded && <AccountField form={form} name="password" label={mode === 'reset' ? 'Password baru' : 'Password'} type="password" autoComplete={signup || mode === 'reset' ? 'new-password' : 'current-password'} />}
                {(signup || mode === 'reset') && <><p className="customer-account-help">Minimal 8 karakter, dengan huruf besar, huruf kecil, angka, dan simbol.</p><AccountField form={form} name="password_confirmation" label="Ulangi password" type="password" autoComplete="new-password" /></>}
                <button className="order-button order-button-primary" disabled={form.processing} type="submit">{form.processing ? 'Memproses…' : mode === 'forgot' ? 'Kirim tautan reset' : mode === 'reset' ? 'Simpan password' : signup ? 'Daftar pelanggan' : 'Masuk'}</button>
            </form>
            <div className="customer-account-links">
                {mode === 'login' ? <><Link href={storeUrl('/customer/forgot-password')}>Lupa password?</Link><Link href={storeUrl('/customer/register')}>Daftar pelanggan</Link></> : <Link href={storeUrl('/customer/login')}>Sudah punya akun? Masuk</Link>}
            </div>
            <Link className="customer-guest-link" href={storeUrl(['/payment', '/order/status'].includes(returnTo) ? returnTo : '/')}>Lanjut belanja sebagai tamu</Link>
            <div className="customer-account-business"><span>Untuk pemilik atau staf toko</span><Link href={storeUrl('/login')}>Masuk kelola toko</Link></div>
        </section>
    </OrderWorkspace>;
}

export function AccountField({ form, name, label, type = 'text', autoComplete, required = true }) {
    return <div className="customer-account-field">
        <label htmlFor={`customer-${name}`}>{label}</label>
        <input id={`customer-${name}`} type={type} autoComplete={autoComplete} value={form.data[name]} required={required} disabled={form.processing} onChange={event => form.setData(name, event.target.value)} aria-invalid={Boolean(form.errors[name])} aria-describedby={form.errors[name] ? `customer-${name}-error` : undefined} />
        {form.errors[name] && <p id={`customer-${name}-error`} role="alert" className="customer-account-error">{form.errors[name]}</p>}
    </div>;
}
