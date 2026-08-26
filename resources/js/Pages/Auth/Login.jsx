import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FiMail, FiLock, FiLogOut, FiX } from 'react-icons/fi';

export default function Login({ status, canResetPassword }) {
    const { props } = usePage();
    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isExpired = queryParams.get('expired') === '1' || props.flash?.error === 'expired';

    const alertMessage = isExpired
        ? 'Sesi anda telah berakhir karena tidak ada aktivitas'
        : (props.flash?.error || props.flash?.warning);

    const [showAlert, setShowAlert] = useState(!!alertMessage);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk - Toko Sparepart">
                <meta name="description" content="Halaman login akun pegawai dan pemilik toko Toko Sparepart." />
            </Head>

            {/* ALERT SESSION EXPIRED BANNER */}
            {showAlert && alertMessage && (
                <div className="mb-5 bg-rose-100/90 border border-rose-200 text-rose-600 text-xs sm:text-sm font-medium rounded-xl p-3.5 sm:p-4 flex items-center justify-between shadow-2xs transition-all animate-in fade-in duration-200">
                    <span>{alertMessage}</span>
                    <button
                        type="button"
                        onClick={() => setShowAlert(false)}
                        className="text-rose-400 hover:text-rose-700 transition-colors p-1 rounded-lg shrink-0 ml-3"
                        aria-label="Tutup"
                    >
                        <FiX size={16} strokeWidth={2} />
                    </button>
                </div>
            )}

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* Input Email */}
                <div>
                    <InputLabel htmlFor="email" value="Email / Username" className="font-bold text-gray-700" />
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiMail size={18} />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full pl-10 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="owner@tokosparepart.com"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Input Password */}
                <div>
                    <InputLabel htmlFor="password" value="Password" className="font-bold text-gray-700" />
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiLock size={18} />
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="block w-full pl-10 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                        />
                        <span className="ms-2 text-sm text-gray-600 font-medium">Ingat Saya</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Lupa Password?
                        </Link>
                    )}
                </div>

                {/* Tombol Orange Login */}
                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 ${processing && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <FiLogOut className="rotate-180" size={18} /> Masuk ke Dashboard Toko Sparepart
                    </button>
                </div>

                {/* Link ke Halaman Register */}
                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-slate-500 font-medium">
                        Belum punya akun?{' '}
                        <Link
                            href={route('register')}
                            className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Daftar Akun Baru
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}