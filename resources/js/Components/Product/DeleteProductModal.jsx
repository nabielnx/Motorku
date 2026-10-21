import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiAlertTriangle } from 'react-icons/fi';

export default function DeleteProductModal({
    deleteTarget,
    setDeleteTarget,
    isLoading,
    executeDeleteTarget
}) {
    return (
        <AdminDialog onClose={() => setDeleteTarget(null)} closeable={!isLoading} className="max-w-sm p-5 space-y-4 dark:text-white">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg shrink-0">
                    <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                </div>
                <div>
                    <DialogTitle className="admin-dialog-title">
                        Hapus {deleteTarget.type === 'product' ? 'Produk' : 'Kategori'}
                    </DialogTitle>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Konfirmasi Penghapusan</p>
                </div>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus {deleteTarget.type === 'product' ? 'produk' : 'kategori'}{' '}
                <span className="font-bold text-slate-900 dark:text-white">"{deleteTarget.name}"</span>? Perubahan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <AdminButton
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    disabled={isLoading}
                    variant="secondary"
                >
                    Batal
                </AdminButton>
                <AdminButton
                    type="button"
                    onClick={executeDeleteTarget}
                    disabled={isLoading}
                    variant="danger"
                >
                    {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </AdminButton>
            </div>
        </AdminDialog>
    );
}
