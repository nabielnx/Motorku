import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiChevronDown, FiCheck } from 'react-icons/fi';

const DEFAULT_PERIOD_OPTIONS = [
    { value: 'today', label: 'Hari Ini' },
    { value: '7_days', label: '7 Hari Terakhir' },
    { value: '30_days', label: '30 Hari Terakhir' },
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'this_year', label: 'Tahun Ini' },
];

/**
 * Custom period select dropdown matching DateRangePicker and Workshop Ledger styling.
 */
export default function PeriodSelectDropdown({
    value = '',
    onChange,
    options = null,
    includeAll = false,
    placeholder = 'Pilihan Cepat...',
    fullWidth = false,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const availableOptions = React.useMemo(() => {
        if (options && Array.isArray(options)) {
            return options;
        }
        if (includeAll) {
            return [{ value: 'all', label: 'Semua tanggal' }, ...DEFAULT_PERIOD_OPTIONS];
        }
        return DEFAULT_PERIOD_OPTIONS;
    }, [options, includeAll]);

    // Find current active label
    const selectedOption = availableOptions.find((opt) => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    // Close on click outside & Escape key
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (val) => {
        if (onChange) {
            onChange(val);
        }
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full min-w-0 text-left ${fullWidth ? 'sm:w-full' : 'sm:w-auto'} ${className}`}
        >
            {/* Trigger Button - Symmetrical with DateRangePicker */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Filter periode: ${displayLabel}`}
                className={`flex w-full min-w-0 items-center gap-2 rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-primaryDark focus-visible:outline-2 focus-visible:outline-accentYellow ${
                    fullWidth ? 'sm:w-full' : 'sm:w-auto'
                } sm:px-3.5`}
            >
                <FiCalendar size={15} className="shrink-0 text-accentYellow" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-left">{displayLabel}</span>
                <FiChevronDown
                    size={14}
                    className={`shrink-0 text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* Custom Dropdown Popover */}
            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Tutup pilihan periode"
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs sm:hidden"
                    />
                    <div
                        role="listbox"
                        className="fixed left-4 right-4 top-1/2 z-50 mx-auto max-w-xs -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-100 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mx-0 sm:mt-1.5 sm:w-52 sm:translate-y-0 sm:rounded-xl"
                    >
                        <div className="space-y-0.5">
                            {availableOptions.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                                            isSelected
                                                ? 'bg-slate-100 text-primaryDark dark:bg-slate-800 dark:text-accentYellow font-bold'
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && (
                                            <FiCheck size={14} className="shrink-0 text-accentYellow" aria-hidden="true" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
