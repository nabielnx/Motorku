import { FiStar, FiX } from 'react-icons/fi';
import { ProductPhoto } from '@/Components/Customer/Storefront';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export default function PartPreviewModal({
    setPreviewPart,
    previewPart
}) {
    return (
        <Dialog
            open
            className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 animate-in fade-in duration-150"
            onClose={() => setPreviewPart(null)}
        >
            <DialogPanel
                className="admin-dialog admin-product-detail custom-scrollbar bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2 break-words">
                            <span className="admin-detail-category text-xs font-semibold">
                                {previewPart.categoryLabel || previewPart.category?.name || 'Sparepart'}
                            </span>
                            {previewPart.sku && (
                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                    · {previewPart.sku}
                                </span>
                            )}
                            {previewPart.is_recommended && (
                                <span title="Rekomendasi untuk motor ini" className="shrink-0 inline-flex items-center text-[#b58f00]">
                                    <FiStar size={14} className="fill-accentYellow text-[#b58f00]" />
                                </span>
                            )}
                        </div>
                        <DialogTitle as="h3" className="admin-dialog-title text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight whitespace-normal break-words [overflow-wrap:anywhere] mt-0.5" title={previewPart.name}>
                            {previewPart.name}
                        </DialogTitle>
                    </div>
                    <button
                        type="button"
                        data-autofocus
                        onClick={() => setPreviewPart(null)}
                        aria-label="Tutup pratinjau foto"
                        className="admin-icon-button shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                        title="Tutup (Esc)"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Modal Body: Large Image Display */}
                <div className="admin-detail-media shrink-0 p-4 sm:p-6 flex items-center justify-center min-h-[min(260px,35dvh)] max-h-[50dvh] overflow-hidden">
                    {previewPart.image_url ? (
                        <img
                            src={previewPart.image_url}
                            alt={previewPart.name}
                            className="max-h-[40dvh] w-auto max-w-full object-contain rounded-lg drop-shadow-md select-none"
                        />
                    ) : (
                        <ProductPhoto
                            src={null}
                            name={previewPart.name}
                            category={previewPart.categoryLabel || previewPart.category?.name || previewPart.category}
                            className="w-48 h-48 rounded-xl"
                        />
                    )}
                </div>

                {(previewPart.description || previewPart.brand || previewPart.rack_location || previewPart.motorcycles?.length > 0) && (
                    <div className="px-5 py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 whitespace-normal break-words [overflow-wrap:anywhere]">
                        {previewPart.brand && <p><span className="font-semibold">Merek:</span> {previewPart.brand}</p>}
                        {previewPart.rack_location && <p><span className="font-semibold">Lokasi rak:</span> {previewPart.rack_location}</p>}
                        {previewPart.description && <p className="whitespace-pre-line">{previewPart.description}</p>}
                        {previewPart.motorcycles?.length > 0 && <div>
                            <p className="font-semibold">Cocok untuk motor:</p>
                            <ul className="mt-1 list-disc pl-4 space-y-1">
                                {previewPart.motorcycles.map(motor => <li key={motor.id}>{motor.brand} {motor.model}</li>)}
                            </ul>
                        </div>}
                    </div>
                )}

                {/* Modal Footer */}
                <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                        <span className="admin-detail-price text-base font-bold block">
                            Rp {Number(previewPart.price || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Persediaan: {previewPart.stock ?? 0} {previewPart.unit || 'pcs'} {previewPart.notes ? `• ${previewPart.notes}` : ''}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setPreviewPart(null)}
                        className="min-h-8 shrink-0 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-md transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </DialogPanel>
        </Dialog>
    );
}
