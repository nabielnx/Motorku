import React from 'react';
import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';
import clsx from 'clsx';

/**
 * Product Grid Card Skeleton — matches Product/Index grid view card 1:1.
 */
function ProductGridCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs flex flex-col relative">
            {/* Image Container with Badges */}
            <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 overflow-hidden">
                <Skeleton className="!absolute inset-0 w-full h-full !rounded-none" />
                {/* Badge on Image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
                    <Skeleton className="h-4.5 w-20 rounded-md shadow-2xs" />
                </div>
            </div>

            {/* Card Content */}
            <div className="p-3 flex flex-col flex-1 space-y-2">
                {/* Category Pill */}
                <Skeleton className="h-3.5 w-16 rounded" />

                {/* Title (2 lines) */}
                <div className="space-y-1">
                    <Skeleton className="h-3.5 w-5/6 rounded" />
                    <Skeleton className="h-3.5 w-3/5 rounded" />
                </div>

                {/* SKU */}
                <Skeleton className="h-2.5 w-20 rounded" />

                {/* Price */}
                <div className="mt-auto pt-1">
                    <Skeleton className="h-5 w-24 rounded" />
                </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-2 py-1.5 flex items-center justify-between gap-1">
                {/* Add / Adjust Stock */}
                <Skeleton className="h-6 flex-1 rounded-lg" />
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                {/* Edit */}
                <Skeleton className="w-6 h-6 rounded-lg" />
                {/* Delete */}
                <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
        </div>
    );
}

/**
 * Product table & grid skeleton for Product/Index.
 * Supports both viewMode="grid" (kotak-kotak) and viewMode="list" (tabel baris).
 * When fullPage is true, wraps with card header, tabs, filter toolbar, and view toggles.
 *
 * @param {number} rows - Number of skeleton rows / cards to render.
 * @param {boolean} fullPage - If true, wraps with full card frame and filter header.
 * @param {'grid'|'list'} viewMode - View mode ('grid' for card grid, 'list' for table).
 */
export default function ProductTableSkeleton({ rows = 16, fullPage = false, viewMode }) {
    // Resolve active viewMode: prop -> localStorage -> default 'list'
    let activeView = viewMode;
    if (!activeView && typeof window !== 'undefined') {
        try {
            activeView = localStorage.getItem('product_view_mode_v2') || 'list';
        } catch {
            activeView = 'list';
        }
    }
    if (!activeView) activeView = 'list';

    // ─── 1. Grid Skeleton View (Kotak-kotak) ───
    const gridContent = (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,180px))] gap-3 p-3 sm:p-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <ProductGridCardSkeleton key={i} />
                ))}
            </div>

            {/* Pinned Pagination Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 shrink-0 z-10">
                <Skeleton className="h-3.5 w-44 rounded" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );

    // ─── 2. Table Skeleton View (List / Tabel) ───
    const tableContent = (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col justify-between">
            <table className="w-full text-left border-collapse min-w-[900px]">
                {/* Table headers */}
                <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                        <th className="w-8 pl-3 pr-0 py-2.5 text-center"></th>
                        <th className="pl-2 pr-4 py-2.5 font-bold min-w-[260px]">
                            <Skeleton className="h-3 w-40" />
                        </th>
                        <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                            <Skeleton className="h-3 w-16" />
                        </th>
                        <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                            <Skeleton className="h-3 w-20" />
                        </th>
                        <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                            <Skeleton className="h-3 w-20" />
                        </th>
                        <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                            <Skeleton className="h-3 w-12" />
                        </th>
                        <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                            <Skeleton className="h-3 w-14" />
                        </th>
                        <th className="w-28 px-4 py-2.5 text-center font-bold whitespace-nowrap">
                            <Skeleton className="h-3 w-12 mx-auto" />
                        </th>
                    </tr>
                </thead>

                {/* Table rows */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Expander */}
                            <td className="w-8 pl-3 pr-0 py-3 text-center">
                                <Skeleton className="w-4 h-4 mx-auto rounded" />
                            </td>

                            {/* Gambar & Nama Produk */}
                            <td className="pl-2 pr-4 py-3 min-w-[260px]">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <Skeleton className="h-3.5 w-36" />
                                        <Skeleton className="h-2.5 w-20" />
                                    </div>
                                </div>
                            </td>

                            {/* Kategori */}
                            <td className="px-4 py-3 whitespace-nowrap">
                                <Skeleton className="h-3.5 w-16" />
                            </td>

                            {/* Harga Modal */}
                            <td className="px-4 py-3 whitespace-nowrap">
                                <Skeleton className="h-3.5 w-20" />
                            </td>

                            {/* Harga Jual */}
                            <td className="px-4 py-3 whitespace-nowrap">
                                <Skeleton className="h-3.5 w-20" />
                            </td>

                            {/* Stok */}
                            <td className="px-4 py-3 whitespace-nowrap">
                                <Skeleton className="h-4 w-10" />
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </td>

                            {/* Aksi */}
                            <td className="w-28 px-4 py-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                    <Skeleton className="w-6 h-6 rounded-md" />
                                    <Skeleton className="w-6 h-6 rounded-md" />
                                    <Skeleton className="w-6 h-6 rounded-md" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 shrink-0 z-10">
                <Skeleton className="h-3.5 w-44 rounded" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );

    const activeContent = activeView === 'grid' ? gridContent : tableContent;

    if (!fullPage) {
        return <SkeletonWrapper>{activeContent}</SkeletonWrapper>;
    }

    return (
        <SkeletonWrapper className="p-3 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Header & Filter Section */}
                <div className="p-3 sm:p-3.5 space-y-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                    {/* Top Row: Title, Badge, Tabs & Action */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Skeleton className="h-6 w-32 rounded-md" />
                            <Skeleton className="h-5 w-10 rounded-full" />
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                            {/* Tab Switcher */}
                            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Skeleton className="h-6 w-24 rounded-md" />
                                <Skeleton className="h-6 w-20 rounded-md" />
                            </div>
                        </div>

                        {/* Action Button */}
                        <Skeleton className="h-8 w-32 rounded-lg shrink-0 self-end sm:self-auto" />
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
                        {/* Search + Category Dropdown + Stock Dropdown */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-2xl">
                            <Skeleton className="h-8 flex-1 min-w-[180px] rounded-lg" />
                            <Skeleton className="h-8 w-36 sm:w-44 rounded-lg shrink-0" />
                            <Skeleton className="h-8 w-36 sm:w-40 rounded-lg shrink-0" />
                        </div>

                        {/* View toggle and status filter */}
                        <div className="flex flex-row items-center gap-2 self-start sm:self-auto shrink-0">
                            {/* View Toggle (Grid / List) */}
                            <div className="inline-flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
                                <Skeleton className="w-7 h-7 rounded-md" />
                                <Skeleton className="w-7 h-7 rounded-md" />
                            </div>

                            <Skeleton className="h-8 w-28 rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Body Content (Grid or Table) */}
                {activeContent}
            </div>
        </SkeletonWrapper>
    );
}
