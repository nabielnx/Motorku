import { memo, useEffect, useRef, useState } from 'react';

// All results remain reachable by scrolling; only the first screen is mounted eagerly.
export default memo(function ProgressiveProducts({ items, renderCard, grid = false }) {
    const batch = grid ? 24 : 8;
    const [limit, setLimit] = useState(batch);
    const trackRef = useRef(null);
    const sentinelRef = useRef(null);

    useEffect(() => setLimit(batch), [items, batch]);
    useEffect(() => {
        if (limit >= items.length) return;
        if (!window.IntersectionObserver) {
            setLimit(items.length);
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) setLimit(current => Math.min(current + batch, items.length));
        }, { root: grid ? null : trackRef.current, rootMargin: grid ? '600px 0px' : '0px 320px' });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [items, limit, batch, grid]);

    return (
        <div ref={trackRef} className={grid
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 pb-4'
            : 'flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar'}>
            {items.slice(0, limit).map(item => renderCard(item, grid))}
            {limit < items.length && <div ref={sentinelRef} aria-hidden="true" className={grid ? 'col-span-full h-px' : 'w-px shrink-0'} />}
        </div>
    );
});
