import useStorefront from '@/Hooks/useStorefront';
import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FiTool, FiShoppingBag, FiShoppingCart, FiSearch, FiX, FiDisc, FiDroplet, FiZap, FiShield, FiLayers, FiSun, FiSliders, FiCpu, FiUser } from 'react-icons/fi';
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

export function ProductPhoto({ src, name, category, className = '', compact = false, fit = 'cover' }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);
    const { Icon, label } = categoryVisual(category || name);

    return (
        <div className={clsx('product-photo relative flex items-center justify-center overflow-hidden bg-slate-50 shrink-0', className)}>
            {src && !failed ? (
                <img src={src} alt={name} loading="lazy" decoding="async"
                    onError={() => setFailed(true)}
                    className={clsx('h-full w-full shrink-0 select-none pointer-events-none block', fit === 'contain' ? 'object-contain' : 'object-cover')} />
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
    const { storeUrl } = useStorefront();
    const { props } = usePage();
    const storeName = settings['store.name'] || settings['name'] || props?.app_settings?.store_name || 'Motorku';
    const rawLogo = settings['store.logo'] || settings['logo'] || props?.logo_url;
    const [logoFailed, setLogoFailed] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showMotorHint, setShowMotorHint] = useState(true);
    const referencesEnabled = props.app_settings?.references_enabled !== false;
    const accountLabel = props.customer ? 'Akun pelanggan saya' : 'Masuk sebagai pelanggan';

    return (
        <>
            <div className="store-topstrip hidden sm:block">
                <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-1.5 text-[11px] lg:px-8 font-medium">
                    <span>{settings['store.tagline'] ?? props?.app_settings?.store_tagline ?? 'Pesan online, ambil langsung di toko'}</span>
                    <span>Pesan online, bayar di kasir</span>
                </div>
            </div>

            <header className="store-header">

                <div className="store-header-shell">
                    <Link href={storeUrl('/')} aria-label={storeName + ' — beranda'} className="store-brand">
                        {rawLogo && !logoFailed ? (
                            <img
                                src={getProductImage(rawLogo)}
                                alt={storeName}
                                onError={() => setLogoFailed(true)}
                                className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 object-contain rounded-lg bg-white p-0.5"
                            />
                        ) : (
                            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFDD00] text-[#19231f] font-bold shadow-xs">
                                <FiTool size={16} strokeWidth={2.2} aria-hidden="true" />
                            </span>
                        )}
                        <span className="store-brand-name">{storeName}</span>
                    </Link>
                    <nav aria-label="Navigasi toko" className="store-actions">
                        {referencesEnabled && <div className="store-motor-entry" onKeyDown={e => { if (e.key === 'Escape') setShowMotorHint(false); }}>
                            <Link
                                href={storeUrl('/motor-saya')}
                                title="Cari sparepart sesuai motor saya"
                                aria-current={activePage === 'motor' ? 'page' : undefined}
                                aria-describedby={showMotorHint ? 'store-motor-hint-message' : undefined}
                                className="store-action store-motor-action"
                                onMouseEnter={() => setShowMotorHint(true)}
                                onFocus={() => setShowMotorHint(true)}
                                onClick={() => setShowMotorHint(false)}
                            >
                                <RiMotorbikeFill size={20} aria-hidden="true" />
                                <span>Motor Saya</span>
                            </Link>
                            {showMotorHint && (
                                <div id="store-motor-hint" role="status" className="store-motor-hint">
                                    <p id="store-motor-hint-message">Cari sparepart sesuai motor saya</p>
                                    <button type="button" onClick={() => setShowMotorHint(false)} aria-label="Tutup petunjuk Motor Saya">
                                        <FiX size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </div>}
                        {onCart ? (
                            <button
                                type="button"
                                onClick={() => { setShowMotorHint(false); onCart(); }}
                                className="store-action"
                                aria-label={'Buka keranjang, ' + totalQty + ' item'}
                            >
                                <div className="relative flex items-center justify-center">
                                    <FiShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
                                    {totalQty > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFDD00] px-1 text-[10px] font-extrabold text-[#19231f] tabular-nums shadow-xs">
                                            {totalQty}
                                        </span>
                                    )}
                                </div>
                                <span className="store-action-label">Keranjang</span>
                            </button>
                        ) : (
                            <Link
                                href={storeUrl('/?openCart=1')}
                                title="Keranjang belanja"
                                className="store-action"
                                aria-label={'Buka keranjang, ' + totalQty + ' item'}
                            >
                                <div className="relative flex items-center justify-center">
                                    <FiShoppingCart size={19} strokeWidth={2} aria-hidden="true" />
                                    {totalQty > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFDD00] px-1 text-[10px] font-extrabold text-[#19231f] tabular-nums shadow-xs">
                                            {totalQty}
                                        </span>
                                    )}
                                </div>
                                <span className="store-action-label">Keranjang</span>
                            </Link>
                        )}
                        <Link
                            href={storeUrl(orderHref)}
                            title="Pesanan saya"
                            className="store-action"
                            aria-label="Pesanan saya"
                        >
                            <FiShoppingBag size={19} strokeWidth={2} aria-hidden="true" />
                            <span className="store-action-label">Pesanan saya</span>
                            {hasAnyOrders && (
                                <span className="absolute top-1.5 right-1.5 xl:static xl:top-auto xl:right-auto h-2 w-2 rounded-full bg-[#FFDD00]" aria-label="Ada riwayat pesanan" />
                            )}
                        </Link>
                        <Link
                            href={storeUrl(props.customer ? '/customer/account' : '/customer/login')}
                            title={accountLabel}
                            aria-label={accountLabel}
                            className="store-action store-account-action"
                        >
                            <FiUser size={20} strokeWidth={2} aria-hidden="true" />
                        </Link>
                    </nav>
                    <div className="store-tools">
                        {setSearchQuery && (
                            <div
                                className={clsx(
                                    "store-search",
                                    isSearchFocused
                                        ? "store-search-focused"
                                        : ""
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
                                    onFocus={() => { setIsSearchFocused(true); setShowMotorHint(false); }}
                                    onBlur={() => setIsSearchFocused(false)}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') {
                                            searchInputRef?.current?.blur();
                                        }
                                    }}
                                    placeholder="Cari sparepart…"
                                    aria-label="Cari produk sparepart"
                                    className="store-search-input"
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
                                        className="store-search-clear"
                                        aria-label="Tutup pencarian"
                                    >
                                        <FiX size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
