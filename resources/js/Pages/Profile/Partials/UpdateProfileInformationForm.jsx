import { useState } from 'react';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { FiUpload, FiCheck, FiUser, FiSave, FiCamera, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const handleUploadAvatar = async () => {
        if (!avatarFile) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('avatar', avatarFile);
            await axios.post(route('profile.avatar'), fd);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
            router.reload({ only: ['auth'] });
        } catch (err) {
            alert('Gagal upload foto: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const confirmDeleteAvatar = async () => {
        setUploading(true);
        try {
            await axios.delete(route('profile.avatar.destroy'));
            setAvatarFile(null);
            setAvatarPreview(null);
            router.reload({ only: ['auth'] });
        } catch (err) {
            alert('Gagal menghapus foto: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <FiUser className="text-blue-600 dark:text-yellow-400 w-5 h-5 shrink-0" strokeWidth={2.5} />
                <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Informasi Profil</h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        Perbarui nama lengkap, alamat email, dan foto profil akun Anda.
                    </p>
                </div>
            </header>

            <div className="space-y-6">
                {/* Foto Profil Section */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Foto Profil</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 ring-2 ring-slate-200/60 dark:ring-slate-700 flex items-center justify-center shrink-0 shadow-xs relative group">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                            ) : user.avatar ? (
                                <img src={'/storage/' + user.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-black text-slate-400 dark:text-slate-500">{user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition shadow-xs">
                                <FiCamera className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setAvatarFile(file);
                                            setAvatarPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                    className="hidden"
                                />
                                <span>Pilih Foto Baru</span>
                            </label>

                            {avatarFile && (
                                <button
                                    type="button"
                                    onClick={handleUploadAvatar}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition shadow-xs border border-blue-700 cursor-pointer"
                                >
                                    <FiUpload className="w-4 h-4" strokeWidth={2.5} />
                                    <span>{uploading ? 'Mengupload...' : 'Simpan Foto'}</span>
                                </button>
                            )}

                            {(user.avatar || avatarPreview) && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs cursor-pointer"
                                >
                                    <FiTrash2 className="w-4 h-4" strokeWidth={2.2} />
                                    <span>Hapus Foto</span>
                                </button>
                            )}
                        </div>
                    </div>
                    {uploadSuccess && (
                        <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <FiCheck className="w-4 h-4" strokeWidth={2.5} /> Foto profil berhasil diperbarui
                        </p>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Nama Lengkap
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        />
                        <InputError className="mt-1.5" message={errors.name} />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Alamat Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        />
                        <InputError className="mt-1.5" message={errors.email} />
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/60 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                                Alamat email Anda belum diverifikasi.{' '}
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="font-bold underline hover:text-yellow-800 dark:hover:text-yellow-200"
                                >
                                    Kirim ulang email verifikasi.
                                </Link>
                            </p>

                            {status === 'verification-link-sent' && (
                                <div className="mt-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    Tautan verifikasi baru telah dikirim ke alamat email Anda.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs shadow-xs transition border border-blue-700 cursor-pointer"
                        >
                            <FiSave className="w-4 h-4" strokeWidth={2.5} />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                        </button>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out duration-200"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out duration-200"
                            leaveTo="opacity-0"
                        >
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <FiCheck className="w-4 h-4" strokeWidth={2.5} /> Profil Berhasil Disimpan.
                            </p>
                        </Transition>
                    </div>
                </form>
            </div>

            {/* Custom Visual Modal Konfirmasi Hapus Foto */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-lg shrink-0">
                                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Hapus Foto Profil</h3>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Konfirmasi Penghapusan</p>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            Apakah Anda yakin ingin menghapus foto profil ini? File gambar akan dihapus secara permanen dari sistem.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={uploading}
                                className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    confirmDeleteAvatar();
                                }}
                                disabled={uploading}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs cursor-pointer"
                            >
                                {uploading ? 'Menghapus...' : 'Ya, Hapus Foto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
