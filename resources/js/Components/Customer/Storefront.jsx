import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FiTool, FiShoppingBag, FiShoppingCart, FiSearch, FiX, FiDisc, FiDroplet, FiZap, FiShield, FiLayers, FiSun, FiSliders, FiCpu } from 'react-icons/fi';
import clsx from 'clsx';
import { getProductImage } from '@/Utils/productImage';
import { RiMotorbikeFill } from 'react-icons/ri';
import '../../../css/customer-storefront.css';

export { default as MotorIcon } from '@/Components/MotorIcon';

function categoryVisual(category = '') {
    const name = String(category).toLowerCase();
    if (['oli', 'cairan', 'coolant'].some(word => name.includes(word))) return { Icon: FiDroplet, label: 'Oli' };
    if (['ban', 'roda', 'velg', 'shock'].some(word => name.includes(word))) return { Icon: FiDisc, label: 'Ban & roda' };
    if (['rem', 'piringan'].some(word => name.includes(word))) return { Icon: FiShield, label: 'Rem' };
    if (['cvt', 'belt', 'roller', 'gear', 'rantai'].some(word => name.includes(word))) return { Icon: FiLayers, label: 'CVT' };
    if (['aki', 'busi', 'kiprok', 'ecu', 'starter'].some(word => name.includes(word))) return { Icon: FiZap, label: 'Kelistrikan' };
    if (['lampu', 'saklar'].some(word => name.includes(word))) return { Icon: FiSun, label: 'Lampu' };
    if (['filter', 'injektor', 'piston', 'mesin'].some(word => name.includes(word))) return { Icon: FiCpu, label: 'Mesin' };
    if (['spion', 'handle', 'kabel'].some(word => name.includes(word))) return { Icon: FiSliders, label: 'Aksesori' };
    return { Icon: FiTool, label: 'Sparepart' };
}

export function ProductCategoryIcon({ category, size = 14, className = '' }) {
    const { Icon } = categoryVisual(category);
    return <Icon size={size} className={className} aria-hidden="true" />;
}

export function ProductPhoto({ src, name, category, className = '', compact = false }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);
    const { Icon, label } = categoryVisual(category || name);

    return (
        <div className={clsx('relative flex items-center justify-center overflow-hidden bg-slate-50/80 shrink-0', className)}>
            {src && !failed ? (
                <img src={src} alt={name} loading="lazy" decoding="async"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover shrink-0 select-none pointer-events-none block" />
            ) : (
                <div role="img" aria-label={`Foto ${name || label} belum tersedia`} className={clsx('flex flex-col items-center justify-center text-center select-none min-w-0', compact ? 'p-1' : 'gap-1 px-1.5')}>
                    <Icon size={compact ? 20 : 32} strokeWidth={1.5} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {!compact && <>
                        <span className="max-w-full truncate text-[10px] font-semibold text-slate-500">{label}</span>
                        <span className="text-[10px] text-slate-400">Foto belum ada</span>
                    </>}
                </div>
            )}
        </div>
    );
}

