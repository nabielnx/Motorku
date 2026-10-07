import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function AcceptInvitation({ email, token, valid }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email, token, password: '', password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('staff.invitation.accept'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title="Aktivasi Akun Staf" subtitle="Siapkan akses Anda ke Motorku.">
            <Head title="Aktivasi Akun Staf">
                <meta name="referrer" content="no-referrer" />
            </Head>
            {valid ? (
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-sm text-slate-600">Buat password Anda sendiri untuk mengaktifkan akun dan memverifikasi email berikut.</p>
                    <div>
                        <InputLabel htmlFor="email" value="Email undangan" />
                        <TextInput id="email" type="email" value={email} readOnly className="mt-1 block w-full bg-slate-50" />
                        <InputError message={errors.email || errors.token} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="password" value="Password baru" />
                        <TextInput id="password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} minLength={8} required autoComplete="new-password" className="mt-1 block w-full" />
                        <p className="mt-1 text-xs text-slate-500">Minimal 8 karakter, dengan huruf besar, huruf kecil, angka, dan simbol.</p>
                        <InputError message={errors.password} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Ulangi password" />
                        <TextInput id="password_confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} minLength={8} required autoComplete="new-password" className="mt-1 block w-full" />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                    <PrimaryButton disabled={processing}>{processing ? 'Mengaktifkan...' : 'Aktifkan Akun'}</PrimaryButton>
                </form>
            ) : (
                <p className="text-sm text-slate-600">Undangan tidak valid, kedaluwarsa, atau sudah digunakan. Hubungi owner toko untuk meminta undangan baru.</p>
            )}
            <Link href={route('login')} className="mt-4 inline-block text-sm font-semibold text-primary underline">Kembali ke login</Link>
        </GuestLayout>
    );
}
