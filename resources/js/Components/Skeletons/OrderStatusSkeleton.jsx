import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

export default function OrderStatusSkeleton() {
    return (
        <SkeletonWrapper className="h-full w-full min-h-screen bg-slate-100 flex justify-center overflow-y-auto">
            <div className="w-full max-w-md min-h-full bg-white shadow-2xl flex flex-col">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3.5 flex items-center justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-28 rounded-xl" />
                </header>
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-3 w-20" />
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2"><Skeleton variant="circle" className="h-2 w-2" /><Skeleton className="h-5 w-20 rounded-md" /></div>
                                <div className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="ml-auto h-2.5 w-10" /></div>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-4 py-3">
                                <div className="min-w-0 flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/3" /></div>
                                <Skeleton className="h-4 w-20 shrink-0" /><Skeleton className="h-4 w-4 shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SkeletonWrapper>
    );
}
