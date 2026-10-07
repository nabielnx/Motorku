import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay, FiStar } from 'react-icons/fi';
import { ProductPhoto } from './Storefront';

// Banner and product cards share one horizontal scroll track.

export default function MotoQuickPromoSection({
    products = [],
    bannerUrls = [],
    onProductClick,
    bestSellerProductIds = [],
    formatRp,
    renderProductCard,
}) {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [bannerHeight, setBannerHeight] = useState(0);
    const promoItems = products.slice(0, 8);
    const [bannerIndex, setBannerIndex] = useState(0);
    const [bannerPaused, setBannerPaused] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const bannerUrl = bannerUrls[bannerIndex] || bannerUrls[0] || null;

    useEffect(() => setBannerIndex(0), [bannerUrls]);
    useEffect(() => {
        if (bannerUrls.length < 2 || bannerPaused) return;
        const timer = setInterval(() => {
            if (!document.hidden) setBannerIndex(index => (index + 1) % bannerUrls.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [bannerUrls, bannerIndex, bannerPaused]);

    useLayoutEffect(() => {
        const track = scrollContainerRef.current;
        if (!track || !bannerUrl) return;
        const updateSize = () => setBannerHeight(track.getBoundingClientRect().height);
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(track);
        return () => observer.disconnect();
    }, [promoItems.length, Boolean(bannerUrl)]);

    // Mouse drag support for desktop
    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftStartRef = useRef(0);
    const hasDraggedRef = useRef(false);

    // Start with the banner visible.
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.style.scrollBehavior = 'auto';
            el.scrollLeft = 0;
            requestAnimationFrame(() => {
                el.style.scrollBehavior = '';
            });
        }
    }, []);

    if (!promoItems.length) return null;

    const handleScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scrollByAmount = (direction) => {
        if (!scrollContainerRef.current) return;
        const offset = direction === 'left' ? -240 : 240;
        scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        isDownRef.current = true;
        hasDraggedRef.current = false;
        startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseLeaveOrUp = () => {
        isDownRef.current = false;
        setTimeout(() => { hasDraggedRef.current = false; }, 50);
    };

    const handleMouseMove = (e) => {
        if (!isDownRef.current || !scrollContainerRef.current) return;
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.3;
        if (Math.abs(walk) > 5) hasDraggedRef.current = true;
        scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    };

    return (
        <div className="mb-5">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden select-none">
                {/* ══ FULL-WIDTH HEADER BLUE BACKGROUND ══ */}
                <div className="absolute inset-0 bg-[#4066AD] z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4A72BC] via-[#4066AD] to-[#365799]" />
                    <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
                    <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-blue-900/30 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                {/* ══ Desktop Navigation Arrows ══ */}
                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={() => scrollByAmount('left')}
                        aria-label="Geser ke kiri"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <FiChevronLeft size={18} />
                    </button>
                )}
                {canScrollRight && (
                    <button
                        type="button"
                        onClick={() => scrollByAmount('right')}
                        aria-label="Geser ke kanan"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <FiChevronRight size={18} />
                    </button>
                )}

                {/* Banner scrolls alongside products without covering them. */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeaveOrUp}
                    onMouseUp={handleMouseLeaveOrUp}
                    onMouseMove={handleMouseMove}
                    onClickCapture={(e) => {
                        if (hasDraggedRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                    className="relative z-10 flex items-stretch gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2.5 sm:py-3 cursor-grab active:cursor-grabbing"
                >
                    {bannerUrl && (
                        <div className="relative shrink-0 snap-start -my-2.5 sm:-my-3 overflow-hidden" style={{ width: bannerHeight * 3 / 5 }}>
                            <img
                                src={bannerUrl}
                                alt={`Banner promo ${bannerIndex + 1} dari ${bannerUrls.length}`}
                                className="absolute inset-0 h-full w-full object-contain"
                                loading="lazy"
                                draggable="false"
                            />
                        </div>
                    )}

                    {promoItems.map(item => {
                        if (renderProductCard) {
                            return (
                                <React.Fragment key={'promo-' + item.id}>
                                    {renderProductCard(item, false)}
                                </React.Fragment>
                            );
                        }

                        const outOfStock = item.stock <= 0;
                        const isBest = bestSellerProductIds.includes(item.id);

                        return (
                            <article
                                key={'promo-' + item.id}
                                onClick={() => {
                                    if (hasDraggedRef.current) return;
                                    onProductClick && onProductClick(item);
                                }}
                                className="group flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden cursor-pointer active:scale-[0.99] w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 snap-start"
                            >
                                <div>
                                    <div className="relative block w-full overflow-hidden text-left bg-slate-50/80">
                                        <ProductPhoto
                                            src={item.image}
                                            name={item.name}
                                            category={item.category}
                                            compact
                                            className="aspect-square w-full transition-transform group-hover:scale-102"
                                        />
                                        {outOfStock && (
                                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="rounded bg-slate-800/85 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                                    Habis
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-1.5 sm:p-2">
                                        <h3 className="text-[10px] sm:text-[11px] font-bold leading-tight text-slate-900 transition-colors line-clamp-2">
                                            {item.name}
                                        </h3>
                                        <div className="mt-0.5 flex items-center gap-1">
                                            <span className="rounded-[3px] bg-red-600 text-white px-1 py-[1.5px] text-[8px] sm:text-[8.5px] font-black tracking-tight leading-none">
                                                25%
                                            </span>
                                            <span className="text-[8.5px] sm:text-[9.5px] font-medium text-slate-400 line-through tabular-nums">
                                                {formatRp ? formatRp(Math.round(item.price * 1.33)) : ''}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between gap-1">
                                            <p className="text-xs sm:text-[13px] font-extrabold tracking-tight text-slate-900 tabular-nums">
                                                {formatRp ? formatRp(item.price) : ''}
                                            </p>
                                            {item.is_recommended && (
                                                <span title="Rekomendasi" className="inline-flex items-center shrink-0">
                                                    <FiStar size={12} className="fill-[#FFDD00] text-[#FFDD00]" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {/* Trailing space so last card has breathing room when scrolled to end */}
                    <div className="shrink-0 w-3" aria-hidden="true" />
                </div>
            </div>
            {bannerUrls.length > 1 && (
                <div role="group" aria-label="Kontrol banner promo" className="mt-0.5 flex items-center justify-center">
                    {bannerUrls.map((url, index) => (
                        <button key={index} type="button" onClick={() => setBannerIndex(index)} aria-label={`Tampilkan banner promo ${index + 1}`} aria-pressed={bannerIndex === index}
                            className="flex h-5 w-4 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4066AD]">
                            <span className={`h-1 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.6)] transition-all ${bannerIndex === index ? 'w-2 bg-[#FFDD00]' : 'w-1 bg-slate-400'}`} />
                        </button>
                    ))}
                    <button type="button" onClick={() => setBannerPaused(value => !value)} aria-label={bannerPaused ? 'Putar banner promo otomatis' : 'Jeda banner promo otomatis'}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 drop-shadow-[0_0_2px_rgba(0,0,0,0.6)] hover:text-[#4066AD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4066AD]">
                        {bannerPaused ? <FiPlay size={10} aria-hidden="true" /> : <FiPause size={10} aria-hidden="true" />}
                    </button>
                </div>
            )}
        </div>
    );
}
