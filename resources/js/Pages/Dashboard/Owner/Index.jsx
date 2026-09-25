import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateRangePicker from '@/Components/DateRangePicker';
import DashboardSkeleton from '@/Components/Skeletons/DashboardSkeleton';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { 
    FiTrendingUp, 
    FiShoppingBag, 
    FiDollarSign, 
    FiPackage, 
    FiClock, 
    FiCheckCircle, 
    FiArrowRight,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';

export default function Dashboard({ stats = {}, filters = {} }) {

    const [isNavigating, setIsNavigating] = useState(false);

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

    // Server-side Paginator for Transaksi Terakhir
    const extractPaginator = (rawOrders) => {
        if (rawOrders && typeof rawOrders === 'object' && !Array.isArray(rawOrders) && Array.isArray(rawOrders.data)) {
            return rawOrders;
        }
        const list = Array.isArray(rawOrders) ? rawOrders : [];
        return { data: list, current_page: 1, last_page: 1, total: list.length, per_page: 5 };
    };

    const [ordersPaginator, setOrdersPaginator] = useState(() => extractPaginator(stats.recent_orders));
    const [isFetchingOrders, setIsFetchingOrders] = useState(false);

    useEffect(() => {
        setOrdersPaginator(extractPaginator(stats.recent_orders));
    }, [stats.recent_orders]);

    const fetchOrdersPage = async (page) => {
        if (page < 1 || page > (ordersPaginator.last_page || 1)) return;
        setIsFetchingOrders(true);
        try {
            const res = await axios.get('/api/dashboard/recent-orders', {
                params: { page, per_page: 5, period: currentPeriod, start_date: startDate, end_date: endDate }
            });
            setOrdersPaginator(res.data);
        } catch {
            /* silent fallback */
        } finally {
            setIsFetchingOrders(false);
        }
    };

    const paginatedOrders = ordersPaginator.data || [];
    const currentPage = ordersPaginator.current_page || 1;
    const totalPages = ordersPaginator.last_page || 1;
    const totalOrdersCount = ordersPaginator.total || paginatedOrders.length;
    const perPage = ordersPaginator.per_page || 5;

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

            {isNavigating ? <DashboardSkeleton /> : <div className="w-full grid grid-cols-12 gap-5 items-start">
                
                {/* Header Filter Periode */}
                <div className="col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Ringkasan Toko</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Preset Select Dropdown */}
                        <select 
                            value={currentPeriod === 'custom' ? '' : currentPeriod}
                            onChange={handlePeriodChange}
                            className="w-full sm:w-auto border border-slate-200/90 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 dark:bg-slate-800 cursor-pointer shadow-2xs"
                        >
                            <option value="" disabled hidden>Pilihan Cepat...</option>
                            <option value="today">Hari Ini</option>
                            <option value="7_days">7 Hari Terakhir</option>
                            <option value="30_days">30 Hari Terakhir</option>
                            <option value="this_month">Bulan Ini</option>
                            <option value="this_year">Tahun Ini</option>
                        </select>

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
                <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Link href={route('orders.index')} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-amber-400 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Antrean saat ini</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingOrders}</h3>
                            </div>
                            <FiClock className="text-blue-600 shrink-0" size={20} />
                        </div>
                    </Link>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800" title="Pembayaran pada periode terpilih setelah retur">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Penjualan bersih</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatRp(revenueToday)}</h3>
                            </div>
                            <FiDollarSign className="text-blue-600 shrink-0" size={20} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transaksi lunas</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ordersToday}</h3>
                            </div>
                            <FiShoppingBag className="text-blue-600 shrink-0" size={20} />
                        </div>
                    </div>

                    <Link href={route('products.index')} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-amber-400 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stok perlu dicek</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{lowStockAlerts.length}</h3>
                            </div>
                            <FiPackage className={lowStockAlerts.length > 0 ? 'text-accentYellow shrink-0' : 'text-slate-400 shrink-0'} size={20} />
                        </div>
                    </Link>
                </div>

                {/* Ringkasan penjualan dan produk */}
                <div className="contents">
                    
                    {/* Left: Financial Sales Bar Chart with Y-Axis Ticks & Gridlines */}
                    <div className="col-span-12 xl:col-span-8 order-3 h-[280px] bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Penjualan</h3>
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
                                                        className={`w-full max-w-[72px] mx-auto rounded-t-md transition-all duration-200 relative ${data.value > 0 ? (data.is_today ? 'bg-accentYellow group-hover:bg-yellow-400 shadow-xs' : 'bg-blue-600 dark:bg-blue-500 group-hover:bg-blue-700 shadow-xs') : 'bg-slate-200/60 dark:bg-slate-800'}`}
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
                                        <span className={`text-[10px] sm:text-[11px] font-bold block truncate ${data.is_today ? 'text-amber-700 dark:text-accentYellow' : 'text-slate-600 dark:text-slate-400'}`} title={data.day}>
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
                        <div className="col-span-12 xl:col-span-4 order-4 h-[280px] min-h-0 flex flex-col bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1.5 shrink-0">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <FiTrendingUp className="text-blue-600 dark:text-yellow-400" size={16} />
                                    <span>Produk terlaris</span>
                                </h3>
                            </div>
                            
                            <div className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" role="region" aria-label={`Produk terlaris ${periodLabel}`} tabIndex={0}>
                                {topSellingMenu.length > 0 ? (
                                    topSellingMenu.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-none">
                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                <span className={`w-5 text-xs tabular-nums shrink-0 ${idx === 0 ? 'font-bold text-amber-700 dark:text-accentYellow' : 'text-slate-400 dark:text-slate-500'}`}>
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
                        <div className="col-span-12 xl:col-span-4 order-1 xl:order-2 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Stok perlu dicek</h3>
                            </div>
                            
                            <div className="space-y-1.5">
                                {lowStockAlerts.length > 0 ? (
                                    lowStockAlerts.slice(0, 3).map((stock, idx) => (
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
                            {lowStockAlerts.length > 3 && (
                                <Link href={route('products.index')} className="inline-block mt-2 text-xs font-bold text-blue-600 dark:text-yellow-400">
                                    Lihat produk <FiArrowRight className="inline" />
                                </Link>
                            )}
                        </div>

                    </div>
                </div>

                {/* Pesanan terbaru tampil sebelum grafik */}
                <div className="col-span-12 xl:col-span-8 order-2 xl:order-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                    <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">Pesanan terbaru</h3>
                        <Link href={route('orders.index')} className="text-xs font-bold text-blue-600 dark:text-yellow-400 hover:text-blue-700 flex items-center gap-1.5">
                            <span>Lihat semua</span>
                            <FiArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                    </div>

                    {/* Table Container with Internal Scroll */}
                    <div className="max-h-[320px] overflow-auto">
                        <table className="w-full min-w-[650px] text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3">Pesanan</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Dibuat</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Bayar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                {paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((ord) => {
                                        const formattedInv = formatInvoiceNumber(ord);
                                        return (
                                            <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{formattedInv}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                                                    {ord.customer_name || 'Pelanggan Umum'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {ord.created_at ? new Date(ord.created_at).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
                                                    }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{formatRp(Number(ord.total || 0))}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-semibold ${
                                                        ord.payment_status === 'paid'
                                                            ? 'text-emerald-700 dark:text-emerald-400'
                                                            : ord.payment_status === 'refunded'
                                                                ? 'text-slate-600 dark:text-slate-400'
                                                                : 'text-amber-700 dark:text-amber-400'
                                                    }`}>
                                                        {ord.payment_status === 'paid' ? 'Lunas' : ord.payment_status === 'refunded' ? 'Dikembalikan' : 'Belum lunas'}
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

                    {/* Table Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <span>
                                {((currentPage - 1) * perPage) + 1}–{Math.min(currentPage * perPage, totalOrdersCount)} dari {totalOrdersCount}
                            </span>

                            <div className="flex items-center space-x-1.5">
                                <button
                                    onClick={() => fetchOrdersPage(currentPage - 1)}
                                    disabled={currentPage === 1 || isFetchingOrders}
                                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 shadow-2xs"
                                >
                                    <FiChevronLeft size={14} strokeWidth={2.5} />
                                    <span>Sebelumnya</span>
                                </button>
                                
                                <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    onClick={() => fetchOrdersPage(currentPage + 1)}
                                    disabled={currentPage === totalPages || isFetchingOrders}
                                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 shadow-2xs"
                                >
                                    <span>Selanjutnya</span>
                                    <FiChevronRight size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>}
        </AuthenticatedLayout>
    );
}
