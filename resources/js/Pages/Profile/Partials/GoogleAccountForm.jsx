import { useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function GoogleAccountForm() {
    const { google_login_enabled, google_account } = usePage().props;
    const form = useForm({ current_password: '' });
    if (!google_login_enabled && !google_account) return null;
    const submit = event => {
        event.preventDefault();
        const options = { preserveScroll: true, onFinish: () => form.reset() };
        if (google_account) form.delete(route('google.disconnect'), options);
        else form.post(route('google.link'), options);
    };
    return <section className="rounded-xl border border-[#dedfd7] bg-white p-4 sm:p-6">
        <h2 className="text-base font-bold text-[#19231f]">Login Google</h2>
        <p className="mt-1 text-xs text-slate-600">{google_account ? `Terhubung dengan ${google_account}. Email dan password tetap dapat digunakan.` : 'Tautkan akun Google untuk masuk lebih cepat ke usaha yang sama.'}</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
            <label htmlFor="google-current-password" className="block text-xs font-semibold text-[#19231f]">Konfirmasi password akun toko</label>
            <input id="google-current-password" type="password" autoComplete="current-password" value={form.data.current_password} onChange={event => form.setData('current_password', event.target.value)} required className="admin-control w-full max-w-sm px-3 py-2" />
            <InputError message={form.errors.current_password || form.errors.google} />
            <button disabled={form.processing || (!google_account && !google_login_enabled)} className="admin-control block min-h-10 bg-[#19231f] px-4 py-2 text-sm font-semibold text-white">{google_account ? 'Lepas akun Google' : 'Tautkan akun Google'}</button>
        </form>
    </section>;
}