export function StoreHeader({
    settings = {},
    activePage = 'catalog',
    totalQty = 0,
    onCart,
    orderHref = '/order/status',
    hasAnyOrders = false,
    searchQuery = '',
    setSearchQuery,
    searchInputRef,
}) {
    const { props } = usePage();
    const storeName = settings['store.name'] || settings['name'] || props?.app_settings?.store_name || 'Motorku';
    const rawLogo = settings['store.logo'] || settings['logo'] || props?.logo_url;
    const [logoFailed, setLogoFailed] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const phone = settings['store.phone'] || settings['phone'] || props?.app_settings?.store_phone || '';
    const whatsapp = phone ? 'https://wa.me/' + phone.replace(/[^0-9]/g, '').replace(/^0/, '62') : null;

    return (
        <>
            <div className="hidden bg-slate-900 text-slate-300 sm:block">
                <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-1.5 text-[11px] lg:px-8 font-medium">
                    <span>{settings['store.tagline'] ?? props?.app_settings?.store_tagline ?? 'Pesan online, ambil langsung di toko'}</span>
                    <span>Pesan online, bayar di kasir</span>
                </div>
            </div>

            <header className="sticky top-0 z-30 border-b-[3px] border-[#FFDD00] bg-white shadow-2xs overflow-hidden relative">
                {/* Background: User's custom white-to-blue curved wave */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                    {/* Desktop SVG curve: exact match of user drawing */}
                    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="hidden md:block w-full h-full">
                        <path d="M 330 0 C 300 30, 255 70, 200 100 L 1000 100 L 1000 0 Z" fill="#4066AD" />
                    </svg>
                    {/* Mobile SVG curve: shifted to the left so it sits cleanly between logo and search */}
                    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="block md:hidden w-full h-full">
                        <path d="M 420 0 C 390 30, 330 70, 280 100 L 1000 100 L 1000 0 Z" fill="#4066AD" />
                    </svg>
                </div>

                <div className="mx-auto flex min-h-[54px] max-w-[1280px] items-center justify-between gap-2 px-3.5 sm:min-h-[62px] sm:gap-4 sm:px-6 lg:px-8 relative z-10">
                    <Link href="/" aria-label={storeName + ' — beranda'} className="flex shrink-0 items-center gap-2.5">
                        {rawLogo && !logoFailed ? (
                            <img
                                src={getProductImage(rawLogo)}
                                alt={storeName}
                                onError={() => setLogoFailed(true)}
                                className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 object-contain rounded-lg bg-white p-0.5"
                            />
                        ) : (
                            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFDD00] text-[#003882] font-bold shadow-xs">
                                <FiTool size={16} strokeWidth={2.2} aria-hidden="true" />
                            </span>
                        )}
                        <span className="whitespace-nowrap text-base sm:text-lg font-extrabold tracking-tight text-slate-900">{storeName}</span>
                    </Link>
                    <nav aria-label="Navigasi toko" className="hidden items-center gap-6 text-sm md:flex">
                        <Link
                            href="/"
                            aria-current={activePage === 'catalog' ? 'page' : undefined}
                            className={clsx(
                                'py-4 transition-colors font-bold',
                                activePage === 'catalog'
                                    ? 'border-b-2 border-[#FFDD00] text-[#FFDD00] font-black'
                                    : 'text-white/85 hover:text-white'
                            )}
                        >
                            Katalog
                        </Link>
                        <Link
                            href="/motor-saya"
                            aria-current={activePage === 'motor' ? 'page' : undefined}
                            className={clsx(
                                'py-4 transition-colors font-bold',
                                activePage === 'motor'
                                    ? 'border-b-2 border-[#FFDD00] text-[#FFDD00] font-black'
                                    : 'text-white/85 hover:text-white'
                            )}
                        >
                            Motor Saya
                        </Link>
                        {whatsapp && (
                            <a
                                href={whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-4 text-white/85 hover:text-white font-bold transition-colors"
                            >
                                Bantuan
                            </a>
                        )}
                    </nav>
                    <div className="relative flex shrink-0 items-center justify-end w-[196px] max-w-[calc(100vw-145px)] sm:max-w-none sm:w-[232px] md:w-[264px] lg:w-[296px] xl:w-[480px] h-9">
                        {/* Search Input next to Pesanan - anchored left, expands to right */}
                        {setSearchQuery && (
                            <div
                                className={clsx(
                                    "absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center transition-all duration-300 ease-in-out",
                                    isSearchFocused
                                        ? "w-full"
                                        : "w-28 sm:w-36 md:w-44 lg:w-52"
                                )}
                            >
                                <FiSearch size={13} className="pointer-events-none absolute left-2.5 sm:left-3 text-slate-400" />
                                <label htmlFor="header-catalog-search" className="sr-only">Cari sparepart</label>
                                <input
                                    id="header-catalog-search"
                                    ref={searchInputRef}
                                    type="search"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') {
                                            searchInputRef?.current?.blur();
                                        }
                                    }}
                                    placeholder="Cari sparepart…"
                                    aria-label="Cari produk sparepart"
                                    className="h-8 sm:h-8.5 w-full rounded-full bg-white pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs border-0 focus:ring-0 !outline-none transition-all"
                                />
                                {(searchQuery || isSearchFocused) && (
                                    <button
                                        type="button"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => {
                                            if (searchQuery) {
                                                setSearchQuery('');
                                                searchInputRef?.current?.focus();
                                            } else {
                                                searchInputRef?.current?.blur();
                                                setIsSearchFocused(false);
                                            }
                                        }}
                                        className="absolute right-2 flex h-4.5 w-4.5 items-center justify-center text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                                        aria-label="Tutup pencarian"
                                    >
                                        <FiX size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div
                            className={clsx(
                                "flex items-center justify-end gap-1.5 sm:gap-2 transition-all duration-300 ease-in-out w-full",
                                isSearchFocused
                                    ? "opacity-0 pointer-events-none translate-x-3 scale-95"
                                    : "opacity-100 translate-x-0 scale-100"
                            )}
                        >
                            <Link
                                href={orderHref}
                                title="Pesanan saya"
                                className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors shrink-0"
                                aria-label="Pesanan saya"
                            >
                                <FiShoppingBag size={19} strokeWidth={2} aria-hidden="true" />
                                <span className="hidden xl:inline">Pesanan saya</span>
                                {hasAnyOrders && (
                                    <span className="absolute top-1.5 right-1.5 xl:static xl:top-auto xl:right-auto h-2 w-2 rounded-full bg-[#FFDD00]" aria-label="Ada riwayat pesanan" />
                                )}
                            </Link>
                            {onCart ? (
                                <button
                                    type="button"
                                    onClick={onCart}
                                    className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
                                    aria-label={'Buka keranjang, ' + totalQty + ' item'}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <FiShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
                                        {totalQty > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFDD00] px-1 text-[10px] font-extrabold text-[#003882] tabular-nums shadow-xs">
                                                {totalQty}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden xl:inline">Keranjang</span>
                                </button>
                            ) : (
                                <Link
                                    href="/"
                                    title="Keranjang belanja"
                                    className="relative flex h-9 w-9 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:rounded-lg sm:px-2.5 text-white hover:bg-white/15 text-xs sm:text-sm font-bold transition-colors shrink-0"
                                    aria-label={'Buka keranjang, ' + totalQty + ' item'}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <FiShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
                                        {totalQty > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFDD00] px-1 text-[10px] font-extrabold text-[#003882] tabular-nums shadow-xs">
                                                {totalQty}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden xl:inline">Keranjang</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
