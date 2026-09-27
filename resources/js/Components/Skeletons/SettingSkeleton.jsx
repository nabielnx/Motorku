import Skeleton from '@/Components/Skeleton';

/**
 * Matches the settings cards, including QRIS and the current form sections.
 */
export default function SettingSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-8" aria-busy="true" aria-label="Memuat pengaturan">
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

            {/* QRIS store image */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3"><Skeleton className="w-5 h-5" /><Skeleton className="h-5 w-36" /></div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex flex-wrap items-start gap-4"><Skeleton className="h-32 w-32 rounded-xl" /><div className="space-y-2"><Skeleton className="h-9 w-32 rounded-lg" /><Skeleton className="h-3 w-40" /></div></div>
            </div>

            {/* Banner Promo Card */}
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
                            <div className="w-full aspect-[16/5] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Setting form sections */}
            {[4, 2, 2, 2, 2, 2].map((fieldCount, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <Skeleton className="w-5 h-5 rounded-md" />
                        <Skeleton className="h-5 w-36" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: fieldCount }).map((_, fIdx) => (
                            <div key={fIdx} className={`space-y-1.5 ${idx === 0 && fIdx === 3 ? 'sm:col-span-2' : ''}`}>
                                <Skeleton className="h-3 w-24" />
                                {(idx === 1 && fIdx === 0) || (idx === 2 && fIdx === 1) || idx === 3
                                    ? <div className="flex items-center gap-3 pt-1"><Skeleton className="h-6 w-11 rounded-full" /><Skeleton className="h-3 w-14" /></div>
                                    : <Skeleton className="h-10 w-full rounded-xl" />}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <Skeleton className="h-11 w-36 rounded-xl" />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <Skeleton className="h-5 w-36" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-9 w-40 rounded-lg" />
            </div>
        </div>
    );
}
