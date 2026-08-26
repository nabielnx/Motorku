import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FiMail, FiLock, FiCheckCircle } from 'react-icons/fi';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Kata Sandi - Toko Sparepart">
                <meta name="description" content="Buat kata sandi baru untuk akun Toko Sparepart Anda." />
            </Head>

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">Buat Password Baru</h2>
                <p className="text-sm text-gray-500">Silakan buat password baru yang kuat untuk akun Toko Sparepart System Anda.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {/* Email Field (Dibuat ReadOnly karena ini dapet dari token) */}
                <div>
                    <InputLabel htmlFor="email" value="Email Akun" className="font-bold text-gray-700" />
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiMail size={18} />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full pl-10 py-3 bg-gray-200 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed shadow-inner"
                            autoComplete="username"
                            readOnly
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Input Password Baru */}
                <div>
                    <InputLabel htmlFor="password" value="Password Baru" className="font-bold text-gray-700" />
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
                            autoComplete="new-password"
                            isFocused={true}
                            placeholder="Minimal 8 karakter..."
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Input Konfirmasi Password */}
                <div>
                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="font-bold text-gray-700" />
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiCheckCircle size={18} />
                        </div>
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full pl-10 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            autoComplete="new-password"
                            placeholder="Ketik ulang password..."
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                {/* Area Syarat Keamanan (Visual doang biar keliatan pro kek di mockup) */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                    <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">Syarat Keamanan:</p>
                    <ul className="text-xs text-blue-700 space-y-1 font-medium">
                        <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" /> Minimal 8 karakter</li>
                        <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" /> Mengandung kombinasi huruf & angka</li>
                    </ul>
                </div>

                {/* Tombol Merah */}
                <div className="mt-8 pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 ${processing && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <FiLock size={18} /> Simpan Password Baru
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}