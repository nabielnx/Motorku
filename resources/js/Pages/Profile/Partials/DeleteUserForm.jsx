import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-4 ${className}`}>
            <header className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <FiTrash2 className="text-rose-600 dark:text-rose-400 w-5 h-5 shrink-0" strokeWidth={2.5} />
                <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Hapus Akun</h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        Setelah akun Anda dihapus, semua data dan sumber daya terkait akan dihapus secara permanen.
                    </p>
                </div>
            </header>

            <button
                type="button"
                onClick={confirmUserDeletion}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition border border-rose-700 cursor-pointer"
            >
                <FiTrash2 className="w-4 h-4" strokeWidth={2.5} />
                <span>Hapus Akun Permanen</span>
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                        <FiAlertTriangle className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            Apakah Anda yakin ingin menghapus akun?
                        </h2>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                        Tindakan ini tidak dapat dibatalkan. Masukkan password Anda untuk mengonfirmasi bahwa Anda benar-benar ingin menghapus akun ini secara permanen.
                    </p>

                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Password Konfirmasi
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                            placeholder="Masukkan password Anda..."
                        />

                        <InputError message={errors.password} className="mt-1.5" />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-xs transition border border-rose-700 cursor-pointer"
                        >
                            {processing ? 'Menghapus...' : 'Hapus Akun Permanen'}
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
