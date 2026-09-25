import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

/**
 * Order waiting/confirmation skeleton — matches Order/Waiting page layout 1:1.
 */
export default function WaitingSkeleton() {
    return (
        <SkeletonWrapper className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto min-h-screen">
            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col items-center p-6 space-y-6">
                {/* ═══ HEADER ICON & TITLE ═══ */}
                <div className="text-center space-y-2 pt-6 flex flex-col items-center w-full">
                    <Skeleton variant="circle" className="w-16 h-16 shadow-inner" />
                    <Skeleton className="h-6 w-52 rounded-md" />
                    <Skeleton className="h-3.5 w-64 rounded" />
                </div>

                {/* ═══ ORDER DETAILS CARD ═══ */}
                <div className="w-full bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-3.5 h-3.5 rounded" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-3.5 h-3.5 rounded" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-3.5 h-3.5 rounded" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                        <Skeleton className="h-3.5 w-12" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                </div>

                {/* ═══ RINCIAN PESANAN (INVOICE) CARD ═══ */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5">
                            <Skeleton className="w-3.5 h-3.5 rounded" />
                            <Skeleton className="h-3.5 w-24" />
                        </div>
                        <Skeleton className="h-2.5 w-16" />
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1.5 flex-1">
                                <Skeleton className="h-3.5 w-3/5" />
                                <Skeleton className="h-4 w-6 rounded" />
                            </div>
                            <Skeleton className="h-3.5 w-16" />
                        </div>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1.5 flex-1">
                                <Skeleton className="h-3.5 w-1/2" />
                                <Skeleton className="h-4 w-6 rounded" />
                            </div>
                            <Skeleton className="h-3.5 w-16" />
                        </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2.5 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-14" />
                            <Skeleton className="h-3 w-18" />
                        </div>
                        <div className="flex justify-between font-black pt-2 border-t border-slate-200">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>

                {/* ═══ STATUS BANNER ═══ */}
                <div className="w-full bg-yellow-50/80 border border-yellow-200/70 rounded-2xl p-4 flex items-center gap-3">
                    <Skeleton variant="circle" className="w-5 h-5 shrink-0" />
                    <div className="space-y-1 flex-1">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-2.5 w-full" />
                    </div>
                </div>

                {/* ═══ ACTION BUTTONS ═══ */}
                <div className="w-full space-y-2.5 pt-2">
                    <Skeleton className="h-11 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>
        </SkeletonWrapper>
    );
}
