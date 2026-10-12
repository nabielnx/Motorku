import { FiTrash2, FiRefreshCw } from 'react-icons/fi';

export default function DeleteMappingModal({
    isDeleting,
    setDeleteConfirm,
    deleteConfirm,
    executeDeleteConfirm
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4 animate-in fade-in duration-150 backdrop-blur-xs"
            onClick={() => !isDeleting && setDeleteConfirm(null)}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transform transition-all animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <FiTrash2 size={22} className="text-red-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {deleteConfirm.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Konfirmasi Tindakan</p>
                    </div>
                </div>

                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {deleteConfirm.message}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        disabled={isDeleting}
                        className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={executeDeleteConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-lg transition border border-red-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <FiRefreshCw size={13} className="animate-spin" />
                                <span>Menghapus...</span>
                            </>
                        ) : (
                            <span>Ya, Hapus</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
