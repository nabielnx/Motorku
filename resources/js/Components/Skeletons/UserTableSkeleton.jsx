import Skeleton from '@/Components/Skeleton';

/**
 * User table skeleton — matches User/Index layout.
 * Full-page navigation includes the plain page heading; in-page navigation keeps it mounted.
 */
export default function UserTableSkeleton({ rows = 5, fullPage = false }) {
    const tableCard = (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            {/* Filter Role Bar */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-10 mr-1" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] no-scrollbar">
                <table className="w-full min-w-[640px] text-left">
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
                                    <Skeleton className="h-4 w-16" />
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
        <div className="space-y-4" aria-busy="true" aria-label="Memuat daftar staf">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-40 mt-1.5" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Skeleton className="h-9 w-full sm:w-64 rounded-lg" />
                    <Skeleton className="h-9 w-full sm:w-36 rounded-lg" />
                </div>
            </div>

            {tableCard}
        </div>
    );
}
