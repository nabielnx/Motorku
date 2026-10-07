import Skeleton from '@/Components/Skeleton';

/**
 * Motorcycle sparepart mapping skeleton — replaces spinner when loading sparepart list.
 */
export default function MotorcycleSkeleton({ rows = 6 }) {
    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800" aria-busy="true" aria-label="Memuat sparepart motor">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] md:grid-cols-[repeat(11,minmax(0,1fr))_116px] gap-x-2 gap-y-1.5 md:gap-3 md:items-center py-2.5 px-2.5 sm:px-4 bg-white dark:bg-slate-900"
                >
                    {/* Product image + name */}
                    <div className="col-span-3 md:col-span-5 flex items-center gap-2.5">
                        <Skeleton className="w-9 h-9 rounded-md shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <Skeleton className="h-3.5 w-3/4" />
                            <Skeleton className="h-2.5 w-1/2" />
                        </div>
                    </div>
                    {/* Category */}
                    <div className="hidden md:block md:col-span-2">
                        <Skeleton className="h-3.5 w-16" />
                    </div>
                    {/* Price */}
                    <div className="col-span-1 md:col-span-2 text-right">
                        <Skeleton className="h-3.5 w-16 ml-auto" />
                    </div>
                    {/* Stock */}
                    <div className="hidden md:block md:col-span-2 text-center">
                        <Skeleton className="h-5 w-10 mx-auto rounded" />
                    </div>
                    {/* Action */}
                    <div className="col-span-1 flex justify-end gap-1">
                        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="w-6 h-6 rounded-md" />)}
                    </div>
                </div>
            ))}
        </div>
    );
}
