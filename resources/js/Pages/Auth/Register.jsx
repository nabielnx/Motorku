import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar Akun Baru - Toko Sparepart">
                <meta name="description" content="Pendaftaran akun baru staf dan pegawai toko Toko Sparepart." />
            </Head>

            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Daftar Akun Baru</h2>
                <p className="text-xs text-slate-500 mt-1">Buat akun untuk mengakses Sistem Manajemen Toko Sparepart</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                    <InputLabel htmlFor="name" value="Nama Lengkap" className="font-bold text-gray-700" />
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiUser size={18} />
                        </div>
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="block w-full pl-10 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Nama Lengkap Anda"
                            required
                        />
                    </div>
                    <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Email */}
                <div>
                    <InputLabel htmlFor="email" value="Alamat Email" className="font-bold text-gray-700" />
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
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@example.com"
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Password */}
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
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Konfirmasi Password */}
                <div>
                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="font-bold text-gray-700" />
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiLock size={18} />
                        </div>
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full pl-10 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                {/* Tombol Register & Link Login */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 ${processing && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <FiUserPlus size={18} /> Buat Akun Baru
                    </button>
                </div>

                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-slate-500 font-medium">
                        Sudah punya akun?{' '}
                        <Link
                            href={route('login')}
                            className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Masuk Di Sini
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
