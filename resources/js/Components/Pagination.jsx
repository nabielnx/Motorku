import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    disabled = false,
    previousDisabled = false,
    nextDisabled = false,
    label = 'Navigasi halaman',
}) {
    const pageCount = Math.max(1, totalPages);

    return (
        <nav className="app-pagination" aria-label={label}>
            <button
                className="app-pagination-arrow"
                type="button"
                aria-label="Halaman sebelumnya"
                title="Halaman sebelumnya"
                disabled={disabled || previousDisabled || currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <FiChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className="app-pagination-count" aria-live="polite" aria-atomic="true">
                <span className="sr-only">Halaman </span>{currentPage} / {pageCount}
            </span>
            <button
                className="app-pagination-arrow"
                type="button"
                aria-label="Halaman selanjutnya"
                title="Halaman selanjutnya"
                disabled={disabled || nextDisabled || currentPage >= pageCount}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <FiChevronRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>
        </nav>
    );
}

export function PaginationSkeleton() {
    return (
        <div className="app-pagination" aria-hidden="true">
            <span className="app-pagination-arrow" />
            <span className="app-pagination-count inline-flex items-center justify-center"><span className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700" /></span>
            <span className="app-pagination-arrow" />
        </div>
    );
}
