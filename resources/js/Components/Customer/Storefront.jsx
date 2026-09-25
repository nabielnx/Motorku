import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FiBox, FiTool, FiShoppingBag, FiShoppingCart, FiSearch, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { getProductImage } from '@/Utils/productImage';
import { RiMotorbikeFill } from 'react-icons/ri';
import '../../../css/customer-storefront.css';

export function MotorIcon({ size = 22, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 596 485"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M 484 289 L 461 295 L 447 302 L 433 312 L 420 326 L 413 336 L 403 359 L 400 374 L 400 399 L 403 413 L 411 433 L 422 449 L 435 462 L 450 472 L 469 480 L 491 484 L 512 483 L 534 477 L 551 468 L 566 456 L 579 440 L 588 423 L 593 406 L 595 392 L 594 371 L 589 352 L 580 334 L 573 324 L 560 311 L 552 305 L 533 295 L 516 290 Z M 490 321 L 504 321 L 514 323 L 525 327 L 535 333 L 546 343 L 554 354 L 558 362 L 562 377 L 561 401 L 558 410 L 548 427 L 531 442 L 521 447 L 506 451 L 488 451 L 479 449 L 459 439 L 448 429 L 439 416 L 434 403 L 432 393 L 432 379 L 434 369 L 445 347 L 462 331 L 474 325 Z M 91 288 L 66 292 L 47 300 L 32 310 L 15 328 L 8 339 L 0 358 L 0 414 L 3 423 L 15 444 L 36 465 L 47 472 L 66 480 L 80 483 L 98 484 L 118 481 L 135 475 L 157 461 L 169 449 L 178 436 L 188 413 L 191 399 L 191 373 L 185 350 L 178 336 L 168 322 L 157 311 L 144 302 L 130 295 L 113 290 Z M 86 321 L 108 322 L 122 327 L 132 333 L 141 341 L 149 351 L 155 363 L 159 379 L 159 393 L 157 403 L 152 416 L 147 424 L 138 434 L 126 443 L 112 449 L 102 451 L 85 451 L 76 449 L 62 443 L 53 437 L 38 420 L 33 410 L 29 395 L 30 372 L 33 362 L 40 349 L 57 332 L 73 324 Z M 80 207 L 73 220 L 71 229 L 71 242 L 75 259 L 83 277 L 99 277 L 121 281 L 138 287 L 157 298 L 177 317 L 188 333 L 198 354 L 205 376 L 208 391 L 215 398 L 230 407 L 252 414 L 275 418 L 304 420 L 392 421 L 389 391 L 391 362 L 399 335 L 412 314 L 431 297 L 450 287 L 465 282 L 484 278 L 505 276 L 535 276 L 542 263 L 542 251 L 539 244 L 535 240 L 439 239 L 434 226 L 409 191 L 346 240 L 252 240 L 243 243 L 238 248 L 232 262 L 212 253 L 203 247 L 191 236 L 181 221 L 278 146 L 340 232 L 404 185 L 346 108 L 334 96 L 326 92 L 310 88 L 298 89 L 284 94 L 172 179 L 170 170 L 170 162 L 168 162 L 107 186 L 91 196 Z M 334 19 L 324 9 L 317 5 L 307 2 L 292 0 L 282 1 L 266 6 L 253 14 L 244 24 L 239 34 L 237 45 L 243 45 L 274 39 L 274 68 L 237 73 L 237 105 L 257 103 L 279 87 L 298 80 L 321 81 L 337 88 L 345 72 L 347 62 L 347 51 L 342 33 Z"
            />
        </svg>
    );
}

export function ProductPhoto({ src, name, className = '', compact = false }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);

    return (
        <div className={clsx('relative flex items-center justify-center overflow-hidden bg-slate-50/80 shrink-0', className)}>
            {src && !failed ? (
                <img src={src} alt={name} loading="lazy" decoding="async"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover shrink-0 select-none pointer-events-none block" />
            ) : (
                <div className="flex flex-col items-center justify-center gap-1 px-2 text-center text-slate-400 select-none">
                    <FiBox size={compact ? 18 : 24} strokeWidth={1.5} className="text-slate-300" aria-hidden="true" />
                    {!compact && <span className="text-[10px] font-medium tracking-tight text-slate-400">Belum ada foto</span>}
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
                    <span>Pesan online, ambil langsung di toko</span>
                    <span>QRIS atau bayar di kasir</span>
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
