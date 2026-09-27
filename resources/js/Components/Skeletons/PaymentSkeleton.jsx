import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

/**
 * Payment confirmation layout with a single cashier payment method.
 */
export default function PaymentSkeleton() {
    return (
        <SkeletonWrapper className="h-full w-full bg-slate-100 font-sans text-slate-800 flex justify-center overflow-y-auto min-h-screen">
            <div className="w-full max-w-md bg-white min-h-full shadow-2xl flex flex-col pb-24">
                {/* ═══ HEADER ═══ */}
                <header className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                </header>

                {/* ═══ CONTENT ═══ */}
                <div className="flex-1 p-4 space-y-4">
                    {/* Order Info Banner (Ambil di Toko) */}
                    <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-4 h-4 rounded" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-4 h-4 rounded" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>

                    {/* Order Items Summary Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3 w-14" />
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 border-b border-slate-200/60 pb-1.5 px-0.5">
                            <Skeleton className="col-span-6 h-2.5 w-20" />
                            <Skeleton className="col-span-2 h-2.5 w-8 mx-auto" />
                            <Skeleton className="col-span-4 h-2.5 w-14 ml-auto" />
                        </div>

                        {/* Items Rows */}
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-12 gap-2 items-center px-0.5 py-0.5 border-b border-slate-100 pb-2">
                                <div className="col-span-6 space-y-1">
                                    <Skeleton className="h-3.5 w-4/5" />
                                    <Skeleton className="h-2.5 w-1/2" />
                                </div>
                                <Skeleton className="col-span-2 h-3.5 w-6 mx-auto" />
                                <Skeleton className="col-span-4 h-3.5 w-16 ml-auto" />
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-center px-0.5 py-0.5">
                                <div className="col-span-6 space-y-1">
                                    <Skeleton className="h-3.5 w-3/4" />
                                </div>
                                <Skeleton className="col-span-2 h-3.5 w-6 mx-auto" />
                                <Skeleton className="col-span-4 h-3.5 w-16 ml-auto" />
                            </div>
                        </div>
                        <div className="border-t border-slate-200 pt-2 space-y-2">
                            <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-20" /></div>
                            <div className="flex justify-between"><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-20" /></div>
                            <div className="flex justify-between border-t border-slate-200 pt-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-24" /></div>
                        </div>
                    </div>

                    {/* Customer Name Input */}
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>

                    {/* Cashier payment method */}
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-40" />
                        <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3"><Skeleton className="h-5 w-5" /><div className="space-y-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-52" /></div></div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </SkeletonWrapper>
    );
}
