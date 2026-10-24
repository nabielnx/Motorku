import DeleteButton from '@/Components/Admin/DeleteButton';
import AdminButton from '@/Components/Admin/Button';
import ImagePicker from '@/Components/ImagePicker';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiX, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { validImage, IMAGE_HELP } from '@/Utils/imageUpload';

export default function MotorcycleFormModal({
    setShowAddModal,
    editMotorcycle,
    formErrors,
    formData,
    setFormData,
    brands,
    engineTypes,
    handleSaveMotor,
    saving
}) {
    return (
        <AdminDialog onClose={() => setShowAddModal(false)} closeable={!saving} className="max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <DialogTitle className="admin-dialog-title">
                    {editMotorcycle ? 'Edit Data Motor' : 'Tambah Motor Baru'}
                </DialogTitle>
                <button disabled={saving} aria-label="Tutup" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer admin-icon-button"><FiX size={20} /></button>
            </div>

            {formErrors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                    <FiAlertCircle size={15} /> {formErrors.general}
                </div>
            )}

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Brand *</label>
                        <input
                            type="text"
                            list="motorcycle-brands-list"
                            value={formData.brand}
                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            placeholder="Ketik atau pilih brand..."
                            className="w-full px-3 py-2 font-semibold placeholder-slate-400 transition admin-control"
                        />
                        <datalist id="motorcycle-brands-list">
                            {brands.map(b => (
                                <option key={b} value={b} />
                            ))}
                        </datalist>
                        {formErrors.brand && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.brand}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Model *</label>
                        <input
                            type="text"
                            value={formData.model}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            placeholder="Beat, Vario 160..."
                            className="w-full px-3 py-2 font-semibold placeholder-slate-400 transition admin-control"
                        />
                        {formErrors.model && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.model}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tahun Mulai *</label>
                        <input
                            type="number"
                            value={formData.year_start}
                            onChange={e => setFormData({ ...formData, year_start: parseInt(e.target.value) || '' })}
                            className="w-full px-3 py-2 font-semibold placeholder-slate-400 transition admin-control"
                        />
                        {formErrors.year_start && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.year_start}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tahun Akhir</label>
                        <input
                            type="number"
                            value={formData.year_end}
                            onChange={e => setFormData({ ...formData, year_end: e.target.value ? parseInt(e.target.value) : '' })}
                            placeholder="Sekarang"
                            className="w-full px-3 py-2 font-semibold placeholder-slate-400 transition admin-control"
                        />
                        {formErrors.year_end && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.year_end}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">CC Mesin *</label>
                        <input
                            type="number"
                            value={formData.engine_cc}
                            onChange={e => setFormData({ ...formData, engine_cc: parseInt(e.target.value) || '' })}
                            className="w-full px-3 py-2 font-semibold placeholder-slate-400 transition admin-control"
                        />
                        {formErrors.engine_cc && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.engine_cc}</p>}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tipe Mesin *</label>
                    <input
                        type="text"
                        list="motorcycle-types-list"
                        value={formData.engine_type}
                        onChange={e => setFormData({ ...formData, engine_type: e.target.value.toLowerCase() })}
                        placeholder="Ketik atau pilih tipe mesin (matic, bebek, sport, trail, listrik...)"
                        className="w-full px-3 py-2 font-semibold placeholder-slate-400 transition admin-control"
                    />
                    <datalist id="motorcycle-types-list">
                        {engineTypes.map(t => (
                            <option key={t} value={t} />
                        ))}
                    </datalist>
                    {formErrors.engine_type && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.engine_type}</p>}
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Foto Motor (Upload File / URL Gambar)</label>
                    <div className="flex flex-wrap items-start gap-3">
                        {(formData.image_file || formData.image_url) && (
                            <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                <img
                                    src={formData.image_file ? URL.createObjectURL(formData.image_file) : formData.image_url}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 basis-[220px] space-y-1.5">
                            <ImagePicker label="motor" disabled={saving} onSelect={file => {
                                if (validImage(file)) setFormData({ ...formData, image_file: file, remove_image: false });
                            }} />
                            {(formData.image_file || formData.image_url) && (
                                <DeleteButton
                                    draft={Boolean(formData.image_file) || !editMotorcycle}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => formData.image_file
                                        ? setFormData({ ...formData, image_file: null, remove_image: false })
                                        : setFormData({ ...formData, image_url: '', remove_image: !!editMotorcycle })}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                                >
                                    <FiTrash2 size={14} aria-hidden="true" /> {formData.image_file ? 'Batal pilih foto' : 'Hapus gambar'}
                                </DeleteButton>
                            )}
                            {formData.remove_image && <p className="text-xs font-medium text-red-600 dark:text-red-400">File gambar motor akan dihapus permanen saat perubahan disimpan.</p>}
                            <p className="text-xs text-slate-500">{IMAGE_HELP}</p>
                            <input
                                type="text"
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="Atau masukkan URL gambar (https://...)"
                                className="w-full px-3 py-1.5 font-medium admin-control"
                            />
                        </div>
                    </div>
                    {formErrors.image && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.image}</p>}
                </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <AdminButton disabled={saving}
                    onClick={() => setShowAddModal(false)}
                    variant="secondary" className="flex-1"
                >
                    Batal
                </AdminButton>
                <AdminButton
                    onClick={handleSaveMotor}
                    disabled={saving}
                    variant="primary" className="flex-1 whitespace-nowrap !px-2"
                >
                    {saving ? 'Menyimpan...' : editMotorcycle ? 'Simpan Perubahan' : 'Tambah Motor'}
                </AdminButton>
            </div>
        </AdminDialog>
    );
}
