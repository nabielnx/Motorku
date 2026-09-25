import clsx from 'clsx';

/**
 * Reusable loading skeleton component.
 *
 * @param {'rect'|'circle'|'text'} variant - Shape variant
 * @param {number} count - Number of skeleton rows to render (for text-like content)
 * @param {string} className - Additional Tailwind classes (h-*, w-*, rounded-*, etc.)
 */
export default function Skeleton({ variant = 'rect', count = 1, className = '' }) {
    const base = 'animate-pulse bg-slate-200 dark:bg-slate-700';

    const variantClass = {
        rect: 'rounded-md',
        circle: 'rounded-full',
        text: 'rounded h-3.5',
    };

    if (count > 1) {
        return (
            <div className="space-y-2.5">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={clsx(base, variantClass[variant], className)}
                        style={variant === 'text' && i === count - 1 ? { width: '60%' } : undefined}
                    />
                ))}
            </div>
        );
    }

    return <div className={clsx(base, variantClass[variant], className)} />;
}

/**
 * Skeleton wrapper that renders skeleton content with a fade-out transition.
 * Wrap your skeleton preset with this for consistent layout.
 */
export function SkeletonWrapper({ children, className = '' }) {
    return (
        <div className={clsx('animate-in fade-in duration-300', className)} aria-busy="true" aria-label="Memuat konten...">
            {children}
        </div>
    );
}
