import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import GoogleButton from '@/Components/Auth/GoogleButton';
import { businessRegistrationSchema, businessSlug } from '@/Utils/businessRegistration';

export default function Register({ googleIdentity = null }) {
    const [slugEdited, setSlugEdited] = useState(false);
    const form = useForm({ name: googleIdentity?.name || '', email: googleIdentity?.email || '', business_name: '', business_slug: '', password: '', password_confirmation: '' });
    const submit = event => {
        event.preventDefault();
        form.clearErrors();
        const result = businessRegistrationSchema.safeParse(form.data);
        if (!result.success) {
            const errors = {};
            for (const issue of result.error.issues) errors[issue.path[0]] ||= issue.message;
            form.setError(errors);
            return;
        }
        form.transform(data => googleIdentity ? Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'email')) : data);
        form.post(route(googleIdentity ? 'google.register' : 'register'), { onFinish: () => form.reset('password', 'password_confirmation') });
    };
    const fields = [
        ['name', 'Nama owner', 'text', 'name'], ['email', 'Email', 'email', 'email'],
        ['business_name', 'Nama usaha', 'text', 'organization'], ['business_slug', 'Alamat katalog toko', 'text', 'off'],
        ['password', googleIdentity ? 'Password cadangan' : 'Password', 'password', 'new-password'],
        ['password_confirmation', 'Ulangi password', 'password', 'new-password'],
    ];
    return <GuestLayout title={googleIdentity ? 'Lengkapi usaha Anda' : 'Buat akun usaha'} subtitle="Satu akun owner untuk satu usaha. Kelola produk, stok, dan transaksi di tempat sendiri.">
        <Head title="Daftar Usaha" />
        {!googleIdentity && <div className="mb-5"><GoogleButton /></div>}
        {googleIdentity && <p className="mb-4 rounded-lg border border-[#dedfd7] bg-[#f3f3ed] p-3 text-xs text-[#19231f]">Google terhubung: <strong>{googleIdentity.email}</strong>. Buat password cadangan untuk login email dan konfirmasi perubahan penting.</p>}
        <form onSubmit={submit} className="space-y-3">
            {fields.map(([key, label, type, autoComplete]) => <div key={key}>
                <label htmlFor={key} className="mb-1 block text-xs font-semibold text-[#19231f]">{label}</label>
                <input id={key} name={key} type={type} autoComplete={autoComplete} required maxLength={key.includes('password') ? 128 : key === 'business_slug' ? 80 : key === 'email' ? 254 : key === 'business_name' ? 100 : 120} readOnly={key === 'email' && !!googleIdentity} value={form.data[key]} onChange={event => {
                    const value = event.target.value;
                    if (key === 'business_name' && !slugEdited) form.setData(data => ({ ...data, business_name: value, business_slug: businessSlug(value) }));
                    else { if (key === 'business_slug') setSlugEdited(true); form.setData(key, value); }
                }} aria-invalid={!!form.errors[key]} aria-describedby={form.errors[key] ? `${key}-error` : undefined} className="w-full rounded-lg border border-[#dedfd7] bg-white px-3 py-2 text-sm text-[#19231f] focus:border-[#19231f] focus:ring-[#19231f]" />
                {key === 'business_slug' && <p className="mt-1 break-all text-[11px] text-slate-600">Link toko: /s/{form.data.business_slug || 'nama-usaha'}</p>}
                {key === 'password' && <p className="mt-1 text-[11px] text-slate-600">Minimal 8 karakter, huruf besar dan kecil, angka, serta simbol.</p>}
                <InputError id={`${key}-error`} message={form.errors[key]} className="mt-1" />
            </div>)}
            <button disabled={form.processing} className="auth-primary min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-semibold">{form.processing ? 'Membuat usaha...' : 'Buat akun usaha'}</button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-600">Sudah punya akun? <Link href={route('login')} className="font-semibold text-[#19231f] underline">Masuk</Link></p>
    </GuestLayout>;
}
