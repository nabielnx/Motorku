import React, { useRef, useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { ProductPhoto } from './Storefront';

/**
 * MotoQuickPromoSection
 *
 * Layout: Full-width dark navy background.
 * - Banner image sits on the LEFT, BEHIND product cards (absolute, z-1).
 * - Product cards use responsive sizing matching regular catalog cards.
 * - Initial spacer pushes products to the RIGHT so the banner is visible.
 * - As user scrolls left, products slide OVER the banner, and banner recedes with 3D depth.
 */

export default function MotoQuickPromoSection({
    products = [],
    bannerUrl = null,
    onProductClick,
    bestSellerProductIds = [],
    formatRp,
    renderProductCard,
}) {
    const scrollContainerRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Mouse drag support for desktop
    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftStartRef = useRef(0);
    const hasDraggedRef = useRef(false);

    // Reset scroll to 0 on mount so spacer/banner is visible initially
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

    // Take top 8 promo items
    const promoItems = products.slice(0, 8);
    if (!promoItems.length) return null;

    const handleScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
        const progress = Math.min(Math.max(scrollLeft / 160, 0), 1);
        setScrollProgress(progress);
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

    // 3D receding values driven by scroll progress
    const bannerScale = 1 - scrollProgress * 0.1;
    const bannerTranslateZ = -scrollProgress * 50;
    const bannerBrightness = 1 - scrollProgress * 0.15;
    const bannerOpacity = 1 - scrollProgress * 0.2;

    return (
        <div className="relative mb-5 rounded-2xl sm:rounded-3xl overflow-hidden select-none"
             style={{ perspective: '1000px' }}>
            {/* ══ FULL-WIDTH HEADER BLUE BACKGROUND ══ */}
            <div className="absolute inset-0 bg-[#4066AD] z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-[#4A72BC] via-[#4066AD] to-[#365799]" />
                <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
                <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-blue-900/30 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>

            {/* ══ BANNER IMAGE — spans left 55%, behind product cards ══ */}
            <div
                className="absolute left-0 top-0 bottom-0 z-[1] w-[55%] sm:w-[45%] will-change-transform overflow-hidden"
                style={{
                    transform: `scale(${bannerScale}) translateZ(${bannerTranslateZ}px)`,
                    opacity: bannerOpacity,
                    filter: `brightness(${bannerBrightness})`,
                    transformOrigin: 'center left',
                    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, filter 0.35s ease',
                    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
                    maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
                }}
            >
                {bannerUrl ? (
                    <>
                        <img
                            src={bannerUrl}
                            alt="Banner Promo"
                            className="h-full w-full object-cover"
                            loading="lazy"
                            draggable="false"
                        />
                        {/* Subtle edge gradient feathering just at the cut line */}
                        <div className="absolute inset-y-0 right-0 w-6 sm:w-8 bg-gradient-to-r from-transparent to-[#4066AD] pointer-events-none" />
                    </>
                ) : (
                    <div className="h-full w-full" />
                )}
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

            {/* ══ HORIZONTAL SCROLL TRACK ══
                 Products match regular catalog sizing (w-[calc((100%-20px)/3.25)]).
                 As user scrolls, products slide over the banner area. */}
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
                {/* Spacer pushes products to ~center of viewport — snap-start prevents snap-mandatory from skipping it */}
                <div className="shrink-0 w-[45%] sm:w-[35%] snap-start" aria-hidden="true" />

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
    );
}
