import { FiAlertTriangle } from 'react-icons/fi';

export default function DeleteProductModal({
    deleteTarget,
    setDeleteTarget,
    isLoading,
    executeDeleteTarget
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-lg shrink-0">
                        <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Hapus {deleteTarget.type === 'product' ? 'Produk' : 'Kategori'}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Konfirmasi Penghapusan</p>
                    </div>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    Apakah Anda yakin ingin menghapus {deleteTarget.type === 'product' ? 'produk' : 'kategori'}{' '}
                    <span className="font-bold text-slate-900 dark:text-white">"{deleteTarget.name}"</span>? Perubahan ini tidak dapat dibatalkan.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setDeleteTarget(null)}
                        disabled={isLoading}
                        className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={executeDeleteTarget}
                        disabled={isLoading}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs"
                    >
                        {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}
