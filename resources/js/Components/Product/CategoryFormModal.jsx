import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function CategoryFormModal({
    editingCategory,
    setIsCategoryModalOpen,
    handleSaveCategory,
    categoryFormData,
    setCategoryFormData,
    catalogGroups,
    isLoading
}) {
    return (
        <AdminDialog onClose={() => setIsCategoryModalOpen(false)} closeable={!isLoading} className="max-w-lg max-h-[calc(100svh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden dark:text-white">
            <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <DialogTitle className="admin-dialog-title">
                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                </DialogTitle>
                <button disabled={isLoading}
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    aria-label="Tutup formulir kategori"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer admin-icon-button"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSaveCategory} className="min-h-0 flex flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-5">
                    <div>
                        <label htmlFor="category-group" className="block text-xs font-bold text-primaryDark mb-1">Kelompok barang</label>
                        <select id="category-group" value={categoryFormData.catalog_group} onChange={(e) => setCategoryFormData({ ...categoryFormData, catalog_group: e.target.value })} className="mb-2 w-full text-primaryDark admin-control">
                            {Object.entries(catalogGroups).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                        </select>
                        <p className="mb-3 text-xs text-slate-500">Produk dan subkategori mengikuti kelompok ini.</p>
                        <label htmlFor="categoryformmodal-1" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama kategori *</label>
                        <input id="categoryformmodal-1"
                            type="text"
                            required
                            value={categoryFormData.name}
                            onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                            placeholder="Contoh: Oli, Pelumas & Kimia"
                            className="w-full px-3.5 py-2 font-semibold transition admin-control"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Subkategori ({categoryFormData.sub_categories?.length || 0}) <span className="font-normal text-slate-400">· opsional</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setCategoryFormData({
                                        ...categoryFormData,
                                        sub_categories: [...(categoryFormData.sub_categories || []), { name: '' }]
                                    });
                                }}
                                className="min-h-8 shrink-0 px-1 text-xs font-bold text-primary dark:text-blue-300 hover:text-primaryDark dark:hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                                <FiPlus size={13} />
                                <span>Tambah</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(categoryFormData.sub_categories || []).map((sub, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={sub.name}
                                        onChange={(e) => {
                                            const updated = [...categoryFormData.sub_categories];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setCategoryFormData({ ...categoryFormData, sub_categories: updated });
                                        }}
                                        placeholder="Nama subkategori"
                                        aria-label={`Nama subkategori ${idx + 1}`}
                                        className="min-w-0 flex-1 px-3 py-2 font-semibold admin-control"
                                    />
                                    <button disabled={isLoading}
                                        type="button"
                                        onClick={() => {
                                            const updated = categoryFormData.sub_categories.filter((_, i) => i !== idx);
                                            setCategoryFormData({ ...categoryFormData, sub_categories: updated });
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition shrink-0 cursor-pointer admin-icon-button"
                                        aria-label={`Hapus subkategori ${idx + 1}`}
                                    >
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>
                            ))}

                            {(!categoryFormData.sub_categories || categoryFormData.sub_categories.length === 0) && (
                                <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada subkategori.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6">
                    <AdminButton disabled={isLoading}
                        type="button"
                        onClick={() => setIsCategoryModalOpen(false)}
                        variant="secondary" className="flex-1"
                    >
                        Batal
                    </AdminButton>
                    <AdminButton
                        type="submit"
                        disabled={isLoading}
                        variant="primary" className="flex-1"
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                    </AdminButton>
                </div>
            </form>
        </AdminDialog>
    );
}
