import Skeleton from '@/Components/Skeleton';
import ProductTableSkeleton from '@/Components/Skeletons/ProductTableSkeleton';
import PosCardSkeleton from '@/Components/Skeletons/PosCardSkeleton';

export default function PosPageSkeleton({ mode = 'list' }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
            <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 border-b border-slate-300 dark:border-slate-800 space-y-3">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                        <div className="flex gap-2 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-7 w-20 rounded-lg shrink-0" />
                            ))}
                        </div>
                        <Skeleton className="h-7 w-28 shrink-0 rounded-lg" />
                    </div>
                </div>
                {mode === 'book' ? (
                    <ProductTableSkeleton viewMode="book" rows={24} />
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto p-3"><PosCardSkeleton count={8} mode={mode} /></div>
                )}
                <Skeleton className="mx-3 mb-3 h-12 rounded-xl md:hidden" />
            </div>
            <div className="hidden md:flex w-96 lg:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 flex-col min-h-0 shrink-0">
                <div className="p-3.5 border-b border-slate-300 dark:border-slate-800 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full rounded-lg" /></div>
                <div className="flex-1 p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
                <div className="border-t border-slate-300 dark:border-slate-800 p-4 space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-12 w-full rounded-xl" /></div>
            </div>
        </div>
    );
}
