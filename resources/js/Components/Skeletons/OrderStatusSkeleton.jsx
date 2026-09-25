import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

/**
 * Order status detail skeleton — matches Order/Status page layout 1:1.
 */
export default function OrderStatusSkeleton() {
    return (
        <SkeletonWrapper className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto min-h-screen">
            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col">
                {/* ═══ STICKY HEADER ═══ */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                    <div className="px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Skeleton className="h-5 w-28 rounded-md" />
                            <Skeleton className="h-4 w-5 rounded-full" />
                        </div>
                        <Skeleton className="h-7 w-24 rounded-xl" />
                    </div>
                </header>

                {/* ═══ ORDER CARDS LIST ═══ */}
                <div className="flex-1 p-4 space-y-4">
                    {/* Section: Pesanan Aktif */}
                    <div className="space-y-3">
                        <div className="px-0.5">
                            <Skeleton className="h-3 w-24 rounded" />
                        </div>

                        {/* Card 1: Active Order */}
                        <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            {/* Card Header: Status Dot + Badge & Date/Time */}
                            <div className="px-4 py-3 flex items-center justify-between bg-slate-50/80">
                                <div className="flex items-center gap-2">
                                    <Skeleton variant="circle" className="w-2 h-2 shrink-0" />
                                    <Skeleton className="h-5 w-24 rounded-md" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-2.5 w-10" />
                                </div>
                            </div>

                            {/* Order Number + Copy Row */}
                            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-3.5 h-3.5 rounded" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                                <Skeleton className="h-6 w-14 rounded-lg" />
                            </div>

                            {/* Customer Info Row */}
                            <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-4 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <Skeleton className="w-3 h-3 rounded" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Skeleton className="w-3 h-3 rounded" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="bg-white divide-y divide-slate-50">
                                <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-3/4" />
                                        <Skeleton className="h-2.5 w-1/3" />
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <Skeleton className="h-3 w-6" />
                                        <Skeleton className="h-3.5 w-16" />
                                    </div>
                                </div>
                                <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-2/3" />
                                        <Skeleton className="h-2.5 w-1/4" />
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <Skeleton className="h-3 w-6" />
                                        <Skeleton className="h-3.5 w-16" />
                                    </div>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 space-y-1.5">
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-14" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <div className="flex justify-between items-baseline pt-1">
                                    <Skeleton className="h-3.5 w-28" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            </div>

                            {/* Status Banner */}
                            <div className="px-4 py-3 bg-blue-50/60 border-t border-blue-100/80 flex items-center gap-2.5">
                                <Skeleton className="w-4 h-4 rounded shrink-0" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-3 w-36" />
                                    <Skeleton className="h-2.5 w-52" />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Secondary / Past Order */}
                        <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs opacity-80">
                            <div className="px-4 py-3 flex items-center justify-between bg-slate-50/80">
                                <div className="flex items-center gap-2">
                                    <Skeleton variant="circle" className="w-2 h-2 shrink-0" />
                                    <Skeleton className="h-5 w-20 rounded-md" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-2.5 w-10" />
                                </div>
                            </div>

                            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-3.5 h-3.5 rounded" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-14 rounded-lg" />
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between gap-3 bg-white">
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3.5 w-1/2" />
                                </div>
                                <Skeleton className="h-3.5 w-16" />
                            </div>

                            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex justify-between items-baseline">
                                <Skeleton className="h-3.5 w-24" />
                                <Skeleton className="h-4.5 w-20" />
                            </div>
                        </div>
                    </div>

                    <div className="pb-4" />
                </div>
            </div>
        </SkeletonWrapper>
    );
}
