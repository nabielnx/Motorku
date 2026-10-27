import { memo } from 'react';
import clsx from 'clsx';
import { FiStar } from 'react-icons/fi';
import { ProductPhoto } from './Storefront';

const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default memo(function CustomerProductCard({ item, isGrid = false, onOpen, onIntent }) {
    const outOfStock = item.stock <= 0;

    return (
        <article key={item.id} role="button" tabIndex={0} aria-label={'Lihat detail ' + item.name}
            onPointerEnter={onIntent} onFocus={onIntent}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(item); } }}
            onClick={() => onOpen(item)}
            className={clsx(
                "store-product-card group flex flex-col justify-between rounded-xl sm:rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden cursor-pointer active:scale-[0.99]",
                isGrid
                    ? "w-full h-full"
                    : "w-[calc((100%-20px)/3.25)] sm:w-[calc((100%-24px)/3.35)] md:w-[155px] shrink-0 snap-start"
            )}>
            <div>
                <div className="relative block w-full overflow-hidden text-left bg-slate-50">
                    <ProductPhoto src={item.thumbnail || item.image} fallbackSrc={item.image} name={item.name} category={item.category} compact className="aspect-square w-full transition-transform group-hover:scale-102" />
                    {outOfStock && (
                        <div className="absolute left-2 top-2">
                            <span className="rounded bg-[#19231f] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                Habis
                            </span>
                        </div>
                    )}
                </div>
                <div className="store-product-info">
                    <h3 className="store-product-name">
                        {item.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1">
                        <span className="rounded-[3px] bg-red-600 text-white px-1 py-[1.5px] text-[8px] sm:text-[8.5px] font-black tracking-tight leading-none">25%</span>
                        <span className="text-[8.5px] sm:text-[9.5px] font-medium text-slate-400 line-through tabular-nums">{formatRp(Math.round(item.price * 1.33))}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-[13px] font-extrabold tracking-tight text-slate-900 tabular-nums">
                            {formatRp(item.price)}
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
});
