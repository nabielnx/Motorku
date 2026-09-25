import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { Head, useForm, Link } from '@inertiajs/react';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi">
                <meta name="description" content="Layanan pemulihan dan reset kata sandi akun Motorku." />
            </Head>

            <div className="mb-6 text-sm text-gray-500 leading-relaxed text-center">
                Lupa password Anda? Tidak masalah. Masukkan alamat email Anda, dan kami akan mengirimkan tautan untuk membuat password baru.
            </div>

            {status && (
                <div className="mb-6 font-medium text-sm text-green-600 bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
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
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Masukkan email Anda..."
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="flex flex-col gap-4 mt-8">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 ${processing && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <FiSend size={18} /> Kirim Link Reset
                    </button>

                    <Link
                        href={route('login')}
                        className="flex justify-center items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors py-2"
                    >
                        <FiArrowLeft size={16} /> Kembali ke Login
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}