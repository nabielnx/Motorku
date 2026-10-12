import { FiStar, FiX } from 'react-icons/fi';
import { ProductPhoto } from '@/Components/Customer/Storefront';

export default function PartPreviewModal({
    setPreviewPart,
    previewPart
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewPart(null)}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
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
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight whitespace-normal break-words mt-0.5" title={previewPart.name}>
                            {previewPart.name}
                        </h3>
                    </div>
                    <button
                        onClick={() => setPreviewPart(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                        title="Tutup (Esc)"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Modal Body: Large Image Display */}
                <div className="p-6 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
                    {previewPart.image_url ? (
                        <img
                            src={previewPart.image_url}
                            alt={previewPart.name}
                            className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg drop-shadow-md select-none"
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

                {/* Modal Footer */}
                <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                        <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 block">
                            Rp {Number(previewPart.price || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Persediaan: {previewPart.stock ?? 0} pcs {previewPart.notes ? `• ${previewPart.notes}` : ''}
                        </span>
                    </div>
                    <button
                        onClick={() => setPreviewPart(null)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-md transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
