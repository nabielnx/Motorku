import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiShield, FiUserCheck, FiUserX, FiX, FiAlertCircle } from 'react-icons/fi';

const ROLE_BADGES = {
    owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    cashier: { label: 'Kasir', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const extractPaginator = (data) => {
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
        return data;
    }
    const list = Array.isArray(data) ? data : [];
    return { data: list, current_page: 1, last_page: 1, total: list.length, per_page: 10 };
};

export default function UserIndex({ initialUsers = {} }) {
    const { props } = usePage();
    const locale = props.app_settings?.locale || 'id';
    const { auth } = usePage().props;
    const paginator = extractPaginator(initialUsers);
    const [users, setUsers] = useState(() => paginator.data);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [modal, setModal] = useState(null);
    const [editId, setEditId] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', is_active: true });
    const [formError, setFormError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUsers(extractPaginator(initialUsers).data);
    }, [initialUsers]);

    const currentPage = paginator.current_page || 1;
    const totalPages = paginator.last_page || 1;
    const totalUsers = paginator.total || users.length;
    const perPage = paginator.per_page || 10;

    const changeUserPage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        router.get('/users', {
            page: newPage,
            search: search || undefined,
            role: roleFilter === 'All' ? undefined : roleFilter
        }, { preserveState: true, preserveScroll: true });
    };

    const fetchUsers = () => {
        router.get('/users', {
            search: search || undefined,
            page: currentPage,
            role: roleFilter === 'All' ? undefined : roleFilter
        }, { preserveState: true, preserveScroll: true });
    };

    const handleRoleFilterChange = (role) => {
        setRoleFilter(role);
        router.get('/users', {
            page: 1,
            search: search || undefined,
            role: role === 'All' ? undefined : role
        }, { preserveState: true, preserveScroll: true });
    };

    // Search di-debounce → refetch dari server agar mencari SEMUA user (lintas halaman)
    const isFirstSearchRender = useRef(true);
    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/users', {
                page: 1,
                search: search || undefined,
                role: roleFilter === 'All' ? undefined : roleFilter
            }, { preserveState: true, preserveScroll: true });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const safeUsers = Array.isArray(users) ? users : [];
    const activeOwnersCount = safeUsers.filter(u => u && u.is_active !== false && u.roles?.some(r => r.name === 'owner')).length;

    const filtered = safeUsers.filter(u => {
        if (!u) return false;
        const matchRole = roleFilter === 'All' || u.roles?.some(r => r.name === roleFilter);
        const nameStr = String(u.name || '');
        const emailStr = String(u.email || '');
        const matchSearch = nameStr.toLowerCase().includes(search.toLowerCase()) || emailStr.toLowerCase().includes(search.toLowerCase());
        return matchRole && matchSearch;
    });

    const editingUser = editId ? safeUsers.find(u => u.id === editId) : null;
    const isSelf = editingUser && auth?.user?.id === editingUser.id;
    const isLastActiveOwner = editingUser && editingUser.roles?.[0]?.name === 'owner' && activeOwnersCount <= 1;

    const openAdd = () => {
        setEditId(null);
        setForm({ name: '', email: '', password: '', role: 'cashier', is_active: true });
        setFormError(null);
        setModal('form');
    };

    const openEdit = (user) => {
        setEditId(user.id);
        setForm({ 
            name: user.name, 
            email: user.email, 
            password: '', 
            role: user.roles?.[0]?.name || 'cashier',
            is_active: user.is_active !== false
        });
        setFormError(null);
        setModal('form');
    };

    const handleSubmit = async () => {
        setFormError(null);
        if (!form.name.trim() || !form.email.trim()) {
            const errText = 'Nama dan Email wajib diisi!';
            setFormError(errText);
            toast.error(errText);
            return;
        }
        if (!editId && !form.password.trim()) {
            const errText = 'Password wajib diisi!';
            setFormError(errText);
            toast.error(errText);
            return;
        }
        setLoading(true);
        try {
            const payload = { ...form };
            if (editId && !payload.password) delete payload.password;
            if (editId) {
                const res = await axios.put(`/api/users/${editId}`, payload);
                setUsers(prev => prev.map(u => u.id === editId ? res.data.data : u));
                toast.success(`Data staf "${form.name}" berhasil diperbarui!`);
            } else {
                const res = await axios.post('/api/users', payload);
                setUsers(prev => [res.data.data, ...prev]);
                toast.success(`Staf "${form.name}" (${form.role.toUpperCase()}) berhasil ditambahkan!`);
            }
            setModal(null);
        } catch (err) {
            const errorsObj = err.response?.data?.errors;
            const firstErr = errorsObj ? (Array.isArray(Object.values(errorsObj)[0]) ? Object.values(errorsObj)[0][0] : Object.values(errorsObj)[0]) : null;
            const msg = firstErr || err.response?.data?.message || 'Gagal menyimpan data staff';
            setFormError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        const user = safeUsers.find(u => u.id === id);
        if (id === auth?.user?.id) {
            toast.error('Anda tidak dapat menghapus akun Anda sendiri.');
            return;
        }
        if (user?.roles?.[0]?.name === 'owner' && activeOwnersCount <= 1) {
            toast.error('Tidak dapat menghapus owner terakhir yang aktif.');
            return;
        }
        setUserToDelete(user);
        setModal('delete');
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        setLoading(true);
        try {
            await axios.delete(`/api/users/${userToDelete.id}`);
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            toast.success(`Staf "${userToDelete.name}" berhasil dihapus!`);
            setModal(null);
            setUserToDelete(null);
        } catch (err) {
            if (err.response?.status === 419) {
                toast.error('Sesi telah kedaluwarsa. Memuat ulang halaman...');
                window.location.reload();
                return;
            }
            const msg = err.response?.data?.message || err.response?.data?.errors?.user?.[0] || 'Gagal menghapus staff';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout pageTitle={locale === 'en' ? 'Staff Management' : 'Kelola Staff & Pegawai'}>
            <Head title={`${locale === 'en' ? 'Staff Management' : 'Kelola Staf'} - Toko Sparepart`}>
                <meta name="description" content="Kelola akun pengguna, peran hak akses (Owner / Kasir), dan status staf pegawai Toko Sparepart." />
            </Head>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Daftar Pegawai & Staff</h3>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Kelola akun, hak akses, dan peran karyawan toko</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau email..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500" autoComplete="off" />
                        </div>
                        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer">
                            <FiPlus size={16} /> Tambah Staf Baru
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="p-4 bg-slate-50/60 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Filter Role:</span>
                        {['All', 'owner', 'cashier'].map(r => (
                            <button key={r} onClick={() => handleRoleFilterChange(r)} className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${roleFilter === r ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {r === 'All' ? 'Semua' : (ROLE_BADGES[r]?.label || r)}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)] no-scrollbar">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 bg-slate-50/60 dark:bg-slate-800/90">
                                    <th className="py-3.5 px-5 bg-slate-50/60 dark:bg-slate-800/90">Pegawai</th>
                                    <th className="py-3.5 px-5 bg-slate-50/60 dark:bg-slate-800/90">Role</th>
                                    <th className="py-3.5 px-5 bg-slate-50/60 dark:bg-slate-800/90">Status Akun</th>
                                    <th className="py-3.5 px-5 text-right bg-slate-50/60 dark:bg-slate-800/90">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map(user => {
                                    const roleName = user.roles?.[0]?.name || 'cashier';
                                    const badge = ROLE_BADGES[roleName] || { label: roleName, color: 'bg-slate-100 text-slate-700' };
                                    const isSelfRow = user.id === auth?.user?.id;
                                    const isLastOwnerRow = user.roles?.[0]?.name === 'owner' && activeOwnersCount <= 1;
                                    const deleteDisabled = isSelfRow || isLastOwnerRow;
                                    const deleteTooltip = isSelfRow 
                                        ? "Anda tidak dapat menghapus akun Anda sendiri" 
                                        : (isLastOwnerRow ? "Tidak dapat menghapus owner terakhir yang aktif" : "Hapus Staf");

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar ? (
                                                        <img 
                                                            src={'/storage/' + user.avatar} 
                                                            alt={user.name} 
                                                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                                            {String(user.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                            {isSelfRow && (
                                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/70 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                                                                    Akun Anda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                                                    <FiShield size={12} />{badge.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold shadow-2xs ${user.is_active !== false ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                    {user.is_active !== false ? <FiUserCheck size={14} /> : <FiUserX size={14} />}
                                                    {user.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer" title="Edit Staf"><FiEdit2 size={16} /></button>
                                                    <button 
                                                        onClick={() => confirmDelete(user.id)} 
                                                        disabled={deleteDisabled}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${deleteDisabled ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'}`} 
                                                        title={deleteTooltip}
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">Tidak ada pegawai ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* User Pagination Footer */}
                    {totalUsers > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <span>
                                Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalUsers)} dari {totalUsers} pegawai
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => changeUserPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-300 dark:border-slate-700 font-bold transition text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    Sebelumnya
                                </button>
                                <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => changeUserPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-300 dark:border-slate-700 font-bold transition text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {modal === 'form' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-slate-800 dark:text-white">{editId ? 'Edit Data Staf' : 'Tambah Staf Baru'}</h3>
                            <button onClick={() => setModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><FiX size={18} /></button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <FiAlertCircle className="shrink-0 text-rose-600 dark:text-rose-400" size={16} />
                                    <span>{formError}</span>
                                </div>
                                <button onClick={() => setFormError(null)} className="text-rose-400 hover:text-rose-600"><FiX size={14} /></button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Lengkap</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required autoComplete="off" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required autoComplete="off" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password {editId && '(kosongkan jika tidak diubah)'}</label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" autoComplete="new-password" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Role / Peran</label>
                                <select 
                                    value={form.role} 
                                    onChange={(e) => setForm({ ...form, role: e.target.value })} 
                                    disabled={isSelf || isLastActiveOwner}
                                    title={isSelf ? "Anda tidak dapat mengubah role akun Anda sendiri" : (isLastActiveOwner ? "Minimal harus ada 1 owner aktif" : "")}
                                    className={`w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${isSelf || isLastActiveOwner ? 'bg-slate-100 dark:bg-slate-850 text-slate-400 cursor-not-allowed' : ''}`}
                                >
                                    <option value="owner">Owner</option>
                                    <option value="cashier">Kasir</option>
                                </select>
                                {isSelf && (
                                    <p className="text-[10px] text-yellow-500 dark:text-yellow-400 font-semibold mt-1">Anda tidak dapat mengubah role akun Anda sendiri.</p>
                                )}
                                {!isSelf && isLastActiveOwner && (
                                    <p className="text-[10px] text-yellow-500 dark:text-yellow-400 font-semibold mt-1">Minimal harus ada 1 owner aktif dalam sistem.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Batal</button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                        </div>
                    </div>
                </div>
            )}
            {modal === 'delete' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiTrash2 size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Hapus Staff?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-white">{userToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors">
                                Batal
                            </button>
                            <button onClick={executeDelete} disabled={loading} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                                {loading ? 'Menghapus...' : 'Ya, Hapus!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
