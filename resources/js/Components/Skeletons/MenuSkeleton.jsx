import React from 'react';
import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';
import clsx from 'clsx';

/**
 * Product Card Skeleton matching Motorku storefront card 1:1.
 * Monochromatic neutral grayscale.
 */
function CardSkeleton({ isGrid = false }) {
    return (
        <article
            className={clsx(
                'flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden',
                isGrid
                    ? 'w-full h-full'
                    : 'w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 snap-start'
            )}
        >
            <div>
                {/* 1:1 Square Photo Container */}
                <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    <Skeleton className="w-full h-full !rounded-none" />
                </div>

                {/* Card Info Content */}
                <div className="p-1.5 sm:p-2 space-y-1.5">
                    {/* Title (2 lines) */}
                    <div className="space-y-1">
                        <Skeleton className="h-2.5 sm:h-3 w-5/6 rounded" />
                        <Skeleton className="h-2.5 sm:h-3 w-3/5 rounded" />
                    </div>

                    {/* Discount & Strikethrough Row */}
                    <div className="mt-1 flex items-center gap-1">
                        <Skeleton className="h-3 w-7 rounded-[3px]" />
                        <Skeleton className="h-2 w-10 sm:w-12 rounded" />
                    </div>

                    {/* Price Row */}
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                        <Skeleton className="h-3.5 sm:h-4 w-14 sm:w-16 rounded" />
                    </div>
                </div>
            </div>
        </article>
    );
}

/**
 * Customer storefront skeleton — matches Order/Menu (Katalog Sparepart) 1:1.
 * Accurate on both mobile and widescreen desktop (sidebar categories grid).
 *
 * @param {boolean} fullPage - When true renders the complete storefront.
 * @param {boolean} isGrid - Grid view flag for partial rendering.
 * @param {number} count - Total items for grid view.
 */
