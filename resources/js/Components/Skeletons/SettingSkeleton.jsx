import Skeleton from '@/Components/Skeleton';

/**
 * Setting skeleton — matches Setting/Index layout with Logo Toko card, Promo Banner card, and settings form sections.
 */
export default function SettingSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
            {/* 1. Logo Toko Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Skeleton className="w-5 h-5 rounded-md" />
                    <Skeleton className="h-5 w-28" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-24 aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-32 rounded-lg" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </div>

            {/* 2. Banner Promo Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-5 h-5 rounded-md" />
                        <Skeleton className="h-5 w-44" />
                    </div>
                    <Skeleton className="w-12 h-6 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((slot) => (
                        <div key={slot} className="space-y-2">
                            <Skeleton className="h-3 w-14" />
                            <div className="w-full aspect-[16/7] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3-6. Setting Form Sections */}
            {['Informasi Toko', 'Pajak & Pembayaran', 'Printer & Struk', 'Sistem & Jam Operasional'].map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <Skeleton className="w-5 h-5 rounded-md" />
                        <Skeleton className="h-5 w-36" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, fIdx) => (
                            <div key={fIdx} className="space-y-1.5">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
        </div>
    );
}
