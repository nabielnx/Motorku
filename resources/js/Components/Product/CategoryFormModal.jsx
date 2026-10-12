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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[calc(100svh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden border border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-150 text-slate-900 dark:text-white">
                <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(false)}
                        aria-label="Tutup formulir kategori"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSaveCategory} className="min-h-0 flex flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-5">
                        <div>
                            <label htmlFor="category-group" className="block text-xs font-bold text-primaryDark mb-1">Kelompok barang</label>
                            <select id="category-group" value={categoryFormData.catalog_group} onChange={(e) => setCategoryFormData({ ...categoryFormData, catalog_group: e.target.value })} className="mb-2 w-full rounded-lg border-slate-300 text-sm text-primaryDark">
                                {Object.entries(catalogGroups).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                            </select>
                            <p className="mb-3 text-xs text-slate-500">Produk dan subkategori mengikuti kelompok ini.</p>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama kategori *</label>
                            <input
                                type="text"
                                required
                                value={categoryFormData.name}
                                onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                placeholder="Contoh: Oli, Pelumas & Kimia"
                                className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
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
                                    className="shrink-0 text-xs font-bold text-primary dark:text-blue-300 hover:text-primaryDark dark:hover:text-white flex items-center gap-1 cursor-pointer"
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
                                            className="min-w-0 flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = categoryFormData.sub_categories.filter((_, i) => i !== idx);
                                                setCategoryFormData({ ...categoryFormData, sub_categories: updated });
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition shrink-0 cursor-pointer"
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
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="min-h-10 flex-1 px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="min-h-10 flex-1 px-3.5 py-2 bg-accentYellow hover:bg-yellow-300 text-primaryDark text-xs font-bold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