export default function MenuSkeleton({ fullPage = true, isGrid = false, count = 10 }) {
    if (!fullPage) {
        return (
            <SkeletonWrapper className="w-full">
                {isGrid ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-4">
                        {Array.from({ length: count }).map((_, i) => (
                            <CardSkeleton key={i} isGrid={true} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 pb-4">
                        {[1, 2].map((section) => (
                            <section key={section}>
                                <div className="mb-2 flex items-center justify-between">
                                    <Skeleton className="h-4 sm:h-5 w-32 rounded" />
                                    <Skeleton className="h-3 w-16 rounded" />
                                </div>
                                <div className="flex gap-2 sm:gap-2.5 overflow-x-hidden pb-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <CardSkeleton key={i} isGrid={false} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </SkeletonWrapper>
        );
    }

    return (
        <SkeletonWrapper className="customer-storefront min-h-screen bg-[#f8fafc] text-slate-900">
            {/* ═══ Top Announcement Bar (Desktop) ═══ */}
            <div className="hidden bg-slate-900/10 sm:block border-b border-slate-200/40">
                <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-1.5 lg:px-8">
                    <Skeleton className="h-2.5 w-48 rounded" />
                    <Skeleton className="h-2.5 w-32 rounded" />
                </div>
            </div>

            {/* ═══ 1. STORE HEADER ═══ */}
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white shadow-2xs overflow-hidden relative">
                <div className="mx-auto flex min-h-[54px] max-w-[1280px] items-center justify-between gap-2 px-3.5 sm:min-h-[62px] sm:gap-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Logo & Store Name Placeholder */}
                    <div className="flex shrink-0 items-center gap-2.5">
                        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                        <Skeleton className="h-5 w-20 sm:w-24 rounded" />
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Skeleton className="h-4 w-14 rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                    </div>

                    {/* Search Bar Placeholder */}
                    <div className="flex-1 max-w-md px-1">
                        <div className="h-8.5 sm:h-9 w-full rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs flex items-center px-3.5 gap-2">
                            <Skeleton variant="circle" className="w-3.5 h-3.5 shrink-0" />
                            <Skeleton className="h-3 w-32 rounded" />
                        </div>
                    </div>

                    {/* Header Action Icons (Order history & Cart) */}
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="w-8 h-8 sm:w-9 sm:h-9" />
                        <Skeleton variant="circle" className="w-8 h-8 sm:w-9 sm:h-9" />
                    </div>
                </div>
            </header>

            {/* ═══ 2. MOTOR SAYA BANNER ═══ */}
            <section className="w-full bg-slate-100 border-b border-slate-200/80 rounded-b-[36px] sm:rounded-b-[48px] shadow-2xs mb-3.5 sm:mb-4.5 overflow-hidden">
                <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
                    <div className="flex items-center gap-3 sm:gap-4 pl-3 sm:pl-4 md:pl-5 pr-3.5 sm:pr-5 md:pr-6">
                        <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 sm:h-4 w-24 rounded" />
                            <Skeleton className="h-2.5 sm:h-3 w-56 sm:w-72 rounded" />
                        </div>
                        <Skeleton className="w-4 h-4 rounded shrink-0" />
                    </div>
                </div>
            </section>

            {/* ═══ 3. MAIN STOREFRONT CONTENT ═══ */}
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-12">
                {/* Promo Banner Section */}
                <section className="pb-3">
                    <div className="relative rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200/80 overflow-hidden p-2.5 sm:p-3 shadow-2xs">
                        <div className="flex items-stretch gap-2.5">
                            {/* Left Promo Graphic */}
                            <div className="w-[45%] sm:w-[35%] shrink-0 rounded-xl sm:rounded-2xl bg-slate-200 p-3 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-28 rounded" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-lg" />
                            </div>

                            {/* Right Promo Product Cards */}
                            <div className="flex-1 flex gap-2 sm:gap-2.5 overflow-x-hidden">
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ 4. RESPONSIVE LAYOUT (Desktop Sidebar + Main Products) ═══ */}
                <div className="grid grid-cols-1 gap-y-2.5 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-x-9 lg:gap-y-0">
                    {/* Desktop Category Sidebar */}
                    <aside className="min-w-0 hidden lg:block">
                        <div className="sticky top-24 space-y-2">
                            <Skeleton className="h-9 w-full rounded-xl" />
                            <Skeleton className="h-9 w-full rounded-xl" />
                            <Skeleton className="h-9 w-full rounded-xl" />
                            <Skeleton className="h-9 w-full rounded-xl" />
                            <Skeleton className="h-9 w-full rounded-xl" />
                        </div>
                    </aside>

                    {/* Mobile Category Horizontal Scroll Pills */}
                    <div className="lg:hidden py-1 mb-2">
                        <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-0.5">
                            <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                            <Skeleton className="h-8 w-28 rounded-full shrink-0" />
                            <Skeleton className="h-8 w-32 rounded-full shrink-0" />
                            <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                        </div>
                    </div>

                    {/* Main Products Shelves */}
                    <main className="min-w-0 lg:col-start-2 space-y-6">
                        {/* Shelf 1 */}
                        <section>
                            <div className="mb-2 flex items-center justify-between">
                                <Skeleton className="h-4 sm:h-5 w-36 rounded" />
                                <Skeleton className="h-3 w-16 rounded" />
                            </div>
                            <div className="flex gap-2 sm:gap-2.5 overflow-x-hidden pb-2">
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                            </div>
                        </section>

                        {/* Shelf 2 */}
                        <section>
                            <div className="mb-2 flex items-center justify-between">
                                <Skeleton className="h-4 sm:h-5 w-32 rounded" />
                                <Skeleton className="h-3 w-16 rounded" />
                            </div>
                            <div className="flex gap-2 sm:gap-2.5 overflow-x-hidden pb-2">
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                                <CardSkeleton isGrid={false} />
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </SkeletonWrapper>
    );
}
