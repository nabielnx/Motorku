import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

export default function OrderTableSkeleton({ rows = 6 }) {
    return (
        <SkeletonWrapper className="mx-auto w-full max-w-[1440px] space-y-3 p-2 sm:space-y-4 sm:px-5 sm:pb-5 sm:pt-0">
            <div className="space-y-1 px-1 py-1 sm:hidden"><div className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /></div><Skeleton className="h-3 w-28" /></div>
            <div className="hidden flex-wrap items-center gap-8 border-b border-slate-200 px-1 pb-3 sm:flex dark:border-slate-800">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-36" />)}</div>

            <div className="overflow-hidden bg-white sm:rounded-xl sm:border sm:border-slate-200 dark:bg-slate-900 dark:sm:border-slate-800">
                <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:sm:bg-slate-800">
                    <div className="flex w-full items-center justify-between lg:w-auto"><Skeleton className="h-5 w-20" /><Skeleton className="h-7 w-7 lg:hidden" /></div>
                    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                        <div className="hidden items-center gap-1 sm:flex">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-lg" />)}</div>
                        <Skeleton className="order-first h-8 w-full rounded-lg sm:order-none sm:w-64 lg:w-72" />
                        <Skeleton className="h-8 w-40 rounded-lg sm:hidden" />
                        <Skeleton className="h-8 w-32 rounded-lg" />
                    </div>
                </div>

                <div className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
                    {Array.from({ length: rows }).map((_, i) => <div key={i} className="space-y-2 px-3 py-3"><div className="flex justify-between gap-3"><div className="space-y-1"><Skeleton className="h-3 w-32" /><Skeleton className="h-4 w-24" /></div><Skeleton className="h-4 w-20" /></div><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /><div className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800"><Skeleton className="h-5 w-20" /><Skeleton className="h-7 w-24 rounded-md" /></div></div>)}
                </div>

                <div className="hidden max-h-[calc(100vh-380px)] overflow-auto sm:block">
                    <table className="w-full min-w-[840px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"><tr>{[24, 20, 12, 16, 16, 20, 24].map((_, i) => <th key={i} className="px-3.5 py-2.5"><Skeleton className={`h-3 w-20 ${i === 6 ? 'ml-auto' : ''}`} /></th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{Array.from({ length: rows }).map((_, i) => <tr key={i}><td className="px-3.5 py-2.5"><Skeleton className="h-3 w-32" /><Skeleton className="mt-1 h-3 w-40" /></td><td className="px-3.5 py-2.5"><Skeleton className="h-3 w-28" /></td><td className="px-3.5 py-2.5"><Skeleton className="h-3 w-12" /></td><td className="px-3.5 py-2.5"><Skeleton className="h-3 w-24" /></td><td className="w-[150px] px-3.5 py-2.5"><Skeleton className="h-5 w-20 rounded-md" /></td><td className="w-[150px] px-3.5 py-2.5"><Skeleton className="h-3 w-16" /></td><td className="w-[210px] px-3.5 py-2.5"><Skeleton className="ml-auto h-7 w-28 rounded-md" /></td></tr>)}</tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3 dark:border-slate-800"><Skeleton className="h-3 w-36" /><div className="flex gap-2"><Skeleton className="h-7 w-8 rounded-lg sm:w-24" /><Skeleton className="h-7 w-10" /><Skeleton className="h-7 w-8 rounded-lg sm:w-24" /></div></div>
            </div>
        </SkeletonWrapper>
    );
}
