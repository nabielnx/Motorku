import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiX, FiCheck } from 'react-icons/fi';

export default function StockAdjustmentModal({
    selectedProductForAdjust,
    setSelectedProductForAdjust,
    handleAdjustSubmit,
    setAdjustForm,
    adjustForm,
    currentStock,
    stockOutTooLarge,
    validAdjustmentQuantity,
    projectedStock,
    adjustLoading
}) {
    return (
        <AdminDialog onClose={() => setSelectedProductForAdjust(null)} closeable={!adjustLoading} className="max-w-md max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden dark:text-white">
            <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-start gap-3 bg-slate-50 dark:bg-slate-800">
                <div className="min-w-0 flex-1">
                    <DialogTitle className="admin-dialog-title">
                        Atur Stok
                    </DialogTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-normal break-words mt-0.5">
                        {selectedProductForAdjust.name}
                    </p>
                </div>
                <button disabled={adjustLoading}
                    type="button"
                    onClick={() => setSelectedProductForAdjust(null)}
                    aria-label="Tutup pengaturan stok"
                    className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer admin-icon-button"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Stok saat ini</span>
                    <span className="font-extrabold text-primaryDark dark:text-blue-300 text-sm">
                        {selectedProductForAdjust.stock} pcs
                    </span>
                </div>

                {/* Adjustment Type Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Jenis Perubahan
                    </label>
                    <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1" role="group" aria-label="Jenis perubahan stok">
                        <button
                            type="button"
                            onClick={() => setAdjustForm(prev => prev.type === 'stock_in' ? prev : { ...prev, type: 'stock_in', quantity: '' })}
                            aria-pressed={adjustForm.type === 'stock_in'}
                            className={`min-w-0 py-2 rounded-md text-xs font-bold transition text-center cursor-pointer ${
                                adjustForm.type === 'stock_in'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            + Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => setAdjustForm(prev => prev.type === 'stock_out' ? prev : { ...prev, type: 'stock_out', quantity: '' })}
                            aria-pressed={adjustForm.type === 'stock_out'}
                            className={`min-w-0 py-2 rounded-md text-xs font-bold transition text-center cursor-pointer ${
                                adjustForm.type === 'stock_out'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            − Keluar
                        </button>
                        <button
                            type="button"
                            onClick={() => setAdjustForm(prev => prev.type === 'adjustment' ? prev : { ...prev, type: 'adjustment', quantity: '' })}
                            aria-pressed={adjustForm.type === 'adjustment'}
                            className={`min-w-0 py-2 rounded-md text-xs font-bold transition text-center cursor-pointer ${
                                adjustForm.type === 'adjustment'
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            = Opname
                        </button>
                    </div>
                </div>

                {/* Quantity Input */}
                <div>
                    <label htmlFor="stockadjustmentmodal-1" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {adjustForm.type === 'adjustment' ? 'Stok fisik (pcs)' : adjustForm.type === 'stock_in' ? 'Jumlah masuk (pcs)' : 'Jumlah keluar (pcs)'}
                    </label>
                    <input id="stockadjustmentmodal-1"
                        type="number"
                        min={adjustForm.type === 'adjustment' ? '0' : '1'}
                        max={adjustForm.type === 'stock_out' ? currentStock : undefined}
                        step="1"
                        inputMode="numeric"
                        required
                        value={adjustForm.quantity}
                        onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3.5 py-2 font-semibold transition admin-control"
                    />
                    {stockOutTooLarge ? (
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">Maksimal {currentStock} pcs tersedia.</p>
                    ) : validAdjustmentQuantity && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Stok setelah disimpan: <strong>{projectedStock} pcs</strong></p>
                    )}
                </div>

                {/* Note / Reference */}
                <div>
                    <label htmlFor="stockadjustmentmodal-2" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Catatan / Referensi (Opsional)
                    </label>
                    <input id="stockadjustmentmodal-2"
                        type="text"
                        value={adjustForm.note}
                        onChange={(e) => setAdjustForm(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Contoh: Kulakan dari Toko Jaya"
                        maxLength={255}
                        className="w-full px-3.5 py-2 font-semibold transition admin-control"
                    />
                </div>

                {/* Modal Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                    <AdminButton
                        type="button"
                        onClick={() => setSelectedProductForAdjust(null)}
                        disabled={adjustLoading}
                        variant="secondary"
                    >
                        Batal
                    </AdminButton>
                    <AdminButton
                        type="submit"
                        disabled={adjustLoading || stockOutTooLarge}
                        variant="primary"
                    >
                        {adjustLoading ? (
                            <span>Menyimpan...</span>
                        ) : (
                            <>
                                <FiCheck size={14} />
                                <span>Simpan Stok</span>
                            </>
                        )}
                    </AdminButton>
                </div>
            </form>
        </AdminDialog>
    );
}
