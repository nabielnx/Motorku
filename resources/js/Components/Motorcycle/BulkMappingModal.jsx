import AdminButton from '@/Components/Admin/Button';
import AdminDialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { FiX, FiAlertCircle, FiChevronDown, FiStar, FiRefreshCw, FiCheck } from 'react-icons/fi';
import MotorIcon from '@/Components/MotorIcon';
import ProductThumbnail from '@/Components/Motorcycle/ProductThumbnail';

export default function BulkMappingModal({
    setShowBulkModal,
    bulkErrors,
    bulkMotorIds,
    setBulkMotorIds,
    filteredMotorcyclesForBulk,
    bulkMotorSearch,
    setBulkMotorSearch,
    bulkBrandFilter,
    setBulkBrandFilter,
    brands,
    bulkProductIds,
    setBulkProductIds,
    filteredProductsForBulk,
    bulkProductSearch,
    setBulkProductSearch,
    bulkCategoryFilter,
    setBulkCategoryFilter,
    productCategoriesList,
    formatRp,
    bulkCategory,
    setBulkCategory,
    categoryGroups,
    bulkNotes,
    setBulkNotes,
    bulkIsRecommended,
    setBulkIsRecommended,
    handleSaveBulkMapping,
    bulkSaving
}) {
    return (
        <AdminDialog onClose={() => setShowBulkModal(false)} closeable={!bulkSaving} className="max-w-5xl sm:h-[94vh] h-[calc(100dvh-2rem)] p-4 sm:p-6 lg:p-8 gap-3 sm:gap-5 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-1">
                <div>
                    <DialogTitle className="admin-dialog-title">
                        Kompatibilitas Massal
                    </DialogTitle>
                </div>
                <button disabled={bulkSaving} aria-label="Tutup" onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 admin-icon-button" title="Tutup">
                    <FiX size={20} />
                </button>
            </div>

            {bulkErrors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md font-semibold flex items-center gap-2">
                    <FiAlertCircle size={15} /> {bulkErrors.general}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto min-h-0 flex-1 pr-1">
                <section className="flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Motor * <span className="text-blue-600 dark:text-blue-400 ml-1">{bulkMotorIds.length} dipilih</span></div>
                        <div className="flex items-center gap-3 text-xs">
                            <button type="button" onClick={() => setBulkMotorIds(prev => Array.from(new Set([...prev, ...filteredMotorcyclesForBulk.map(m => m.id)])))} className="min-h-8 px-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline">Pilih semua</button>
                            <button type="button" onClick={() => setBulkMotorIds([])} className="min-h-8 px-1 text-slate-500 dark:text-slate-400 hover:underline">Kosongkan</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 mb-2">
                        <input type="search" aria-label="Cari motor" placeholder="Cari motor..." value={bulkMotorSearch} onChange={e => setBulkMotorSearch(e.target.value)} className="w-full min-w-0 px-2 py-1.5 admin-control" />
                        <select aria-label="Filter merek motor" value={bulkBrandFilter} onChange={e => setBulkBrandFilter(e.target.value)} className="w-full min-w-0 px-2 py-1.5 admin-control">
                            <option value="semua">Semua merek</option>
                            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                    </div>
                    <div className="max-h-48 lg:max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredMotorcyclesForBulk.map(motor => {
                            const selected = bulkMotorIds.includes(motor.id);
                            return (
                                <label key={motor.id} className={'flex items-center gap-2.5 p-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ' + (selected ? 'bg-slate-100 dark:bg-slate-800 border-l-2 border-primary' : '')}>
                                    <input type="checkbox" checked={selected} onChange={() => setBulkMotorIds(prev => selected ? prev.filter(id => id !== motor.id) : [...prev, motor.id])} className="w-4 h-4 shrink-0 rounded text-blue-600 border-slate-300 dark:border-slate-600" />
                                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                        {motor.image_url ? <img src={motor.image_url} alt="" className="w-full h-full object-cover" /> : <MotorIcon size={16} className="text-slate-400" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white whitespace-normal break-words">{motor.brand} {motor.model}</p>
                                        <p className="text-slate-500 dark:text-slate-400 truncate">{motor.engine_cc}cc · {motor.year_start}{motor.year_end ? '-' + motor.year_end : '-sekarang'}</p>
                                    </div>
                                </label>
                            );
                        })}
                        {filteredMotorcyclesForBulk.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Motor tidak ditemukan.</p>}
                    </div>
                    {bulkErrors.motorcycles && <p className="text-xs text-red-500 font-bold mt-1">{bulkErrors.motorcycles}</p>}
                </section>

                <section className="flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Sparepart * <span className="text-blue-600 dark:text-blue-400 ml-1">{bulkProductIds.length} dipilih</span></div>
                        <div className="flex items-center gap-3 text-xs">
                            <button type="button" onClick={() => setBulkProductIds(prev => Array.from(new Set([...prev, ...filteredProductsForBulk.map(p => p.id)])))} className="min-h-8 px-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline">Pilih semua</button>
                            <button type="button" onClick={() => setBulkProductIds([])} className="min-h-8 px-1 text-slate-500 dark:text-slate-400 hover:underline">Kosongkan</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 mb-2">
                        <input type="search" aria-label="Cari sparepart" placeholder="Cari part..." value={bulkProductSearch} onChange={e => setBulkProductSearch(e.target.value)} className="w-full min-w-0 px-2 py-1.5 admin-control" />
                        <select aria-label="Filter kategori sparepart" value={bulkCategoryFilter} onChange={e => setBulkCategoryFilter(e.target.value)} className="w-full min-w-0 px-2 py-1.5 admin-control">
                            <option value="semua">Semua kategori</option>
                            {productCategoriesList.map(category => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </div>
                    <div className="max-h-48 lg:max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredProductsForBulk.map(product => {
                            const selected = bulkProductIds.includes(product.id);
                            return (
                                <label key={product.id} className={'flex items-center gap-2.5 p-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ' + (selected ? 'bg-slate-100 dark:bg-slate-800 border-l-2 border-primary' : '')}>
                                    <input type="checkbox" checked={selected} onChange={() => setBulkProductIds(prev => selected ? prev.filter(id => id !== product.id) : [...prev, product.id])} className="w-4 h-4 shrink-0 rounded text-blue-600 border-slate-300 dark:border-slate-600" />
                                    <ProductThumbnail path={product.image_path} name={product.name} category={product.category?.name || product.category} size="w-8 h-8" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white whitespace-normal break-words leading-snug">{product.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 truncate">{product.sku || '-'} · {formatRp(product.price)}</p>
                                    </div>
                                </label>
                            );
                        })}
                        {filteredProductsForBulk.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Sparepart tidak ditemukan.</p>}
                    </div>
                    {bulkErrors.products && <p className="text-xs text-red-500 font-bold mt-1">{bulkErrors.products}</p>}
                </section>
                {/* Common Bulk Fields (Category, Notes, Recommendation) */}
                <div className="lg:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                            Kategori part *
                        </label>
                        <select
                            value={bulkCategory}
                            onChange={e => setBulkCategory(e.target.value)}
                            className="w-full px-3 py-2 font-semibold admin-control"
                        >
                            <option value="auto">Otomatis dari nama</option>
                            {Object.entries(categoryGroups).map(([gKey, group]) => (
                                <optgroup key={gKey} label={group.name}>
                                    {Object.entries(group.items || {}).map(([cKey, cLabel]) => (
                                        <option key={cKey} value={cKey}>{cLabel}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {bulkCategory !== 'auto' && (
                            <p className="mt-1 font-medium admin-help">
                                Kategori ini berlaku untuk semua pilihan.
                            </p>
                        )}
                        {bulkErrors.part_category && <p className="text-xs text-red-500 font-bold mt-1">{bulkErrors.part_category}</p>}
                    </div>

                    <details className="group">
                        <summary className="cursor-pointer text-xs font-semibold text-primary dark:text-blue-300 list-none flex items-center gap-1">
                            <FiChevronDown size={14} className="transition group-open:rotate-180" /> Catatan & rekomendasi
                        </summary>
                        <div className="grid grid-cols-1 gap-3 pt-3">
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                Catatan
                            </label>
                            <input
                                type="text"
                                value={bulkNotes}
                                onChange={e => setBulkNotes(e.target.value)}
                                placeholder="Contoh: Varian racing"
                                className="w-full px-3 py-2 font-medium admin-control"
                            />
                        </div>
                        <div className="pb-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={bulkIsRecommended}
                                    onChange={e => setBulkIsRecommended(e.target.checked)}
                                    className="w-4 h-4 rounded text-primary focus:ring-accentYellow cursor-pointer border-slate-300 dark:border-slate-600"
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <FiStar size={13} className="text-[#b58f00] fill-accentYellow shrink-0" />
                                    Rekomendasikan
                                </span>
                            </label>
                        </div>
                        </div>
                    </details>
                </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 font-semibold">
                    Pilihan:{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                        {bulkMotorIds.length} motor × {bulkProductIds.length} sparepart
                    </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <AdminButton disabled={bulkSaving}
                        type="button"
                        onClick={() => setShowBulkModal(false)}
                        variant="secondary"
                    >
                        Batal
                    </AdminButton>
                    <AdminButton
                        type="button"
                        onClick={() => handleSaveBulkMapping()}
                        disabled={bulkSaving}
                        variant="primary" className="flex-1"
                    >
                        {bulkSaving ? (
                            <>
                                <FiRefreshCw size={14} className="animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <FiCheck size={16} />
                                <span>Simpan</span>
                            </>
                        )}
                    </AdminButton>
                </div>
            </div>
        </AdminDialog>
    );
}
