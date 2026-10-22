import { FiX, FiPackage } from 'react-icons/fi';

export default function ProductPreviewModal({
    setPreviewProduct,
    previewProduct
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewProduct(null)}
        >
            <div
                className="admin-dialog admin-product-detail custom-scrollbar bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                        <h3 className="admin-dialog-title font-semibold text-slate-900 dark:text-white text-sm sm:text-base whitespace-normal break-words">
                            {previewProduct.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {previewProduct.category} {previewProduct.sku ? `· ${previewProduct.sku}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Tutup detail produk"
                        onClick={() => setPreviewProduct(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Full Size Image */}
                <div className="admin-detail-media p-4 flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden">
                    {previewProduct.image ? (
                        <img
                            src={previewProduct.image}
                            alt={previewProduct.name}
                            className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10">
                            <FiPackage size={80} className="mb-4" />
                            <span className="text-sm font-semibold">Tidak Ada Foto</span>
                        </div>
                    )}
                </div>

                {/* Modal Info Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="admin-detail-price text-base sm:text-lg font-bold">
                            Rp {Number(previewProduct.price).toLocaleString('id-ID')}
                        </span>
                        <span className={`text-xs font-semibold ${
                            previewProduct.stock <= 0
                                ? 'text-red-600 font-bold'
                                : previewProduct.stock <= 5
                                    ? 'text-primaryDark dark:text-accentYellow'
                                    : 'text-slate-700 dark:text-slate-300'
                        }`}>
                            Stok: {previewProduct.stock <= 0 ? 'Habis' : `${previewProduct.stock} pcs`}
                        </span>
                    </div>
                    {previewProduct.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {previewProduct.subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
