import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiX, FiAlertCircle, FiSearch, FiCheck, FiStar } from 'react-icons/fi';
import { ProductPhoto } from '@/Components/Customer/Storefront';
import { getProductImage } from '@/Utils/productImage';

export default function AttachPartModal({
    setShowPartModal,
    partFormErrors,
    partFormData,
    setPartFormData,
    categoryGroups,
    partSearch,
    filteredProductsForModal,
    products,
    setPartSearch,
    formatRp,
    handleAttachPart,
    saving
}) {
    return (
        <AdminDialog onClose={() => setShowPartModal(null)} closeable={!saving} className="max-w-lg h-[90dvh] sm:h-auto max-h-[90dvh] p-4 sm:p-6 flex flex-col gap-3">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <DialogTitle className="admin-dialog-title">Tambah Sparepart</DialogTitle>
                <button disabled={saving} aria-label="Tutup" onClick={() => setShowPartModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer admin-icon-button"><FiX size={20} /></button>
            </div>

            {partFormErrors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                    <FiAlertCircle size={15} /> {partFormErrors.general}
                </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
                {/* Kategori / Tipe Part Dropdown with Optgroups */}
                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Kategori *</label>
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

                {/* Search Product */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label htmlFor="part-product-search" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Pilih sparepart *
                        </label>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {partSearch.trim()
                                ? `${filteredProductsForModal.length} / ${products.length} sparepart`
                                : `${products.length} sparepart`}
                        </span>
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            id="part-product-search"
                            type="text"
                            value={partSearch}
                            onChange={e => setPartSearch(e.target.value)}
                            placeholder="Cari nama atau SKU..."
                            className="w-full pl-9 pr-11 py-2 font-medium admin-control"
                        />
                        {partSearch && (
                            <button disabled={saving} aria-label="Hapus pencarian sparepart" onClick={() => setPartSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer admin-icon-button">
                                <FiX size={13} />
                            </button>
                        )}
                    </div>
                    {partFormErrors.product_id && <p className="text-xs text-red-500 font-bold mt-1">{partFormErrors.product_id}</p>}
                </div>

                {/* Product Select List */}
                <div className="min-h-32 max-h-64 shrink-0 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md divide-y divide-slate-100 dark:divide-slate-750">
                    {filteredProductsForModal.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setPartFormData({
                                ...partFormData,
                                product_id: p.id,
                                part_category: p.default_part_category || partFormData.part_category
                            })}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 text-xs cursor-pointer transition ${
                                partFormData.product_id === p.id ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                <div className="w-11 h-11 rounded-md shrink-0 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                                    <ProductPhoto
                                        src={getProductImage(p.image_path)}
                                        name={p.name}
                                        category={p.category?.name || p.category}
                                        className="w-full h-full object-cover rounded"
                                        compact
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="min-w-0 font-black text-slate-900 dark:text-white whitespace-normal break-words leading-snug">{p.name}</span>
                                        {p.sku && <span className="shrink-0 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded">{p.sku}</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{p.category?.name || 'Katalog'}</span>
                                        <span>·</span>
                                        <span className={`whitespace-nowrap font-semibold ${p.stock <= 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>Stok: {p.stock} {p.unit || 'pcs'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pl-14 sm:pl-0">
                                <span className="font-black text-blue-600 dark:text-blue-400">{formatRp(p.price)}</span>
                                {partFormData.product_id === p.id && <FiCheck size={16} className="text-blue-600" />}
                            </div>
                        </div>
                    ))}
                    {filteredProductsForModal.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-6">
                            Tidak ada sparepart ditemukan untuk kata kunci &quot;{partSearch}&quot;.
                        </p>
                    )}
                </div>

                <details className="shrink-0 text-xs text-slate-600 dark:text-slate-300">
                    <summary className="cursor-pointer font-semibold">Opsi tambahan</summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                Catatan
                            </label>
                            <input
                                type="text"
                                value={partFormData.notes}
                                onChange={e => setPartFormData({ ...partFormData, notes: e.target.value })}
                                placeholder="Contoh: Cocok untuk varian CBS & ABS"
                                className="w-full px-3 py-2 font-medium admin-control"
                            />
                            {partFormErrors.notes && <p className="text-xs text-red-500 font-bold mt-1">{partFormErrors.notes}</p>}
                        </div>
                        <div className="sm:self-end">
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 h-[38px] rounded-md border border-slate-300 dark:border-slate-700 w-full hover:bg-slate-100 dark:hover:bg-slate-750 transition">
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
                </details>
            </div>

            <div className="flex shrink-0 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <AdminButton disabled={saving}
                    onClick={() => setShowPartModal(null)}
                    variant="secondary" className="flex-1 !px-2"
                >
                    Batal
                </AdminButton>
                <AdminButton
                    onClick={handleAttachPart}
                    disabled={saving || !partFormData.product_id}
                    variant="primary" className="flex-1 !px-2"
                >
                    {saving ? 'Menyimpan...' : 'Tambah Mapping'}
                </AdminButton>
            </div>
        </AdminDialog>
    );
}
