import { FiTrash2 } from 'react-icons/fi';
import DeleteButton from '@/Components/Admin/DeleteButton';
import ProductSelectionCheckbox from './ProductSelectionCheckbox';
import { MAX_BULK_DELETE, isProductSelected, productSelectionCount } from '@/Utils/productSelection';

export default function ProductSelectionToolbar({ selection, items, total, enabled, busy, onPageSelect, onSelectAll, onClear, onDelete }) {
    if (!total && !selection.ids?.length) return null;
    const count = productSelectionCount(selection, total);
    const pageSelected = items.filter(item => isProductSelected(selection, item.id)).length;
    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-200 pt-1 dark:border-slate-800">
            <div className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-200">
                <ProductSelectionCheckbox label="Pilih semua produk di halaman ini" checked={items.length > 0 && pageSelected === items.length} indeterminate={pageSelected > 0 && pageSelected < items.length}
                    onChange={event => onPageSelect(event.target.checked)} disabled={!enabled || busy || !items.length} />
                <span>Pilih halaman</span>
            </div>
            {count > 0 && <>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100" role="status">{count} dipilih</span>
                {selection.mode !== 'filtered' && total > count && <button type="button" disabled={busy || !enabled} onClick={onSelectAll} className="min-h-8 text-xs font-semibold text-slate-800 underline underline-offset-2 dark:text-slate-100">Pilih semua {total} hasil</button>}
                {selection.mode === 'filtered' && <span className="text-[11px] text-slate-500 dark:text-slate-400">di semua halaman</span>}
                <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={onClear} disabled={busy} className="min-h-8 px-1 text-xs font-medium text-slate-600 dark:text-slate-300">Batal pilih</button>
                    <DeleteButton onClick={onDelete} disabled={busy || count > MAX_BULK_DELETE} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-2.5 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-slate-900 dark:text-red-300"><FiTrash2 size={13} />Hapus ({count})</DeleteButton>
                </div>
                {count > MAX_BULK_DELETE && <p className="w-full text-xs text-red-700 dark:text-red-300">Maksimal {MAX_BULK_DELETE} produk per proses. Gunakan filter untuk membagi pilihan.</p>}
            </>}
            {!enabled && <span className="text-[11px] text-slate-500 dark:text-slate-400">Penghapusan dikunci di Pengaturan.</span>}
        </div>
    );
}
