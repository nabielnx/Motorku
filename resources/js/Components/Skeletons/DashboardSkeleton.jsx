import Skeleton from '@/Components/Skeleton';

/**
 * Dashboard skeleton — matches 5 stat cards + chart + sidebar + recent transactions table.
 */
export default function DashboardSkeleton() {
    return (
        <div className="w-full space-y-5">
            {/* Header Filter */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:px-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-56" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-36 rounded-xl" />
                        <Skeleton className="h-9 w-28 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* 5 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-7 w-32" />
                            </div>
                            <Skeleton className="w-10 h-10 rounded-xl" />
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Chart */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs h-[360px]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <div className="space-y-1.5">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <div className="text-right space-y-1.5">
                            <Skeleton className="h-3 w-24 ml-auto" />
                            <Skeleton className="h-4 w-28 ml-auto" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-48 mt-4">
                        {[45, 70, 35, 85, 60, 95, 75].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end">
                                <Skeleton className="w-full rounded-t-md" style={{ height: `${height}%` }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar — Top Selling + Stock Alerts */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs h-[360px] flex flex-col">
                    <Skeleton className="h-4 w-28 mb-3" />
                    <div className="space-y-2.5 flex-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2">
                                <div className="flex items-center gap-2.5">
                                    <Skeleton className="w-5 h-5 rounded-md" />
                                    <Skeleton className="h-3.5 w-24" />
                                </div>
                                <Skeleton className="h-3.5 w-16" />
                            </div>
                        ))}
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
                        <Skeleton className="h-4 w-36 mb-3" />
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                                    <div className="space-y-1">
                                        <Skeleton className="h-3.5 w-24" />
                                        <Skeleton className="h-2.5 w-16" />
                                    </div>
                                    <Skeleton className="h-5 w-14 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                            {['w-28', 'w-24', 'w-20', 'w-24', 'w-20'].map((w, i) => (
                                <th key={i} className="px-4 py-3">
                                    <Skeleton className={`h-3 ${w}`} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3"><Skeleton className="h-3.5 w-28" /></td>
                                <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                                <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded" /></td>
                                <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                                <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
