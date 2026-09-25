import React from 'react';
import Skeleton, { SkeletonWrapper } from '@/Components/Skeleton';
import clsx from 'clsx';

/**
 * Motorcycle Card Skeleton matching 1:1 with the 3-column grid in /motor-saya.
 */
function MotorcycleCardSkeleton() {
    return (
        <div className="bg-white border border-slate-200/90 rounded-2xl text-left flex flex-col justify-between shadow-2xs overflow-hidden">
            <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between w-full">
                {/* Centered Square Motor Image Container */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    <Skeleton className="w-full h-full !rounded-none" />
                </div>
                {/* Motor Info */}
                <div className="pt-2 w-full space-y-1.5">
                    {/* Brand Name */}
                    <Skeleton className="h-2 w-10 rounded" />
                    {/* Model Name */}
                    <Skeleton className="h-3 sm:h-3.5 w-4/5 rounded" />
                    {/* Engine CC · Type · Year Specs */}
                    <Skeleton className="h-2 sm:h-2.5 w-3/5 rounded" />
                </div>
            </div>
            {/* Bottom "Lihat sparepart >" bar placeholder */}
            <div className="px-2 pb-2">
                <Skeleton className="h-5 sm:h-6 w-full rounded-lg" />
            </div>
        </div>
    );
}

/**
 * Compatible Part Horizontal List Card Skeleton matching 1:1 with /motor-saya/{slug}.
 * Card dimension: h-[82px] sm:h-[88px] flex items-stretch.
 */
export function CompatiblePartCardSkeleton() {
    return (
        <div className="flex items-stretch bg-white border border-slate-200/90 rounded-2xl shadow-2xs h-[82px] sm:h-[88px] overflow-hidden">
            {/* Left Square Product Photo */}
            <div className="w-[82px] sm:w-[88px] h-full bg-slate-100 flex items-center justify-center shrink-0">
                <Skeleton className="w-full h-full !rounded-none" />
            </div>

            {/* Middle Product Details */}
            <div className="flex-1 p-2 sm:p-2.5 min-w-0 flex flex-col justify-between">
                <div>
                    {/* Part Name */}
                    <Skeleton className="h-3 sm:h-3.5 w-4/5 rounded" />
                    {/* 100% Cocok Badge */}
                    <div className="mt-1">
                        <Skeleton className="h-3 w-16 rounded" />
                    </div>
                </div>
                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-0.5">
                    <Skeleton className="h-3.5 sm:h-4 w-20 rounded" />
                </div>
            </div>

            {/* Right Action Button Placeholder (matching vertical strip) */}
            <div className="h-full w-9 sm:w-10 shrink-0 border-l border-slate-200/80 bg-slate-50 flex items-center justify-center">
                <Skeleton variant="circle" className="w-4 h-4" />
            </div>
        </div>
    );
}

/**
 * Compatible Parts Catalog Content Skeleton (grouped by categories).
 */
export function CompatiblePartsListSkeleton({ groupCount = 2, itemsPerGroup = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: groupCount }).map((_, gIdx) => (
                <div key={gIdx} className="space-y-2">
                    {/* Category Title */}
                    <div className="px-0.5">
                        <Skeleton className="h-3.5 sm:h-4 w-32 rounded" />
                    </div>
                    {/* Group Items */}
                    <div className="space-y-2">
                        {Array.from({ length: itemsPerGroup }).map((_, iIdx) => (
                            <CompatiblePartCardSkeleton key={iIdx} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Full page skeleton for "Motor Saya" (Motorcycle Selection View) — /motor-saya.
 */
export function MotorcycleSelectionSkeleton() {
    return (
        <SkeletonWrapper className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex justify-center">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                {/* STICKY TOP CONTAINER */}
                <div className="sticky top-0 z-30 bg-white shadow-2xs">
                    {/* Header */}
                    <header className="relative bg-white border-b border-slate-200/80 shadow-2xs overflow-hidden">
                        <div className="flex items-center justify-between min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-5 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
                                <div className="space-y-1">
                                    <Skeleton className="h-3.5 sm:h-4 w-20 rounded" />
                                    <Skeleton className="h-2.5 w-28 rounded" />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                                <Skeleton variant="circle" className="w-8 h-8 sm:w-9 sm:h-9" />
                                <Skeleton variant="circle" className="w-8 h-8 sm:w-9 sm:h-9" />
                            </div>
                        </div>
                    </header>

                    {/* Compact Search & Filter Toolbar */}
                    <div className="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2 shadow-2xs">
                        {/* Search Bar */}
                        <div className="h-8.5 w-full rounded-full bg-slate-100 border border-slate-200/80 flex items-center px-3.5 gap-2">
                            <Skeleton variant="circle" className="w-3.5 h-3.5 shrink-0" />
                            <Skeleton className="h-3 w-40 rounded" />
                        </div>

                        {/* Filter Toolbar: Brand & Type Pills */}
                        <div className="flex items-stretch gap-2.5 sm:gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5 pr-2.5 sm:pr-3 border-r border-slate-200">
                                {/* Brand Pills (Semua, Honda, Kawasaki, Suzuki, Yamaha) */}
                                <div className="flex w-full gap-1 items-center">
                                    <Skeleton className="h-6 sm:h-7 flex-1 rounded-lg" />
                                    <Skeleton className="h-6 sm:h-7 flex-1 rounded-lg" />
                                    <Skeleton className="h-6 sm:h-7 flex-1 rounded-lg" />
                                    <Skeleton className="h-6 sm:h-7 flex-1 rounded-lg" />
                                    <Skeleton className="h-6 sm:h-7 flex-1 rounded-lg" />
                                </div>
                                {/* Type Pills (Semua, Matic, Bebek, Sport) */}
                                <div className="flex w-full gap-1 items-center">
                                    <Skeleton className="h-5 sm:h-6 flex-1 rounded-full" />
                                    <Skeleton className="h-5 sm:h-6 flex-1 rounded-full" />
                                    <Skeleton className="h-5 sm:h-6 flex-1 rounded-full" />
                                    <Skeleton className="h-5 sm:h-6 flex-1 rounded-full" />
                                </div>
                            </div>
                            <div className="w-12 sm:w-16 shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Content Area: 3-column Motorcycle Grid */}
                <div className="flex-1 p-3 sm:p-4 space-y-4">
                    <div className="space-y-3 pt-1">
                        <div className="px-0.5">
                            <Skeleton className="h-4 w-28 rounded" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <MotorcycleCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SkeletonWrapper>
    );
}

/**
 * Full page skeleton for "Sparepart Sesuai Motor Saya" — /motor-saya/{slug}.
 */
export function CompatiblePartsPageSkeleton() {
    return (
        <SkeletonWrapper className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex justify-center">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white min-h-screen shadow-xl flex flex-col pb-24">
                {/* STICKY TOP CONTAINER */}
                <div className="sticky top-0 z-30 bg-white shadow-2xs">
                    {/* Header: Selected Motor Info */}
                    <header className="relative bg-white border-b border-slate-200/80 shadow-2xs overflow-hidden">
                        <div className="flex items-center justify-between min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-5 gap-3">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                <Skeleton variant="circle" className="w-6 h-6 shrink-0" />
                                <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
                                <div className="space-y-1 min-w-0">
                                    <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-36 rounded" />
                                    <Skeleton className="h-2.5 w-24 sm:w-32 rounded" />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                                <Skeleton variant="circle" className="w-8 h-8 sm:w-9 sm:h-9" />
                                <Skeleton variant="circle" className="w-8 h-8 sm:w-9 sm:h-9" />
                            </div>
                        </div>
                    </header>

                    {/* Toolbar Cari Part & Kategori */}
                    <div className="p-2.5 sm:p-3 bg-white border-b border-slate-100 space-y-2 shadow-2xs">
                        {/* Search Part */}
                        <div className="h-8.5 w-full rounded-full bg-slate-100 border border-slate-200/80 flex items-center px-3.5 gap-2">
                            <Skeleton variant="circle" className="w-3.5 h-3.5 shrink-0" />
                            <Skeleton className="h-3 w-48 rounded" />
                        </div>

                        {/* Category Horizontal Filter Pills */}
                        <div className="flex gap-1.5 overflow-x-hidden pb-0.5 items-center">
                            <Skeleton className="h-7 sm:h-8 w-24 rounded-full shrink-0" />
                            <Skeleton className="h-7 sm:h-8 w-28 rounded-full shrink-0" />
                            <Skeleton className="h-7 sm:h-8 w-20 rounded-full shrink-0" />
                            <Skeleton className="h-7 sm:h-8 w-26 rounded-full shrink-0" />
                            <Skeleton className="h-7 sm:h-8 w-24 rounded-full shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-3 sm:p-4 space-y-4">
                    <CompatiblePartsListSkeleton groupCount={2} itemsPerGroup={3} />
                </div>
            </div>
        </SkeletonWrapper>
    );
}

/**
 * Main default export: dynamically switches between motorcycle selector and compatible parts skeleton.
 *
 * @param {'motorcycle'|'parts'} mode
 */
export default function MotorSayaSkeleton({ mode = 'motorcycle' }) {
    if (mode === 'parts') {
        return <CompatiblePartsPageSkeleton />;
    }
    return <MotorcycleSelectionSkeleton />;
}
