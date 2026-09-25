import Skeleton from '@/Components/Skeleton';

/**
 * Motorcycle page skeleton — matches the exact layout of Motorcycle/Index.
 */
export default function MotorcyclePageSkeleton({ rows = 5 }) {
    return (
        <div className="p-3 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Header & Filter Section */}
                <div className="p-3 sm:p-3.5 space-y-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                    {/* Top Row: Title, Badge & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Skeleton className="h-6 w-32 rounded-md" />
                            <Skeleton className="h-5 w-10 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <Skeleton className="h-8 w-36 rounded-lg" />
                            <Skeleton className="h-8 w-28 rounded-lg" />
                        </div>
                    </div>

                    {/* Filter Bar: Search + Brand Chips + Tipe Chips */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 pt-1">
                        <Skeleton className="h-8 w-full md:w-64 rounded-lg" />
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                            <Skeleton className="h-7 w-56 rounded-lg shrink-0" />
                            <Skeleton className="h-7 w-48 rounded-lg shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Motorcycle Models List */}
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="p-3 sm:p-3.5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    {/* Thumbnail Frame */}
                                    <Skeleton className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg shrink-0" />
                                    {/* Titles & Meta */}
                                    <div className="min-w-0 space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-14" />
                                            <Skeleton className="h-5 w-40" />
                                        </div>
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>

                                {/* Right: Compatibility Badge + Action Buttons */}
                                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                                    <Skeleton className="h-7 w-32 rounded-lg" />
                                    <div className="flex items-center gap-1">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Pagination */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                    <Skeleton className="h-3.5 w-44" />
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-14 rounded-lg" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
