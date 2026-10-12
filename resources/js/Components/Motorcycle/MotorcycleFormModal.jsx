import { FiX, FiAlertCircle } from 'react-icons/fi';
import { IMAGE_ACCEPT, validImage, IMAGE_HELP } from '@/Utils/imageUpload';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">
                        {editMotorcycle ? 'Edit Data Motor' : 'Tambah Motor Baru'}
                    </h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><FiX size={20} /></button>
                </div>

                {formErrors.general && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
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
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                            <datalist id="motorcycle-brands-list">
                                {brands.map(b => (
                                    <option key={b} value={b} />
                                ))}
                            </datalist>
                            {formErrors.brand && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.brand}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Model *</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                placeholder="Beat, Vario 160..."
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                            {formErrors.model && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.model}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tahun Mulai *</label>
                            <input
                                type="number"
                                value={formData.year_start}
                                onChange={e => setFormData({ ...formData, year_start: parseInt(e.target.value) || '' })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                            {formErrors.year_start && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.year_start}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tahun Akhir</label>
                            <input
                                type="number"
                                value={formData.year_end}
                                onChange={e => setFormData({ ...formData, year_end: e.target.value ? parseInt(e.target.value) : '' })}
                                placeholder="Sekarang"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                            {formErrors.year_end && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.year_end}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">CC Mesin *</label>
                            <input
                                type="number"
                                value={formData.engine_cc}
                                onChange={e => setFormData({ ...formData, engine_cc: parseInt(e.target.value) || '' })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                            />
                            {formErrors.engine_cc && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.engine_cc}</p>}
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
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition"
                        />
                        <datalist id="motorcycle-types-list">
                            {engineTypes.map(t => (
                                <option key={t} value={t} />
                            ))}
                        </datalist>
                        {formErrors.engine_type && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.engine_type}</p>}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Foto Motor (Upload File / URL Gambar)</label>
                        <div className="flex items-center gap-3">
                            {(formData.image_file || formData.image_url) && (
                                <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                    <img
                                        src={formData.image_file ? URL.createObjectURL(formData.image_file) : formData.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-1.5">
                                <input
                                    type="file"
                                    accept={IMAGE_ACCEPT}
                                    onChange={e => { const file = e.target.files[0]; if (validImage(file)) setFormData({ ...formData, image_file: file }); }}
                                    className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-200 dark:file:bg-slate-700 file:text-slate-800 dark:file:text-slate-200 hover:file:bg-slate-300 cursor-pointer"
                                />
                                <p className="text-xs text-slate-500">{IMAGE_HELP}</p>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="Atau masukkan URL gambar (https://...)"
                                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium"
                                />
                            </div>
                        </div>
                        {formErrors.image && <p className="text-[11px] text-red-500 font-bold mt-1">{formErrors.image}</p>}
                    </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSaveMotor}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-accentYellow hover:bg-yellow-300 text-primaryDark rounded-md text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 transition shadow-xs"
                    >
                        {saving ? 'Menyimpan...' : editMotorcycle ? 'Simpan Perubahan' : 'Tambah Motor'}
                    </button>
                </div>
            </div>
        </div>
    );
}
