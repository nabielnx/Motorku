import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';
import { PaginationSkeleton } from '@/Components/Pagination';

export default function SupplierSkeleton() {
    return <SkeletonWrapper className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-3 p-3 sm:p-6 lg:p-8">
        <div className="flex shrink-0 items-center justify-between gap-2"><div className="space-y-2"><Skeleton className="h-6 w-28" /><Skeleton className="h-3 w-20" /></div><Skeleton className="h-9 w-36" /></div>
        <div className="flex shrink-0 gap-2"><Skeleton className="h-10 min-w-0 flex-1 sm:max-w-md" /><Skeleton className="h-10 w-16" /></div>
        <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-3 md:hidden">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="admin-surface space-y-3 border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-6 w-16 shrink-0" /></div><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>)}</div>
            <div className="admin-surface hidden overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:block">
                <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-2/3" />)}</div>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="grid grid-cols-4 gap-4 border-b border-slate-200 p-4 last:border-b-0 dark:border-slate-700"><Skeleton className="h-4 w-full" /><div className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div><Skeleton className="h-3 w-full" /><Skeleton className="ml-auto h-6 w-16" /></div>)}
            </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2"><Skeleton className="h-3 w-28" /><PaginationSkeleton /></div>
    </SkeletonWrapper>;
}
