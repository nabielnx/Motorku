import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function VerifyEmail({ status, mailDeliveryIsLocal = false }) {
    const { auth } = usePage().props;
    const { post, processing, errors } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout title="Verifikasi Email" subtitle="Konfirmasi alamat email untuk mengakses toko.">
            <Head title="Verifikasi Email">
                <meta name="description" content="Verifikasi alamat email akun Motorku Anda." />
            </Head>

            <p className="mb-4 text-sm text-slate-600">Verifikasi <strong>{auth.user.email}</strong> sebelum mengakses toko. Kirim tautan verifikasi, lalu buka tautannya dari email Anda.</p>
            {mailDeliveryIsLocal && <p className="mb-4 text-xs text-slate-500">Mode lokal: email dicatat di log pengembangan. Pengiriman ke inbox memerlukan layanan email.</p>}

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {mailDeliveryIsLocal ? 'Tautan verifikasi dicatat di log lokal.' : 'Tautan verifikasi telah dikirim ke email Anda.'}
                </div>
            )}

            <InputError message={errors.email} className="mb-3" />
            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Mengirim...' : 'Kirim Email Verifikasi'}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Keluar
                    </Link>
                </div>
            </form>
            <Link href={route('profile.edit')} className="mt-4 inline-block text-sm font-semibold text-primary underline">Perbaiki alamat email</Link>
        </GuestLayout>
    );
}
