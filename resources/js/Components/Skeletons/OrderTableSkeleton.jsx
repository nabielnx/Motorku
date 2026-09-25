import Skeleton from '@/Components/Skeleton';

/**
 * Order table skeleton — matches Order/Index layout with 4 KPI cards, unified control bar, and 8-column table.
 */
export default function OrderTableSkeleton({ rows = 6 }) {
    return (
        <div className="w-full space-y-4 p-3.5 sm:p-5">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
                        <Skeleton className="h-2.5 w-28 mb-2" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                ))}
            </div>

            {/* Main Transaction Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
                {/* Unified Control Bar */}
                <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                    <Skeleton className="h-5 w-36 shrink-0" />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-7 w-16 rounded-lg shrink-0" />
                            ))}
                        </div>

                        {/* Search Input */}
                        <Skeleton className="h-8 w-full sm:w-72 rounded-lg" />
                    </div>
                </div>

                {/* 8-Column Data Table */}
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)] no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10">
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-20" /></th>
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-20" /></th>
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-12" /></th>
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-16" /></th>
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-14" /></th>
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-16" /></th>
                                <th className="px-3.5 py-2.5"><Skeleton className="h-3 w-14" /></th>
                                <th className="px-3.5 py-2.5 text-right"><Skeleton className="h-3 w-10 ml-auto" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                            {Array.from({ length: rows }).map((_, i) => (
                                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-3.5 py-3"><Skeleton className="h-3.5 w-24" /></td>
                                    <td className="px-3.5 py-3"><Skeleton className="h-3.5 w-28" /></td>
                                    <td className="px-3.5 py-3"><Skeleton className="h-5 w-14 rounded-md" /></td>
                                    <td className="px-3.5 py-3"><Skeleton className="h-3.5 w-24" /></td>
                                    <td className="px-3.5 py-3"><Skeleton className="h-3.5 w-20" /></td>
                                    <td className="px-3.5 py-3"><Skeleton className="h-5 w-20 rounded-md" /></td>
                                    <td className="px-3.5 py-3"><Skeleton className="h-3.5 w-16" /></td>
                                    <td className="px-3.5 py-3 text-right">
                                        <Skeleton className="h-7 w-16 rounded-md ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Skeleton className="h-3.5 w-48" />
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
