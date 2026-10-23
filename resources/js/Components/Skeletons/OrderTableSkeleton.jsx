import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

export default function OrderTableSkeleton({ rows = 6 }) {
    return (
        <SkeletonWrapper className="mx-auto w-full max-w-[1440px] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2"><Skeleton className="h-6 w-28" /><Skeleton className="h-3 w-40" /></div>
                <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-32" /></div>
            </div>
            <div className="admin-surface border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 xl:grid xl:grid-cols-2 xl:items-center xl:gap-x-6">
                <div className="flex items-center justify-between gap-2"><Skeleton className="h-12 w-full rounded-[8px] sm:w-80" /><Skeleton className="h-10 w-10 shrink-0 rounded-[7px]" /></div>
                <div className="mt-3 flex gap-2 xl:mt-0"><Skeleton className="h-10 min-w-0 flex-1 rounded-[7px]" /><Skeleton className="h-10 w-28 rounded-[7px]" /></div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="admin-surface space-y-2 border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex justify-between gap-3"><div className="space-y-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-4 w-24" /></div><Skeleton className="h-4 w-20" /></div>
                        <Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                        <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-800"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-28 rounded-[7px]" /></div>
                    </div>
                ))}
            </div>
            <div className="hidden admin-surface overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 xl:block">
                <table className="w-full table-fixed text-left">
                    <thead className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"><tr>{Array.from({ length: 7 }).map((_, i) => <th key={i} className="px-3.5 py-3.5"><Skeleton className="h-3 w-20 max-w-full" /></th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i}>
                                <td className="px-3.5 py-3.5"><Skeleton className="h-3 w-32 max-w-full" /><Skeleton className="mt-1 h-3 w-40 max-w-full" /></td>
                                {Array.from({ length: 6 }).map((_, column) => <td key={column} className="px-3.5 py-3.5"><Skeleton className="h-5 w-20 max-w-full" /></td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between admin-surface gap-2 border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><Skeleton className="h-3 w-28" /><div className="flex gap-2"><Skeleton className="h-10 w-10 rounded-[7px] sm:w-24" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-10 rounded-[7px] sm:w-24" /></div></div>
        </SkeletonWrapper>
    );
}
