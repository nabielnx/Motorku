import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';

/**
 * Product card shape used by the current grid view.
 */
function ProductGridCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-md md:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden md:shadow-xs flex flex-col relative">
            {/* Image Container with Badges */}
            <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 overflow-hidden">
                <Skeleton className="h-full w-full !rounded-none" />
            </div>

            {/* Card Content */}
            <div className="p-2 md:p-3 flex flex-col flex-1">
                <Skeleton className="hidden md:block h-3 w-24 mb-1.5" />

                {/* Title (2 lines) */}
                <div className="space-y-1 mb-2">
                    <Skeleton className="h-3.5 w-5/6 rounded" />
                    <Skeleton className="h-3.5 w-3/5 rounded" />
                </div>

                <Skeleton className="h-2.5 w-20 mb-2 rounded" />

                {/* Price */}
                <div className="mt-auto pt-1">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-3 w-28 mt-1 rounded" />
                </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 flex items-center justify-between gap-1">
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
 * @param {'grid'|'list'|'book'} viewMode - View mode ('grid' for card grid, 'list' for table, 'book' for catalog book).
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

    // ─── 0. Book Skeleton View (Buku Catatan Kertas Putih) ───
    const bookContent = (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between p-2 sm:p-4 bg-slate-100 dark:bg-slate-800 gap-2 sm:gap-3">
            {/* White Paper Canvas */}
            <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs flex flex-col overflow-hidden">
                {/* Header Catatan Skeleton */}
                <div className="px-3 sm:px-5 py-2 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>

                {/* Content Rows */}
                <div className="flex-1 overflow-hidden">
                    {/* Mobile: 1 Column */}
                    <div className="block md:hidden">
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <Skeleton className="h-3 w-24" />
                            <div className="flex gap-3">
                                <Skeleton className="h-3 w-10" />
                                <Skeleton className="h-3 w-14" />
                            </div>
                        </div>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2 px-2 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 flex-1">
                                    <Skeleton className="h-3 w-5" />
                                    <Skeleton className="h-3.5 w-44 sm:w-56" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-3.5 w-18" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: 2 Columns */}
                    <div className="hidden md:flex min-h-full divide-x divide-slate-300 dark:divide-slate-700">
                        {/* Left Column */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <Skeleton className="h-3 w-24" />
                                <div className="flex gap-3 pr-2 lg:pr-14">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-2 px-3 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Skeleton className="h-3 w-5" />
                                        <Skeleton className="h-3.5 w-48" />
                                    </div>
                                    <div className="flex items-center gap-3 pr-2 lg:pr-14">
                                        <Skeleton className="h-3 w-12" />
                                        <Skeleton className="h-3.5 w-18" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <Skeleton className="h-3 w-24" />
                                <div className="flex gap-3 pr-2 lg:pr-14">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-2 px-3 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Skeleton className="h-3 w-5" />
                                        <Skeleton className="h-3.5 w-48" />
                                    </div>
                                    <div className="flex items-center gap-3 pr-2 lg:pr-14">
                                        <Skeleton className="h-3 w-12" />
                                        <Skeleton className="h-3.5 w-18" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Skeleton */}
                <div className="px-3 sm:px-5 py-2 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between shrink-0">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-28 hidden sm:block" />
                </div>
            </div>

            {/* Navigation Pager Skeleton */}
            <div className="shrink-0 flex items-center justify-center gap-3 sm:gap-6 py-1">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
        </div>
    );

    // ─── 1. Grid Skeleton View (Kotak-kotak) ───
    const gridContent = (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 min-[1700px]:grid-cols-5 md:gap-4 md:p-4">
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
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {Array.from({ length: rows }).map((_, i) => <div key={i} className="px-3 py-2"><div className="flex gap-2.5"><Skeleton className="h-11 w-11 shrink-0 rounded-md" /><div className="min-w-0 flex-1 space-y-1"><div className="flex items-center justify-between gap-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-4" /></div><div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-14" /></div></div></div></div>)}
            </div>
            <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
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

    const activeContent = activeView === 'book' ? bookContent : (activeView === 'grid' ? gridContent : tableContent);

    if (!fullPage) {
        return <SkeletonWrapper>{activeContent}</SkeletonWrapper>;
    }

    return (
        <SkeletonWrapper className="p-0 sm:p-4 lg:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="bg-white dark:bg-slate-900 sm:rounded-xl sm:border border-slate-200 dark:border-slate-800 sm:shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Header & Filter Section */}
                <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                    {/* Top Row: Title, Badge, Tabs & Action */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none sm:gap-2">
                            <Skeleton className="h-5 w-16 rounded-md sm:h-6 sm:w-32" />
                            <Skeleton className="h-3 w-6" />
                        </div>
                            <div className="order-3 flex w-full gap-1.5 sm:order-none sm:w-auto">
                                <Skeleton className="h-7 flex-1 rounded-md sm:flex-none sm:w-24" />
                                <Skeleton className="h-7 flex-1 rounded-md sm:flex-none sm:w-20" />
                            </div>
                        <div className="ml-auto flex shrink-0 gap-1.5 sm:gap-2">
                            <Skeleton className="h-9 w-9 rounded-lg sm:w-16" />
                            <Skeleton className="h-9 w-9 rounded-lg sm:w-16" />
                            <Skeleton className="h-9 w-20 rounded-lg" />
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-row sm:flex-wrap items-center justify-between gap-1.5 sm:gap-2.5">
                        {/* Search + Category Dropdown + Stock Dropdown */}
                        <div className="flex min-w-0 flex-wrap items-center gap-2 flex-1 max-w-2xl">
                            <Skeleton className="h-9 flex-1 min-w-[140px] rounded-lg sm:h-10 sm:min-w-[180px]" />
                            <Skeleton className="hidden h-10 w-44 rounded-lg shrink-0 sm:block" />
                            <Skeleton className="hidden h-10 w-40 rounded-lg shrink-0 sm:block" />
                        </div>

                        {/* View toggle and status filter */}
                        <div className="flex flex-row items-center gap-1 shrink-0">
                            <Skeleton className="h-7 w-12 sm:hidden" />
                            {/* View Toggle (Grid / List / Book) */}
                            <div className="inline-flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
                                <Skeleton className="w-7 h-7 rounded-md" />
                                <Skeleton className="w-7 h-7 rounded-md" />
                                <Skeleton className="w-7 h-7 rounded-md" />
                            </div>

                            <Skeleton className="hidden h-8 w-28 rounded-lg sm:block" />
                        </div>
                    </div>
                </div>

                {/* Body Content (Grid or Table) */}
                {activeContent}
            </div>
        </SkeletonWrapper>
    );
}
