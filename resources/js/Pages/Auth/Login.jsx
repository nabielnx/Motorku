import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import GoogleButton from '@/Components/Auth/GoogleButton';
import { FiMail, FiLock, FiLogOut, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login({ status }) {
    const { props } = usePage();
    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isExpired = queryParams.get('expired') === '1' || props.flash?.error === 'expired';

    const alertMessage = isExpired
        ? 'Sesi anda telah berakhir karena tidak ada aktivitas'
        : (props.flash?.error || props.flash?.warning);

    const [showAlert, setShowAlert] = useState(!!alertMessage);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => {
                reset('password');
                setShowPassword(false);
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk">
                <meta name="description" content="Halaman login akun pegawai dan pemilik toko TokoM." />
            </Head>

            {/* ALERT SESSION EXPIRED BANNER */}
            {showAlert && alertMessage && (
                <div role="alert" className="mb-5 bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-medium rounded-xl p-3.5 sm:p-4 flex items-center justify-between shadow-2xs transition-all animate-in fade-in duration-200">
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
                <div role="status" className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="mb-5"><GoogleButton /><InputError message={errors.google} className="mt-2" /></div>
            <form onSubmit={submit} className="space-y-5">
                {/* Input Email */}
                <div>
                    <InputLabel htmlFor="email" value="Email" className="font-bold text-gray-700" />
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
                            placeholder="Masukkan email"
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
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full pl-10 pr-12 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-gray-500 hover:text-gray-900 transition-colors"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            aria-controls="password"
                            aria-pressed={showPassword}
                            disabled={processing}
                            onClick={() => setShowPassword((visible) => !visible)}
                        >
                            {showPassword ? <FiEyeOff size={18} aria-hidden="true" /> : <FiEye size={18} aria-hidden="true" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Tombol Orange Login */}
                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex justify-center items-center gap-2 auth-primary font-semibold py-3 px-4 rounded-lg transition-colors ${processing && 'cursor-wait'}`}
                    >
                        <FiLogOut className="rotate-180" size={18} /> {processing ? 'Memproses...' : 'Masuk ke Dashboard TokoM'}
                    </button>
                </div>

            </form>
            <p className="mt-5 text-center text-xs text-slate-600">Punya usaha sendiri? <Link href={route('register')} className="font-semibold text-[#19231f] underline">Daftarkan usaha</Link></p>
        </GuestLayout>
    );
}
