import Skeleton from '@/Components/Skeleton';

/**
 * Report skeleton — matches Report/Index layout with standalone toolbar, 4 KPI cards, and 5-col content grid (Top 5 table + Category breakdown).
 */
export default function ReportSkeleton() {
    return (
        <div className="space-y-5">
            {/* Toolbar: Period Dropdown + Print Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Skeleton className="h-9 w-36 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-1.5 flex-1">
                                <Skeleton className="h-2.5 w-24" />
                                <Skeleton className="h-6 w-28" />
                                <Skeleton className="h-2.5 w-20" />
                            </div>
                            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid: Top Products (3 cols) + Category Breakdown (2 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Top Selling — 3 cols */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-2.5 w-44 mt-1" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/60">
                                    <th className="py-2.5 px-4 w-8"><Skeleton className="h-3 w-4" /></th>
                                    <th className="py-2.5 px-4"><Skeleton className="h-3 w-20" /></th>
                                    <th className="py-2.5 px-4"><Skeleton className="h-3 w-16" /></th>
                                    <th className="py-2.5 px-4 text-center"><Skeleton className="h-3 w-12 mx-auto" /></th>
                                    <th className="py-2.5 px-4 text-right"><Skeleton className="h-3 w-16 ml-auto" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <td className="py-2.5 px-4"><Skeleton className="h-3.5 w-3" /></td>
                                        <td className="py-2.5 px-4"><Skeleton className="h-3.5 w-32" /></td>
                                        <td className="py-2.5 px-4"><Skeleton className="h-4 w-16 rounded" /></td>
                                        <td className="py-2.5 px-4 text-center"><Skeleton className="h-3.5 w-8 mx-auto" /></td>
                                        <td className="py-2.5 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Breakdown — 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-2.5 w-48 mt-1" />
                    </div>
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-3.5 w-16" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
