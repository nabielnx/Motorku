import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm, Link } from '@inertiajs/react';
import { useRef, useState, useMemo } from 'react';
import { FiEye, FiEyeOff, FiCheck, FiX, FiLock, FiSave, FiHelpCircle } from 'react-icons/fi';

function calcStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return Math.min(score, 7);
}

const strengthLabel = {
    0: { label: 'Sangat Lemah', color: 'bg-red-500', text: 'text-red-600', width: '10%' },
    1: { label: 'Lemah', color: 'bg-red-500', text: 'text-red-600', width: '20%' },
    2: { label: 'Lemah', color: 'bg-blue-500', text: 'text-blue-600', width: '30%' },
    3: { label: 'Sedang', color: 'bg-blue-500', text: 'text-blue-600', width: '50%' },
    4: { label: 'Kuat', color: 'bg-yellow-500', text: 'text-yellow-600', width: '65%' },
    5: { label: 'Kuat', color: 'bg-lime-500', text: 'text-lime-600', width: '80%' },
    6: { label: 'Sangat Kuat', color: 'bg-emerald-500', text: 'text-emerald-600', width: '90%' },
    7: { label: 'Sangat Kuat', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' },
};

const requirements = [
    { key: 'min', label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
    { key: 'lower', label: 'Huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
    { key: 'upper', label: 'Huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { key: 'number', label: 'Angka (0-9)', test: (p) => /[0-9]/.test(p) },
    { key: 'symbol', label: 'Simbol (!@#$%^&*)', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const strength = useMemo(() => calcStrength(data.password), [data.password]);
    const bar = strengthLabel[strength];
    const match = data.password_confirmation
        ? data.password === data.password_confirmation
        : null;

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    const inputCls = 'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pr-10 pl-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none';

    return (
        <section className={className}>
            <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                    <FiLock className="text-blue-600 dark:text-yellow-400 w-5 h-5 shrink-0" strokeWidth={2.5} />
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Perbarui Password</h2>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            Gunakan password yang kuat dan unik untuk melindungi akun Anda.
                        </p>
                    </div>
                </div>
                <Link
                    href={route('password.request')}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-yellow-400 dark:hover:text-blue-300 transition shrink-0"
                >
                    <FiHelpCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Lupa password?</span>
                </Link>
            </header>

            <form onSubmit={updatePassword} className="space-y-4">
                <div>
                    <label htmlFor="current_password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Password Saat Ini
                    </label>
                    <div className="relative">
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type={showCurrent ? 'text' : 'password'}
                            className={inputCls}
                            autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                            {showCurrent ? <FiEyeOff className="w-4 h-4" strokeWidth={2.5} /> : <FiEye className="w-4 h-4" strokeWidth={2.5} />}
                        </button>
                    </div>
                    <InputError message={errors.current_password} className="mt-1.5" />
                </div>

                <div>
                    <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Password Baru
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type={showNew ? 'text' : 'password'}
                            className={inputCls}
                            autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                            {showNew ? <FiEyeOff className="w-4 h-4" strokeWidth={2.5} /> : <FiEye className="w-4 h-4" strokeWidth={2.5} />}
                        </button>
                    </div>

                    {data.password && (
                        <div className="mt-3 space-y-2 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-300 ${bar.color}`} style={{ width: bar.width }} />
                            </div>
                            <p className={`text-xs font-bold ${bar.text}`}>{bar.label}</p>
                            <ul className="space-y-1">
                                {requirements.map((r) => {
                                    const ok = r.test(data.password);
                                    return (
                                        <li key={r.key} className="flex items-center gap-1.5 text-xs font-semibold">
                                            <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}>
                                                {ok ? <FiCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> : <FiX className="w-3.5 h-3.5" strokeWidth={2.5} />}
                                            </span>
                                            <span className={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'}>{r.label}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                        <input
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type={showConfirm ? 'text' : 'password'}
                            className={inputCls}
                            autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                            {showConfirm ? <FiEyeOff className="w-4 h-4" strokeWidth={2.5} /> : <FiEye className="w-4 h-4" strokeWidth={2.5} />}
                        </button>
                    </div>
                    {data.password_confirmation && (
                        <p className={`mt-1.5 flex items-center gap-1 text-xs font-bold ${match ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {match ? <><FiCheck className="w-4 h-4" strokeWidth={2.5} /> Password cocok</> : <><FiX className="w-4 h-4" strokeWidth={2.5} /> Password tidak cocok</>}
                        </p>
                    )}
                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-xs transition border border-blue-700 cursor-pointer"
                    >
                        <FiSave className="w-4 h-4" strokeWidth={2.5} />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Password'}</span>
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-200"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out duration-200"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <FiCheck className="w-4 h-4" strokeWidth={2.5} /> Password Berhasil Diperbarui.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
