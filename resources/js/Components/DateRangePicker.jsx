import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX, FiCheck } from 'react-icons/fi';

export default function DateRangePicker({ initialStart = '', initialEnd = '', onApply, activePeriod = '' }) {
    const [isOpen, setIsOpen] = useState(false);

    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const formatDateStr = (dateObj) => {
        if (!dateObj) return '';
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatDisplayStr = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const [rangeStart, setRangeStart] = useState(() => parseLocalDate(initialStart));
    const [rangeEnd, setRangeEnd] = useState(() => parseLocalDate(initialEnd));
    const [hoverDate, setHoverDate] = useState(null);

    const [viewYear, setViewYear] = useState(() => (rangeStart || new Date()).getFullYear());
    const [viewMonth, setViewMonth] = useState(() => (rangeStart || new Date()).getMonth());

    const containerRef = useRef(null);

    useEffect(() => {
        if (initialStart) setRangeStart(parseLocalDate(initialStart));
        if (initialEnd) setRangeEnd(parseLocalDate(initialEnd));
    }, [initialStart, initialEnd]);

    // Close popover on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleDateClick = (dayDate) => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(dayDate);
            setRangeEnd(null);
        } else if (rangeStart && !rangeEnd) {
            if (dayDate < rangeStart) {
                setRangeStart(dayDate);
                setRangeEnd(rangeStart);
            } else {
                setRangeEnd(dayDate);
            }
        }
    };

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday start

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isInRange = (dayDate) => {
        if (!dayDate || !rangeStart) return false;
        const end = rangeEnd || hoverDate;
        if (!end) return false;

        const [startTs, endTs] = rangeStart <= end 
            ? [rangeStart.getTime(), end.getTime()] 
            : [end.getTime(), rangeStart.getTime()];
            
        const curTs = dayDate.getTime();
        return curTs > startTs && curTs < endTs;
    };

    const handleApply = () => {
        if (!rangeStart) return;
        const finalStart = rangeStart;
        const finalEnd = rangeEnd || rangeStart;
        onApply(formatDateStr(finalStart), formatDateStr(finalEnd));
        setIsOpen(false);
    };

    const isCustomActive = activePeriod === 'custom';
    const activeLabel = isCustomActive && initialStart && initialEnd
        ? `${formatDisplayStr(initialStart)} - ${formatDisplayStr(initialEnd)}`
        : 'Rentang Tanggal...';

    return (
        <div className="relative w-full text-left sm:w-auto" ref={containerRef}>
            {/* Outer Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center gap-2 border rounded-xl px-3 py-2 text-xs font-bold transition shadow-2xs sm:w-auto sm:px-3.5 ${
                    isCustomActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                        : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
            >
                <FiCalendar className={isCustomActive ? 'text-blue-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'} size={15} />
                <span className="truncate sm:hidden">{isCustomActive ? 'Rentang khusus' : 'Pilih tanggal'}</span>
                <span className="hidden sm:inline">{activeLabel}</span>
            </button>

            {/* Popover Calendar Modal */}
            {isOpen && (
                <>
                <button type="button" aria-label="Tutup pemilih tanggal" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 sm:hidden" />
                <div className="fixed left-4 right-4 top-1/2 z-50 mx-auto max-h-[calc(100dvh-2rem)] max-w-sm -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mx-0 sm:mt-2 sm:w-80 sm:translate-y-0 sm:p-4">
                    
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                        <span className="text-xs font-black text-slate-900 dark:text-white">Pilih Rentang Tanggal</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <FiX size={16} />
                        </button>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center justify-between mb-3 px-1">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                        >
                            <FiChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            {monthNames[viewMonth]} {viewYear}
                        </span>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-2">
                        <span>Sen</span>
                        <span>Sel</span>
                        <span>Rab</span>
                        <span>Kam</span>
                        <span>Jum</span>
                        <span>Sab</span>
                        <span>Min</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8"></div>
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dayDate = new Date(viewYear, viewMonth, dayNum);
                            const isStart = isSameDay(dayDate, rangeStart);
                            const isEnd = isSameDay(dayDate, rangeEnd);
                            const inRange = isInRange(dayDate);

                            let cellStyle = 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold';
                            if (isStart || isEnd) {
                                cellStyle = 'bg-blue-600 text-white font-extrabold shadow-2xs rounded-lg';
                            } else if (inRange) {
                                cellStyle = 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-bold';
                            }

                            return (
                                <button
                                    key={`day-${dayNum}`}
                                    onClick={() => handleDateClick(dayDate)}
                                    onMouseEnter={() => setHoverDate(dayDate)}
                                    onMouseLeave={() => setHoverDate(null)}
                                    className={`h-8 w-full rounded-lg text-xs flex items-center justify-center transition-all ${cellStyle}`}
                                >
                                    {dayNum}
                                </button>
                            );
                        })}
                    </div>

                    {/* Range Preview Banner */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                        <div className="text-slate-600 dark:text-slate-400">
                            {rangeStart ? (
                                <span>
                                    <span className="text-blue-600 dark:text-yellow-400">{formatDisplayStr(formatDateStr(rangeStart))}</span>
                                    {rangeEnd ? <span> s/d <span className="text-blue-600 dark:text-yellow-400">{formatDisplayStr(formatDateStr(rangeEnd))}</span></span> : ' (Pilih Tgl Selesai)'}
                                </span>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500">Klik tanggal mulai</span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={!rangeStart}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold transition shadow-2xs flex items-center gap-1.5"
                        >
                            <FiCheck size={14} />
                            <span>Terapkan Filter</span>
                        </button>
                    </div>

                </div>
                </>
            )}
        </div>
    );
}
