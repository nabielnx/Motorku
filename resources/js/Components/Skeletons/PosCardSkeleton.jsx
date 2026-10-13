import Skeleton from '@/Components/Skeleton';

export default function PosCardSkeleton({ count = 8, mode = 'list' }) {
    const isGrid = mode === 'grid';
    return (
        <div className={`grid auto-rows-fr gap-2 ${isGrid ? 'grid-cols-[repeat(auto-fill,minmax(144px,1fr))]' : 'grid-cols-1 2xl:grid-cols-2'}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`flex border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${isGrid ? 'flex-col rounded-xl overflow-hidden' : 'items-start gap-3 rounded-xl p-2.5'}`}
                >
                    <Skeleton className={`${isGrid ? 'aspect-square w-full shrink-0 rounded-none' : 'h-14 w-14 shrink-0 rounded-lg'}`} />
                    <div className={`flex min-w-0 flex-1 self-stretch flex-col ${isGrid ? 'w-full p-2.5' : ''}`}>
                        <div className="flex min-h-14 flex-1 flex-col justify-between gap-2">
                            <Skeleton className="h-4 w-3/5" />
                            <Skeleton className="h-4 w-16 shrink-0" />
                        </div>
                        {!isGrid && <Skeleton className="mt-1 h-4 w-2/3" />}
                        <div className="mt-2 flex items-center justify-between gap-2">
                            <Skeleton className="h-3 w-2/5" />
                            {!isGrid && <Skeleton className="h-3 w-12" />}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
