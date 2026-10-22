import { FiX } from 'react-icons/fi';

export default function MotorcyclePreviewModal({
    setPreviewMotor,
    previewMotor
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewMotor(null)}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 break-words">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {previewMotor.brand}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight break-words">
                                {previewMotor.model}
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {previewMotor.engine_cc}cc • <span className="capitalize">{previewMotor.engine_type}</span> • {previewMotor.year_start}{previewMotor.year_end ? ` - ${previewMotor.year_end}` : ' - sekarang'}
                        </p>
                    </div>
                    <button
                        onClick={() => setPreviewMotor(null)}
                        aria-label="Tutup pratinjau foto"
                        className="admin-icon-button shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Tutup (Esc)"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Modal Body: Large Image Display */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
                    <img
                        src={previewMotor.image_url}
                        alt={`${previewMotor.brand} ${previewMotor.model}`}
                        className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg drop-shadow-md select-none"
                    />
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Foto referensi model motor untuk pembeli di lapangan</span>
                    <button
                        onClick={() => setPreviewMotor(null)}
                        className="min-h-8 shrink-0 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-md transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
