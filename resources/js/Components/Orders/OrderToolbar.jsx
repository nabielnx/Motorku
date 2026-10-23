import { FiCalendar, FiChevronDown, FiEye, FiEyeOff, FiRefreshCw, FiSearch } from 'react-icons/fi';
import MaskedCurrency from '@/Components/MaskedCurrency';
import DateRangePicker from '@/Components/DateRangePicker';
import PeriodSelectDropdown from '@/Components/PeriodSelectDropdown';

export default function OrderToolbar({
    periodLabel, orderCount, revenueText, revenueVisible, onToggleRevenue,
    activeCount, status, onStatusChange, search, onSearchChange, onRefresh, refreshing,
    period, startDate, endDate, datesOpen, onToggleDates, onPeriodChange, onDateRangeApply,
}) {
    const filteredDates = period !== 'all';

    return (
        <>
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-base font-semibold leading-5 text-primaryDark dark:text-white">Pesanan</h1>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                        <strong className="font-semibold tabular-nums">{orderCount} pesanan</strong>
                        <span aria-hidden="true"> · </span>{periodLabel}
                    </p>
                </div>
                <div className="min-w-0">
                    <p className="pl-9 text-[10px] font-medium leading-3 text-slate-500 dark:text-slate-400">Pendapatan</p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onToggleRevenue}
                            aria-label={revenueVisible ? 'Sembunyikan pendapatan' : 'Tampilkan pendapatan'}
                            aria-pressed={revenueVisible}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-slate-600 hover:bg-slate-100 dark:text-accentYellow dark:hover:bg-slate-800"
                        >
                            {revenueVisible ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                        </button>
                        <MaskedCurrency as="strong" text={revenueText} visible={revenueVisible} maskGroupingSeparators className="text-xs leading-4 text-primaryDark dark:text-white" />
                    </div>
                </div>
            </header>

            <section aria-label="Pencarian dan filter pesanan" className="admin-surface order-toolbar shrink-0 border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 sm:p-2.5 xl:grid xl:grid-cols-2 xl:items-center xl:gap-x-6">
                <div className="flex items-center gap-2">
                    <nav aria-label="Tampilan pesanan" className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-[8px] bg-slate-100 p-0.5 dark:bg-slate-800 sm:flex sm:flex-none">
                        {[
                            { value: 'action', label: 'Perlu ditangani' },
                            { value: 'All', label: 'Semua pesanan' },
                        ].map(view => (
                            <button
                                key={view.value}
                                type="button"
                                aria-pressed={status === view.value}
                                onClick={() => onStatusChange(view.value)}
                                className={`flex min-h-8 min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 rounded-[5px] px-1.5 py-1 text-[11px] leading-4 font-medium sm:px-3 ${status === view.value ? 'bg-accentYellow text-primaryDark' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <span>{view.label}</span>
                                {view.value === 'action' && <span className="tabular-nums">({activeCount})</span>}
                            </button>
                        ))}
                    </nav>
                    <button type="button" onClick={onRefresh} disabled={refreshing} aria-label={refreshing ? 'Memuat pesanan' : 'Muat ulang pesanan'} title="Muat ulang pesanan" className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white disabled:text-slate-400">
                        <FiRefreshCw size={16} className={refreshing ? 'animate-spin motion-reduce:animate-none' : ''} />
                    </button>
                </div>

                <div className="mt-1.5 flex items-center gap-2 xl:mt-0">
                    <div className="relative min-w-0 flex-1">
                        <label htmlFor="order-search-input" className="sr-only">Cari pesanan berdasarkan nomor, pelanggan, atau barang</label>
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
                        <input id="order-search-input" type="search" value={search} onChange={event => onSearchChange(event.target.value)} placeholder="Cari pesanan…" title="Cari nomor, pelanggan, atau barang" className="h-8 w-full min-w-0 admin-control border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>
                    {status === 'All' && (
                        <button type="button" onClick={onToggleDates} aria-expanded={datesOpen} aria-controls="order-date-filters" className={`flex h-8 shrink-0 items-center gap-1.5 admin-button border px-2.5 text-xs font-semibold ${datesOpen || filteredDates ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                            <FiCalendar size={15} className={datesOpen || filteredDates ? 'text-accentYellow' : ''} aria-hidden="true" />
                            Tanggal{filteredDates && <span className="sr-only">, filter aktif</span>}
                            <FiChevronDown size={13} className={datesOpen ? 'rotate-180' : ''} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {status === 'All' && datesOpen && (
                    <div id="order-date-filters" className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800 xl:col-span-2">
                        <p className="mb-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">Tanggal transaksi</p>
                        <div className="order-date-controls grid min-w-0 grid-cols-2 gap-2 sm:max-w-lg">
                            <PeriodSelectDropdown value={period === 'custom' ? '' : period} onChange={onPeriodChange} includeAll fullWidth />
                            <DateRangePicker initialStart={startDate} initialEnd={endDate} activePeriod={period} fullWidth onApply={onDateRangeApply} />
                        </div>
                    </div>
                )}
                {status === 'action' && <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 xl:col-span-2">Antrean aktif dari semua tanggal.</p>}
            </section>
        </>
    );
}
