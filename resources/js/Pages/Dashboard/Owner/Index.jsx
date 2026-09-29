import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateRangePicker from '@/Components/DateRangePicker';
import DashboardSkeleton from '@/Components/Skeletons/DashboardSkeleton';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { recentOrderStatus } from './recentOrderStatus';
import { 
    FiTrendingUp, 
    FiShoppingBag, 
    FiEye,
    FiEyeOff,
    FiPackage, 
    FiClock, 
    FiCheckCircle, 
    FiArrowRight,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';

export default function Dashboard({ stats = {}, filters = {} }) {

    const [isNavigating, setIsNavigating] = useState(false);
    const [isRevenueVisible, setIsRevenueVisible] = useState(true);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const rawUrl = event?.detail?.visit?.url;
            let targetPath = '';
            if (typeof rawUrl === 'string') {
                targetPath = new URL(rawUrl, window.location.origin).pathname;
            } else if (rawUrl?.pathname) {
                targetPath = rawUrl.pathname;
            }
            if (targetPath === '/dashboard') {
                setIsNavigating(true);
            }
        });
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    const currentPeriod = filters.period || '7_days';
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handlePeriodChange = (e) => {
        const val = e.target.value;
        router.get('/dashboard', { period: val }, { preserveState: true, preserveScroll: true });
    };

    const handleApplyDateRange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get('/dashboard', { period: 'custom', start_date: start, end_date: end }, { preserveState: true, preserveScroll: true });
    };

    const getPeriodLabel = (period) => {
        switch(period) {
            case 'today': return 'Hari Ini';
            case '30_days': return '30 Hari Terakhir';
            case 'this_month': return 'Bulan Ini';
            case 'this_year': return 'Tahun Ini';
            case 'custom':
                return startDate && endDate ? `${startDate} s/d ${endDate}` : 'Kustom Tanggal';
            case '7_days':
            default: return '7 Hari Terakhir';
        }
    };
    const periodLabel = getPeriodLabel(currentPeriod);

    const revenueToday = stats.revenue_today ?? 0;
    const ordersToday = stats.orders_today ?? 0;
    const pendingOrders = stats.pending_orders ?? 0;

    const topSellingMenu = stats.top_selling || [];
    const lowStockAlerts = stats.low_stock || [];

    // Real sales data from backend
    const salesData = stats.sales_data || [];
    const salesActivity = salesData.filter((day) => day.value !== 0 || day.count > 0);
    const showSalesChart = salesActivity.length > 0 && salesData.every((day) => day.value >= 0);
    const maxSalesValue = Math.max(...salesData.map(d => d.value), 0);

    // Y-Axis scale ticks
    const yAxisTicks = [
        maxSalesValue,
        Math.round(maxSalesValue * 0.66),
        Math.round(maxSalesValue * 0.33),
        0
    ];

    const [ordersPaginator, setOrdersPaginator] = useState(stats.recent_orders);
    const [isFetchingOrders, setIsFetchingOrders] = useState(false);
    const mobileOrdersRef = useRef(null);
    const desktopOrdersRef = useRef(null);

    useEffect(() => {
        setOrdersPaginator(stats.recent_orders);
    }, [stats.recent_orders]);

    const fetchOrdersPage = async (page) => {
        if (page < 1 || page > (ordersPaginator?.last_page || 1)) return;
        setIsFetchingOrders(true);
        try {
            const response = await axios.get('/api/dashboard/recent-orders', {
                params: { page, per_page: 15, period: currentPeriod, start_date: startDate, end_date: endDate }
            });
            setOrdersPaginator(response.data);
            if (mobileOrdersRef.current) mobileOrdersRef.current.scrollTop = 0;
            if (desktopOrdersRef.current) desktopOrdersRef.current.scrollTop = 0;
        } catch {
            // Keep the current page if the request fails.
        } finally {
            setIsFetchingOrders(false);
        }
    };

    const recentOrders = ordersPaginator?.data || [];
    const currentPage = ordersPaginator?.current_page || 1;
    const totalPages = ordersPaginator?.last_page || 1;
    const totalOrdersCount = ordersPaginator?.total || 0;

    const formatRp = (val) => `Rp ${val.toLocaleString('id-ID')}`;

    const formatShortRp = (val) => {
        if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
        if (val >= 1000) return `Rp ${Math.round(val / 1000)}rb`;
        return `Rp ${val}`;
    };

    // Helper to format invoice number nicely (full order_number)
    const formatInvoiceNumber = (ord) => {
        if (!ord) return 'ORD-???';
        if (ord.order_number) return ord.order_number;
        if (ord.id) return `ORD-${ord.id.slice(0, 8).toUpperCase()}`;
        return 'ORD-???';
    };

    return (
        <AuthenticatedLayout pageTitle="Dashboard">
            <Head title="Dashboard Overview">
                <meta name="description" content="Ringkasan performa penjualan, total pendapatan, statistik pesanan, dan produk terlaris toko Motorku." />
            </Head>

            {isNavigating ? <DashboardSkeleton /> : <div className="grid w-full grid-cols-12 items-start gap-3 sm:gap-4 xl:-mt-4">
                
                {/* Header Filter Periode */}
                <div className="col-span-12 flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <h2 className="text-base sm:text-lg font-black text-primaryDark dark:text-white">Ringkasan Toko</h2>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        {/* Preset Select Dropdown */}
                        <div className="relative min-w-0 w-full sm:w-auto">
                            <select
                                value={currentPeriod === 'custom' ? '' : currentPeriod}
                                onChange={handlePeriodChange}
                                aria-label="Pilih periode dashboard"
                                className="w-full appearance-none rounded-xl border border-primary bg-primary py-2 pl-3 pr-8 text-xs font-bold text-white shadow-2xs cursor-pointer transition hover:bg-primaryDark focus:outline-none focus:ring-0 focus:border-primaryDark sm:pl-4"
                            >
                                <option className="bg-white text-slate-900" value="" disabled hidden>Pilihan Cepat...</option>
                                <option className="bg-white text-slate-900" value="today">Hari Ini</option>
                                <option className="bg-white text-slate-900" value="7_days">7 Hari Terakhir</option>
                                <option className="bg-white text-slate-900" value="30_days">30 Hari Terakhir</option>
                                <option className="bg-white text-slate-900" value="this_month">Bulan Ini</option>
                                <option className="bg-white text-slate-900" value="this_year">Tahun Ini</option>
                            </select>
                            <FiChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white" size={14} />
                        </div>

                        {/* Separate Single Calendar Range Picker */}
                        <DateRangePicker 
                            initialStart={startDate}
                            initialEnd={endDate}
                            activePeriod={currentPeriod}
                            onApply={handleApplyDateRange}
                        />
                    </div>
                </div>

                {/* Kondisi saat ini dan penjualan pada periode terpilih */}
                <div className="col-span-12 grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
                    <Link href={route('orders.index')} className="relative overflow-hidden bg-primary p-3 sm:p-4 rounded-xl hover:bg-primaryDark transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">Antrean saat ini</p>
                                <h3 className="text-xl sm:text-[30px] font-heading font-extrabold text-white mt-1">{pendingOrders}</h3>
                            </div>
                            <FiClock className="hidden text-accentYellow shrink-0 sm:block" size={18} />
                        </div>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-accentYellow" />
                    </Link>

                    <div className="relative overflow-hidden bg-primary p-3 sm:p-4 rounded-xl" title="Pembayaran pada periode terpilih setelah retur">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="pr-8 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">Penjualan bersih</p>
                                <h3 className="text-base sm:text-[30px] font-heading font-extrabold text-white mt-1">{isRevenueVisible ? formatRp(revenueToday) : 'Rp ••••••'}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRevenueVisible((visible) => !visible)}
                                aria-label={isRevenueVisible ? 'Sembunyikan penjualan bersih' : 'Tampilkan penjualan bersih'}
                                title={isRevenueVisible ? 'Sembunyikan nominal' : 'Tampilkan nominal'}
                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-white hover:text-accentYellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentYellow sm:right-3 sm:top-3"
                            >
                                {isRevenueVisible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                            </button>
                        </div>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-accentYellow" />
                    </div>

                    <div className="relative overflow-hidden bg-primary p-3 sm:p-4 rounded-xl">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">Transaksi lunas</p>
                                <h3 className="text-xl sm:text-[30px] font-heading font-extrabold text-white mt-1">{ordersToday}</h3>
                            </div>
                            <FiShoppingBag className="hidden text-accentYellow shrink-0 sm:block" size={18} />
                        </div>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-accentYellow" />
                    </div>

                    <Link href={route('products.index')} className="relative overflow-hidden bg-primary p-3 sm:p-4 rounded-xl hover:bg-primaryDark transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">Stok perlu dicek</p>
                                <h3 className="text-xl sm:text-[30px] font-heading font-extrabold text-white mt-1">{stats.low_stock_count ?? lowStockAlerts.length}</h3>
                            </div>
                            <FiPackage className="hidden text-accentYellow shrink-0 sm:block" size={18} />
                        </div>
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-accentYellow" />
                    </Link>
                </div>

                {/* Ringkasan penjualan dan produk */}
                <div className="contents">
                    
                    {/* Left: Financial Sales Bar Chart with Y-Axis Ticks & Gridlines */}
                    <div className="col-span-12 xl:col-span-8 order-3 h-[280px] bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                            <h3 className="font-extrabold text-primaryDark dark:text-white text-base">Penjualan</h3>
                        </div>

                        {!showSalesChart ? (
                            <div className="py-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                {salesActivity.length === 0
                                    ? `Belum ada pembayaran atau retur ${periodLabel.toLowerCase()}.`
                                    : salesActivity.map((day, index) => (
                                        <p key={index}>{day.day}: {formatRp(day.value)} bersih, {day.count} transaksi lunas.</p>
                                    ))}
                            </div>
                        ) : (
                        /* Tetap tampil meski hanya satu hari memiliki penjualan */
                        <div className="relative flex-1 flex flex-col justify-between pt-6">

                            {/* Chart Main Plot Area (Y-Axis Labels + Gridlines & Bars) */}
                            <div className="relative flex-1 w-full min-h-0 flex items-stretch">

                                {/* Y-Axis Labels Column */}
                                <div className="w-14 flex flex-col justify-between pointer-events-none pr-2 shrink-0 py-0">
                                    {yAxisTicks.map((tick, i) => (
                                        <div key={i} className="flex items-center justify-end h-0">
                                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 text-right leading-none">
                                                {formatShortRp(tick)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Gridlines + Bars Plot Canvas */}
                                <div className="relative flex-1 h-full min-h-0">

                                    {/* Horizontal Gridlines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                        {yAxisTicks.map((_, i) => (
                                            <div key={i} className="w-full border-b border-slate-200/70 dark:border-slate-800 border-dashed"></div>
                                        ))}
                                    </div>

                                    {/* Bar Columns Container (fills 100% of exact same plot canvas) */}
                                    <div className="relative w-full h-full flex items-end justify-between gap-1 sm:gap-2 z-10">
                                        {salesData.length > 0 ? salesData.map((data, idx) => {
                                            const heightPct = maxSalesValue > 0 ? Math.min(Math.max((data.value / maxSalesValue) * 100, data.value > 0 ? 4 : 0), 100) : 0;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                                                    <div 
                                                        className={`w-full max-w-[72px] mx-auto rounded-t-md transition-all duration-200 relative ${data.value > 0 ? (data.is_today ? 'bg-accentYellow group-hover:bg-yellow-400 shadow-xs' : 'bg-primary group-hover:bg-primaryDark shadow-xs') : 'bg-slate-200/60 dark:bg-slate-800'}`}
                                                        style={{ height: `${heightPct}%` }}
                                                    >
                                                        {/* Hover Tooltip */}
                                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded font-bold whitespace-nowrap transition z-30 pointer-events-none shadow-md border border-slate-700">
                                                            {formatRp(data.value)}<br/>{data.count} Transaksi
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-400">
                                                Belum ada data penjualan {periodLabel.toLowerCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* X-Axis Labels Row */}
                            <div className="pl-14 w-full flex items-center justify-between gap-1 sm:gap-2 pt-3 shrink-0">
                                {salesData.map((data, idx) => (
                                    <div key={idx} className="flex-1 text-center min-w-0">
                                        <span className={`text-[10px] sm:text-[11px] font-bold block truncate ${data.is_today ? 'text-accentYellow' : 'text-slate-600 dark:text-slate-400'}`} title={data.day}>
                                            {data.day}
                                        </span>
                                    </div>
                                ))}
                            </div>

                        </div>
                        )}
                    </div>

                    {/* Produk terlaris dan stok yang perlu dicek */}
                    <div className="contents">
                        
                        {/* Section A: Produk Terlaris */}
                        <div className="col-span-12 xl:col-span-4 order-4 h-[280px] min-h-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
                            <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3 sm:px-5">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <FiTrendingUp className="text-white" size={16} />
                                    <span>Produk terlaris</span>
                                </h3>
                            </div>
                            
                            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1 sm:px-5 space-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" role="region" aria-label={`Produk terlaris ${periodLabel}`} tabIndex={0}>
                                {topSellingMenu.length > 0 ? (
                                    topSellingMenu.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-none">
                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                <span className={`w-5 text-xs tabular-nums shrink-0 ${Number(item.rank || idx + 1) <= 3 ? 'font-bold text-[#fceb2d]' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {String(item.rank || idx + 1).padStart(2, '0')}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">{item.count} terjual</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-3 text-xs font-semibold text-slate-400">Belum ada transaksi produk</div>
                                )}
                            </div>
                        </div>

                        {/* Section B: Peringatan Stok Minimum */}
                        <div className="col-span-12 xl:col-span-4 order-1 xl:order-2 flex h-[280px] min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs xl:h-auto xl:self-stretch">
                            <div className="flex shrink-0 items-center justify-between gap-3 bg-primary px-4 py-3 sm:px-5">
                                <h3 className="font-bold text-white text-sm">Stok perlu dicek</h3>
                            </div>
                            
                            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5 xl:py-3">
                                <div className="relative min-h-0 flex-1">
                                    <div className="no-scrollbar absolute inset-0 space-y-1.5 overflow-y-auto pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" role="region" aria-label={`Stok perlu dicek, ${lowStockAlerts.length} produk`} tabIndex={0}>
                                        {lowStockAlerts.length > 0 ? (
                                            lowStockAlerts.map((stock, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-none text-xs">
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">{stock.name}</span>
                                                        {stock.status !== 'Critical' && <span className="text-xs text-slate-500 dark:text-slate-400">{stock.left}</span>}
                                                    </div>
                                                    <span className={`font-semibold shrink-0 ${stock.status === 'Critical' ? 'text-rose-700 dark:text-rose-400' : 'text-accentYellow'}`}>
                                                        {stock.status === 'Critical' ? 'Habis' : 'Menipis'}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                                <FiCheckCircle size={16} className="text-emerald-600 shrink-0" />
                                                <span>Belum ada produk di bawah batas minimum.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {lowStockAlerts.length > 3 && (
                                    <Link href={route('products.index')} className="mt-2 shrink-0 text-xs font-bold text-primary dark:text-yellow-400">
                                        Lihat produk <FiArrowRight className="inline" />
                                    </Link>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Pesanan terbaru tampil sebelum grafik */}
                <div className="col-span-12 xl:col-span-8 order-2 xl:order-1 flex h-[390px] min-h-0 flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                    <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3 sm:px-5">
                        <h3 className="font-bold text-white text-sm">Pesanan terbaru</h3>
                        <Link href={route('orders.index')} className="text-xs font-bold text-white hover:text-accentYellow flex items-center gap-1.5">
                            <span>Lihat semua</span>
                            <FiArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                    </div>

                    <div ref={mobileOrdersRef} className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800 sm:hidden" role="region" aria-label={`Pesanan terbaru ${periodLabel}`} tabIndex={0}>
                        {recentOrders.length > 0 ? recentOrders.map((ord) => (
                            <div key={ord.id} className="flex items-start justify-between gap-3 px-4 py-3 text-xs">
                                <div className="min-w-0">
                                    <p className="truncate font-mono font-bold text-slate-900 dark:text-white">{formatInvoiceNumber(ord)}</p>
                                    <p className="mt-0.5 truncate text-slate-600 dark:text-slate-300">{ord.customer_name || 'Pelanggan Umum'}</p>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{ord.created_at ? new Date(ord.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="font-bold text-slate-900 dark:text-white">{formatRp(Number(ord.total || 0))}</p>
                                    <p className={`mt-1 text-[11px] font-semibold ${recentOrderStatus(ord).color}`}>{recentOrderStatus(ord).label}</p>
                                </div>
                            </div>
                        )) : <p className="px-4 py-8 text-center text-xs font-semibold text-slate-500">Belum ada pesanan {periodLabel.toLowerCase()}.</p>}
                    </div>

                    {/* Table Container with Internal Scroll */}
                    <div ref={desktopOrdersRef} className="hidden min-h-0 flex-1 overflow-auto sm:block" role="region" aria-label={`Pesanan terbaru ${periodLabel}`} tabIndex={0}>
                        <table className="w-full min-w-[650px] text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2">Pesanan</th>
                                    <th className="px-4 py-2">Pelanggan</th>
                                    <th className="px-4 py-2">Dibuat</th>
                                    <th className="px-4 py-2">Total</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((ord) => {
                                        const formattedInv = formatInvoiceNumber(ord);
                                        return (
                                            <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                <td className="px-4 py-2 font-mono font-bold text-slate-900 dark:text-white">{formattedInv}</td>
                                                <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200">
                                                    {ord.customer_name || 'Pelanggan Umum'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {ord.created_at ? new Date(ord.created_at).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
                                                    }) : '-'}
                                                </td>
                                                <td className="px-4 py-2 font-black text-slate-900 dark:text-white">{formatRp(Number(ord.total || 0))}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs font-semibold ${recentOrderStatus(ord).color}`}>
                                                        {recentOrderStatus(ord).label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                                            Belum ada pesanan {periodLabel.toLowerCase()}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalOrdersCount > 0 && (
                        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                            <span>{(currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, totalOrdersCount)} dari {totalOrdersCount}</span>
                            <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => fetchOrdersPage(currentPage - 1)} disabled={currentPage === 1 || isFetchingOrders} aria-label="Halaman pesanan sebelumnya" className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-3">
                                    <FiChevronLeft size={14} /><span className="hidden sm:inline">Sebelumnya</span>
                                </button>
                                <span className="rounded-lg border border-slate-300 bg-slate-200 px-2 py-1 font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 sm:px-3">{currentPage} / {totalPages}</span>
                                <button type="button" onClick={() => fetchOrdersPage(currentPage + 1)} disabled={currentPage === totalPages || isFetchingOrders} aria-label="Halaman pesanan berikutnya" className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-3">
                                    <span className="hidden sm:inline">Selanjutnya</span><FiChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            </div>}
        </AuthenticatedLayout>
    );
}
