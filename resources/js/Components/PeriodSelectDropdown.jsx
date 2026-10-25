import React from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FiCalendar, FiChevronDown, FiCheck } from 'react-icons/fi';

const DEFAULT_PERIOD_OPTIONS = [
    { value: 'today', label: 'Hari Ini' },
    { value: '7_days', label: '7 Hari Terakhir' },
    { value: '30_days', label: '30 Hari Terakhir' },
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'this_year', label: 'Tahun Ini' },
];

export default function PeriodSelectDropdown({ value = '', onChange, options = null, includeAll = false, placeholder = 'Pilihan Cepat...', fullWidth = false, className = '' }) {
    const availableOptions = Array.isArray(options) ? options : includeAll
        ? [{ value: 'all', label: 'Semua tanggal' }, ...DEFAULT_PERIOD_OPTIONS]
        : DEFAULT_PERIOD_OPTIONS;
    const label = availableOptions.find(option => option.value === value)?.label || placeholder;

    return (
        <Listbox value={value} onChange={onChange || (() => {})}>
            <div className={`relative w-full min-w-0 text-left ${fullWidth ? 'sm:w-full' : 'sm:w-auto'} ${className}`}>
                <ListboxButton aria-label={`Filter periode: ${label}`} className={`group flex w-full min-w-0 items-center gap-2 rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-primaryDark focus-visible:outline-2 focus-visible:outline-accentYellow ${fullWidth ? 'sm:w-full' : 'sm:w-auto'} sm:px-3.5`}>
                    <FiCalendar size={15} className="shrink-0 text-accentYellow" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    <FiChevronDown size={14} className="shrink-0 text-white transition-transform group-data-[open]:rotate-180" aria-hidden="true" />
                </ListboxButton>
                <ListboxOptions anchor="bottom start" className="z-50 mt-1.5 max-h-72 min-w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-xs text-slate-800 shadow-xl focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                    {availableOptions.map(option => (
                        <ListboxOption key={option.value} value={option.value} className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 font-semibold data-[focus]:bg-slate-100 data-[selected]:bg-slate-100 dark:data-[focus]:bg-slate-800 dark:data-[selected]:bg-slate-800">
                            <span className="truncate">{option.label}</span>
                            <FiCheck size={14} className="invisible shrink-0 text-accentYellow group-data-[selected]:visible" aria-hidden="true" />
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}
