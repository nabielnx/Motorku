import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiX, FiAlertCircle, FiStar } from 'react-icons/fi';

export default function EditPartModal({
    setEditPartModal,
    editPartModal,
    partFormErrors,
    partFormData,
    setPartFormData,
    categoryGroups,
    handleUpdatePart,
    saving
}) {
    return (
        <AdminDialog onClose={() => setEditPartModal(null)} closeable={!saving} className="max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                    <DialogTitle className="admin-dialog-title">Edit Mapping Sparepart</DialogTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{editPartModal.productName}</p>
                </div>
                <button disabled={saving} aria-label="Tutup" onClick={() => setEditPartModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer admin-icon-button"><FiX size={20} /></button>
            </div>

            {partFormErrors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                    <FiAlertCircle size={15} /> {partFormErrors.general}
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tipe / Kategori Part *</label>
                    <select
                        value={partFormData.part_category}
                        onChange={e => setPartFormData({ ...partFormData, part_category: e.target.value })}
                        className="w-full px-3 py-2 font-semibold admin-control"
                    >
                        {Object.entries(categoryGroups).map(([gKey, group]) => (
                            <optgroup key={gKey} label={group.name}>
                                {Object.entries(group.items || {}).map(([cKey, cLabel]) => (
                                    <option key={cKey} value={cKey}>{cLabel}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {partFormErrors.part_category && <p className="text-xs text-red-500 font-bold mt-1">{partFormErrors.part_category}</p>}
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Catatan Kompatibilitas</label>
                    <input
                        type="text"
                        value={partFormData.notes}
                        onChange={e => setPartFormData({ ...partFormData, notes: e.target.value })}
                        placeholder="Contoh: Cocok untuk varian CBS & ABS"
                        className="w-full px-3 py-2 font-medium admin-control"
                    />
                    {partFormErrors.notes && <p className="text-xs text-red-500 font-bold mt-1">{partFormErrors.notes}</p>}
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Rekomendasi</label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 h-[38px] rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition">
                        <input
                            type="checkbox"
                            checked={partFormData.is_recommended}
                            onChange={e => setPartFormData({ ...partFormData, is_recommended: e.target.checked })}
                            className="rounded text-primary focus:ring-accentYellow cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
                            <FiStar size={13} className="text-[#b58f00] fill-accentYellow shrink-0" /> Tandai Rekomendasi
                        </span>
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <AdminButton disabled={saving}
                    onClick={() => setEditPartModal(null)}
                    variant="secondary" className="flex-1 !px-2"
                >
                    Batal
                </AdminButton>
                <AdminButton
                    onClick={handleUpdatePart}
                    disabled={saving}
                    variant="primary" className="flex-1 whitespace-nowrap !px-2"
                >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </AdminButton>
            </div>
        </AdminDialog>
    );
}
