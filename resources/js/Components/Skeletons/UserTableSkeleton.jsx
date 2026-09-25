import Skeleton from '@/Components/Skeleton';

/**
 * User table skeleton — matches User/Index layout.
 * When fullPage is true (cross-page navigation), renders Card 1 + Card 2.
 * When fullPage is false (in-page filter/search), renders only Card 2 so Card 1 remains mounted.
 */
export default function UserTableSkeleton({ rows = 5, fullPage = false }) {
    const tableCard = (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
            {/* Filter Role Bar */}
            <div className="p-4 bg-slate-50/60 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Filter Role:</span>
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)] no-scrollbar">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 bg-slate-50/60 dark:bg-slate-800/90">
                            <th className="py-3.5 px-5 bg-slate-50/60 dark:bg-slate-800/90">Pegawai</th>
                            <th className="py-3.5 px-5 bg-slate-50/60 dark:bg-slate-800/90">Role</th>
                            <th className="py-3.5 px-5 bg-slate-50/60 dark:bg-slate-800/90">Status Akun</th>
                            <th className="py-3.5 px-5 text-right bg-slate-50/60 dark:bg-slate-800/90">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                {/* Pegawai: Avatar circle + Name + Email */}
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-3">
                                        <Skeleton variant="circle" className="w-9 h-9 shrink-0" />
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-44" />
                                        </div>
                                    </div>
                                </td>

                                {/* Role Badge */}
                                <td className="py-4 px-5">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </td>

                                {/* Status Akun Badge */}
                                <td className="py-4 px-5">
                                    <Skeleton className="h-6 w-20 rounded-md" />
                                </td>

                                {/* Aksi Buttons */}
                                <td className="py-4 px-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Skeleton className="h-3.5 w-52" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );

    if (!fullPage) {
        return tableCard;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Card 1: Header + Search + Button */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                <div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-72 mt-1.5" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Skeleton className="h-9 w-full sm:w-64 rounded-xl" />
                    <Skeleton className="h-9 w-36 rounded-xl" />
                </div>
            </div>

            {/* Card 2: Table Card */}
            {tableCard}
        </div>
    );
}
