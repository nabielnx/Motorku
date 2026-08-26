import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { props } = usePage();
    const locale = props.app_settings?.locale || 'id';

    return (
        <AuthenticatedLayout pageTitle={locale === 'en' ? 'My Profile' : 'Pengaturan Profil'}>
            <Head title={`${locale === 'en' ? 'My Profile' : 'Pengaturan Profil'} - Toko Sparepart`}>
                <meta name="description" content="Kelola informasi profil pribadi, foto avatar, dan keamanan kata sandi pengguna." />
            </Head>

            <div className="py-6 max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between transition-colors">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">Pengaturan Akun & Profil</h1>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                            Kelola informasi profil, foto avatar, dan keamanan kata sandi Anda.
                        </p>
                    </div>
                </div>

                {/* Profile Information Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </div>

                {/* Password Update Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
                    <UpdatePasswordForm />
                </div>

                {/* Delete Account Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
                    <DeleteUserForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
