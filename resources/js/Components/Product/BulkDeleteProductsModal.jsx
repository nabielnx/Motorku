import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiAlertTriangle } from 'react-icons/fi';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import AdminButton from '@/Components/Admin/Button';
import DeleteButton from '@/Components/Admin/DeleteButton';
import { productDeletePreviewSchema } from '@/Utils/productSelection';

export default function BulkDeleteProductsModal({ selection, onClose, onDeleted }) {
    const [preview, setPreview] = useState(null);
    const [checking, setChecking] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setPreview(null); setChecking(true); setError('');
        axios.post('/api/products/bulk-delete/preview', selection, { signal: controller.signal })
            .then(({ data }) => { if (!controller.signal.aborted) setPreview(productDeletePreviewSchema.parse(data?.data ?? data)); })
            .catch(reason => {
                if (!controller.signal.aborted) setError(reason.response?.data?.message || 'Pilihan produk belum dapat diperiksa. Coba lagi.');
            }).finally(() => { if (!controller.signal.aborted) setChecking(false); });
        return () => controller.abort();
    }, [selection, attempt]);

    const remove = async () => {
        if (!preview || deleting) return;
        setDeleting(true); setError('');
        try {
            const { data } = await axios.delete('/api/products/bulk', { data: { token: preview.token } });
            const count = (data?.data ?? data).deleted_count;
            if (!Number.isInteger(count) || count !== preview.count) throw new Error('Incomplete deletion response');
            onDeleted(count);
        } catch (reason) {
            setPreview(null);
            setError(reason.response?.data?.message || 'Penghapusan belum dapat dipastikan. Periksa kembali daftar produk.');
        } finally { setDeleting(false); }
    };
    return (
        <AdminDialog onClose={onClose} closeable={!deleting} className="max-w-sm space-y-4 p-5">
            <div className="flex items-center gap-3">
                <span className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950 dark:text-red-300"><FiAlertTriangle size={20} /></span>
                <DialogTitle className="admin-dialog-title">Hapus produk terpilih</DialogTitle>
            </div>
            {checking ? <p className="text-sm text-slate-600 dark:text-slate-300" role="status">Memeriksa jumlah dan izin penghapusan...</p> : preview && <>
                <p className="text-sm text-slate-700 dark:text-slate-200">Hapus permanen <strong>{preview.count} produk</strong>{selection.mode === 'filtered' ? ' yang sesuai filter di semua halaman' : ' yang dipilih'}?</p>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">Foto produk dan mapping terkait ikut dihapus. Riwayat nota dan mutasi stok tetap tersimpan. Penghapusan tidak dapat dibatalkan.</p>
            </>}
            {error && <div className="space-y-2" role="alert"><p className="text-xs leading-relaxed text-red-700 dark:text-red-300">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="min-h-8 text-xs font-semibold underline">Periksa lagi</button></div>}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <AdminButton variant="secondary" onClick={onClose} disabled={deleting}>Batal</AdminButton>
                <DeleteButton as={AdminButton} variant="danger" onClick={remove} disabled={checking || deleting || !preview}>{deleting ? 'Menghapus...' : `Ya, hapus${preview ? ` ${preview.count} produk` : ''}`}</DeleteButton>
            </div>
        </AdminDialog>
    );
}
