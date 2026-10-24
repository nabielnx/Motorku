import DeleteButton from '@/Components/Admin/DeleteButton';
import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiTrash2, FiRefreshCw } from 'react-icons/fi';

export default function DeleteMappingModal({
    isDeleting,
    setDeleteConfirm,
    deleteConfirm,
    executeDeleteConfirm
}) {
    return (
        <AdminDialog onClose={() => setDeleteConfirm(null)} closeable={!isDeleting} className="max-w-sm p-5 space-y-4 dark:text-white transform transition-all">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FiTrash2 size={22} className="text-red-500 shrink-0" />
                <div className="min-w-0 flex-1">
                    <DialogTitle className="admin-dialog-title">
                        {deleteConfirm.title}
                    </DialogTitle>
                    <p className="font-semibold admin-help">Konfirmasi Tindakan</p>
                </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <AdminButton
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isDeleting}
                    variant="secondary"
                >
                    Batal
                </AdminButton>
                <DeleteButton as={AdminButton}
                    type="button"
                    onClick={executeDeleteConfirm}
                    disabled={isDeleting}
                    variant="danger"
                >
                    {isDeleting ? (
                        <>
                            <FiRefreshCw size={13} className="animate-spin" />
                            <span>Menghapus...</span>
                        </>
                    ) : (
                        <span>Ya, Hapus</span>
                    )}
                </DeleteButton>
            </div>
        </AdminDialog>
    );
}
