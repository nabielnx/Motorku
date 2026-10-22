import React from 'react';
import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

export default function OrderShowSkeleton() {
    return (
        <SkeletonWrapper className="min-w-0 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Back link */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
            </div>

            {/* Top Card: Order Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48 rounded-lg" />
                        <div className="flex flex-wrap items-center gap-3">
                            <Skeleton className="h-3.5 w-24 rounded" />
                            <Skeleton className="h-3.5 w-28 rounded" />
                            <Skeleton className="h-3.5 w-36 rounded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="h-7 w-24 rounded-xl" />
                        <Skeleton className="h-7 w-20 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* 2-Column Content: Left Items, Right Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left (2 Cols): Items list and summary */}
                <div className="min-w-0 lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-5 w-32 rounded" />
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="px-4 sm:px-5 py-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-48 rounded" />
                                    <Skeleton className="h-3 w-28 rounded" />
                                </div>
                                <div className="space-y-1 sm:text-right">
                                    <Skeleton className="h-4 w-20 rounded ml-auto" />
                                    <Skeleton className="h-3 w-16 rounded ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                        <div className="flex justify-between items-center"><Skeleton className="h-3.5 w-16 rounded" /><Skeleton className="h-3.5 w-24 rounded" /></div>
                        <div className="flex justify-between items-center"><Skeleton className="h-3.5 w-14 rounded" /><Skeleton className="h-3.5 w-20 rounded" /></div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700"><Skeleton className="h-4 w-20 rounded" /><Skeleton className="h-5 w-28 rounded" /></div>
                    </div>
                </div>

                {/* Right (1 Col): Status Timeline */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm h-fit space-y-4">
                    <Skeleton className="h-5 w-32 rounded" />
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <Skeleton variant="circle" className="w-3.5 h-3.5 shrink-0" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-3.5 w-20 rounded" />
                                    <Skeleton className="h-2.5 w-28 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SkeletonWrapper>
    );
}
