import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

const panel = 'rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900';

export default function DashboardSkeleton() {
    return (
        <SkeletonWrapper className="grid w-full grid-cols-12 items-start gap-3 sm:gap-4 xl:-mt-4">
            <div className="col-span-12 flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Skeleton className="h-6 w-40" />
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <Skeleton className="h-9 w-full rounded-xl sm:w-36" />
                    <Skeleton className="h-9 w-full rounded-xl sm:w-40" />
                </div>
            </div>

            <div className="col-span-12 grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl bg-white px-3 pb-3 pt-2 dark:bg-slate-900 sm:px-4 sm:pb-4 sm:pt-2.5">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-2"><Skeleton className="h-3 w-24 sm:w-28" /><Skeleton className="h-6 w-16 sm:h-8 sm:w-32" /></div>
                            <Skeleton className="hidden h-5 w-5 sm:block" />
                        </div>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-slate-200 dark:bg-slate-700" />
                    </div>
                ))}
            </div>

            <div className={`${panel} col-span-12 order-2 flex h-[390px] min-h-0 flex-col overflow-hidden xl:order-1 xl:col-span-8`}>
                <div className="flex shrink-0 items-center justify-between bg-slate-100 px-4 py-3 dark:bg-slate-800 sm:px-5"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-20" /></div>
                <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden sm:hidden dark:divide-slate-800">
                    {Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex justify-between gap-3 px-4 py-3"><div className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-20" /></div><div className="space-y-2"><Skeleton className="ml-auto h-3 w-20" /><Skeleton className="ml-auto h-3 w-12" /></div></div>)}
                </div>
                <div className="hidden min-h-0 flex-1 overflow-hidden sm:block">
                    <table className="w-full min-w-[650px] text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"><tr>{Array.from({ length: 5 }).map((_, i) => <th key={i} className="px-4 py-2"><Skeleton className="h-3 w-20" /></th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{Array.from({ length: 7 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-2"><Skeleton className="h-3.5 w-20" /></td>)}</tr>)}</tbody>
                    </table>
                </div>
                <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-800/60"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-44" /></div>
            </div>

            <div className={`${panel} col-span-12 order-1 flex h-[280px] min-h-0 flex-col overflow-hidden xl:order-2 xl:col-span-4 xl:h-auto xl:self-stretch`}>
                <div className="shrink-0 bg-slate-100 px-4 py-3 dark:bg-slate-800 sm:px-5"><Skeleton className="h-4 w-32" /></div>
                <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5 xl:py-3">
                    <div className="relative min-h-0 flex-1">
                        <div className="absolute inset-0 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex justify-between gap-3 border-t border-slate-100 py-2 dark:border-slate-800"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-12" /></div>)}
                        </div>
                    </div>
                    <Skeleton className="mt-2 h-3 w-20 shrink-0" />
                </div>
            </div>

            <div className={`${panel} col-span-12 order-3 flex h-[280px] flex-col overflow-hidden xl:col-span-8`}>
                <div className="flex shrink-0 items-center justify-between gap-3 bg-slate-100 px-4 py-3 dark:bg-slate-800 sm:px-5"><Skeleton className="h-5 w-24" /><Skeleton className="h-3 w-44" /></div>
                <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="flex min-h-0 flex-1 items-end gap-3 pl-14 pt-1">{[30, 55, 20, 75, 40, 60, 35].map((height, i) => <div key={i} className="flex h-full flex-1 items-end"><div className="w-full" style={{ height: `${height}%` }}><Skeleton className="h-full w-full rounded-t-md" /></div></div>)}</div>
                    <div className="flex h-7 shrink-0 items-end justify-between gap-3 pb-1 pl-14">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-2 w-8" />)}</div>
                </div>
            </div>

            <div className={`${panel} col-span-12 order-4 h-[280px] overflow-hidden xl:col-span-4`}>
                <div className="bg-slate-100 px-4 py-3 dark:bg-slate-800 sm:px-5"><Skeleton className="h-4 w-32" /></div>
                <div className="px-4 pb-3 pt-1 sm:px-5">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 dark:border-slate-800"><div className="flex flex-1 items-center gap-2"><Skeleton className="h-3 w-5" /><Skeleton className="h-3 w-3/4" /></div><Skeleton className="h-3 w-16" /></div>)}
                </div>
            </div>
        </SkeletonWrapper>
    );
}
