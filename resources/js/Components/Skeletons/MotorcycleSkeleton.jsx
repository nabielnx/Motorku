import Skeleton from '@/Components/Skeleton';

/**
 * Motorcycle sparepart mapping skeleton — replaces spinner when loading sparepart list.
 */
export default function MotorcycleSkeleton({ rows = 6 }) {
    return (
        <div className="space-y-1.5 p-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                    {/* Product image + name */}
                    <div className="col-span-5 flex items-center gap-2.5">
                        <Skeleton className="w-9 h-9 rounded-md shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <Skeleton className="h-3.5 w-3/4" />
                            <Skeleton className="h-2.5 w-1/2" />
                        </div>
                    </div>
                    {/* Category */}
                    <div className="col-span-2">
                        <Skeleton className="h-3.5 w-16" />
                    </div>
                    {/* Price */}
                    <div className="col-span-2 text-right">
                        <Skeleton className="h-3.5 w-16 ml-auto" />
                    </div>
                    {/* Stock */}
                    <div className="col-span-2 text-center">
                        <Skeleton className="h-5 w-10 mx-auto rounded" />
                    </div>
                    {/* Action */}
                    <div className="col-span-1 text-right">
                        <Skeleton className="w-7 h-7 rounded-md ml-auto" />
                    </div>
                </div>
            ))}
        </div>
    );
}
