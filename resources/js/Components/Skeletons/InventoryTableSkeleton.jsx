import Skeleton from '@/Components/Skeleton';

/**
 * Inventory table skeleton — matches the Inventory/Index layout with summary cards + table.
 */
export default function InventoryTableSkeleton({ rows = 6 }) {
    return (
        <div className="w-full space-y-4">
            {/* Stats summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                        <div className="space-y-1.5">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-14" />
                        </div>
                        <Skeleton className="w-9 h-9 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Table container */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header + search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
                </div>

                {/* Filter tabs + sort */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-7 w-20 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-7 w-36 rounded-lg" />
                </div>

                {/* Table */}
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90">
                            {['w-32', 'w-20', 'w-24', 'w-20', 'w-20'].map((w, i) => (
                                <th key={i} className="py-3 px-4">
                                    <Skeleton className={`h-3 ${w}`} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-11 h-11 rounded-lg" />
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-3.5 w-28" />
                                            <Skeleton className="h-2.5 w-16" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3"><Skeleton className="h-3.5 w-14" /></td>
                                <td className="px-4 py-3"><Skeleton className="h-3.5 w-16" /></td>
                                <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-md" /></td>
                                <td className="px-4 py-3 text-right">
                                    <Skeleton className="h-8 w-24 rounded-lg ml-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <Skeleton className="h-3.5 w-40" />
                    <div className="flex gap-1.5">
                        <Skeleton className="h-7 w-20 rounded-lg" />
                        <Skeleton className="h-7 w-14 rounded-lg" />
                        <Skeleton className="h-7 w-20 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
