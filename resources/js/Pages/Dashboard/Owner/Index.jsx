import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DateRangePicker from '@/Components/DateRangePicker';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { 
    FiTrendingUp, 
    FiShoppingBag, 
    FiDollarSign, 
    FiUsers,
    FiPackage, 
    FiAlertTriangle, 
    FiClock, 
    FiCheckCircle, 
    FiArrowRight,
    FiChevronLeft,
    FiChevronRight,
    FiLayers,
    FiCheck
} from 'react-icons/fi';

export default function Dashboard({ stats = {}, filters = {} }) {

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
    const totalCustomers = stats.total_customers ?? ordersToday ?? 0;
    const pendingOrders = stats.pending_orders ?? 0;
    const totalProducts = stats.total_products ?? 0;

    const topSellingMenu = stats.top_selling || [];
    const lowStockAlerts = stats.low_stock || [];

    // Real sales data from backend
    const salesData = stats.sales_data || [];
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
            <Head title="Dashboard Overview - Toko Sparepart">
                <meta name="description" content="Ringkasan performa penjualan, total pendapatan, statistik pesanan, dan produk terlaris toko Toko Sparepart." />
            </Head>

            <div className="w-full space-y-5">
                
                {/* Header Filter Periode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:px-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs transition-colors">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Ringkasan Statistik</h2>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilih periode untuk memfilter data dashboard</p>
                    </div>
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

                {/* ROW 1: 5 KEY METRIC CARDS (INCLUDES TOTAL CUSTOMER) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    
                    {/* Card 1: Revenue Today */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pendapatan {periodLabel}</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatRp(revenueToday)}</h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                                <FiDollarSign size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span>Total Omzet Penjualan</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{periodLabel}</span>
                        </div>
                    </div>

                    {/* Card 2: Total Orders Today */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pesanan {periodLabel}</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ordersToday} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Transaksi</span></h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                                <FiShoppingBag size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Pelanggan (Total Customer) */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Pelanggan</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCustomers} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Orang</span></h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs shrink-0">
                                <FiUsers size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span>Pelanggan {periodLabel}</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">Aktif</span>
                        </div>
                    </div>

                    {/* Card 4: Pending Orders */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pesanan Diproses</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingOrders} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Antrean</span></h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-yellow-400 text-white shadow-xs shrink-0">
                                <FiClock size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span>Status Pesanan Aktif</span>
                            <span className={pendingOrders > 0 ? 'text-yellow-500 dark:text-yellow-400 font-bold' : 'text-slate-400 font-medium'}>
                                {pendingOrders > 0 ? 'Pesanan Berlangsung' : 'Lancar'}
                            </span>
                        </div>
                    </div>

                    {/* Card 5: Total Produk */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Katalog Produk</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalProducts} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Produk</span></h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                                <FiPackage size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span>Status Stok Minimum</span>
                            <span className={lowStockAlerts.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                                {lowStockAlerts.length > 0 ? `${lowStockAlerts.length} Produk Menipis` : 'Semua Stok Aman'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ROW 2: FINANCIAL CHART & SIDEBAR METRICS (FULL WIDTH & BALANCED GRID) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    
                    {/* Left: Financial Sales Bar Chart with Y-Axis Ticks & Gridlines */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between h-[360px] transition-colors">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Grafik Penjualan</h3>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Tren statistik omzet {periodLabel.toLowerCase()}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Puncak Penjualan</span>
                                <span className="text-sm font-black text-blue-600 dark:text-yellow-400">
                                    {maxSalesValue > 0 ? formatRp(maxSalesValue) : 'Belum ada penjualan'}
                                </span>
                            </div>
                        </div>

                        {/* Financial Bar Graph with Synchronized Horizontal Gridlines & Y-Axis Scale */}
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
                                                        className={`w-full rounded-t-md transition-all duration-200 relative ${data.value > 0 ? 'bg-blue-600 dark:bg-blue-500 group-hover:bg-blue-700 shadow-xs' : 'bg-slate-200/60 dark:bg-slate-800'}`}
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
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 block truncate" title={data.day}>
                                            {data.day}
                                        </span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>

                    {/* Right: Unified Best Selling & Low Stock Panel (Fixed 360px height matching left chart with dual scrollable sections) */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between h-[360px] overflow-hidden transition-colors">
                        
                        {/* Section A: Produk Terlaris */}
                        <div className="flex-1 min-h-0 flex flex-col mb-2.5 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1.5 shrink-0">
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                                    <FiTrendingUp className="text-blue-600 dark:text-yellow-400" size={16} strokeWidth={2.5} /> 
                                    <span>Produk Terlaris {periodLabel}</span>
                                </h3>
                                {topSellingMenu.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400">{topSellingMenu.length} Item</span>
                                )}
                            </div>
                            
                            <div className="flex-1 min-h-0 space-y-1 overflow-y-auto pr-1">
                                {topSellingMenu.length > 0 ? (
                                    topSellingMenu.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-100 dark:border-slate-800/80 last:border-none">
                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                    idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {item.rank || idx + 1}
                                                </span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-yellow-400 shrink-0 ml-2">{item.count} terjual</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-3 text-xs font-semibold text-slate-400">Belum ada transaksi produk</div>
                                )}
                            </div>
                        </div>

                        {/* Section B: Peringatan Stok Minimum */}
                        <div className="flex-1 min-h-0 flex flex-col pt-2.5 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                                    <span>Peringatan Stok Minimum</span>
                                </h3>
                                {lowStockAlerts.length > 0 && (
                                    <span className="text-[10px] font-bold text-rose-500">{lowStockAlerts.length} Peringatan</span>
                                )}
                            </div>
                            
                            <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
                                {lowStockAlerts.length > 0 ? (
                                    lowStockAlerts.map((stock, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
                                            <div className="min-w-0">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">{stock.name}</span>
                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{stock.left}</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-600 text-white shrink-0 shadow-2xs">
                                                {stock.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                                        <FiCheckCircle size={16} strokeWidth={2.5} className="text-white shrink-0" />
                                        <span>Semua stok produk dalam kondisi aman</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ROW 3: RECENT TRANSACTIONS TABLE (CLEAN FORMATTED & SCROLLABLE WITH PAGINATION) */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                    <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">Transaksi Terakhir</h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Daftar pesanan terbaru yang masuk dari Kasir / QR Order</p>
                        </div>
                        <Link href={route('orders.index')} className="text-xs font-bold text-blue-600 dark:text-yellow-400 hover:text-blue-700 flex items-center gap-1.5">
                            <span>Kelola Semua Pesanan</span>
                            <FiArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                    </div>

                    {/* Table Container with Internal Scroll */}
                    <div className="max-h-[320px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3">No. Invoice</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Tipe Pesanan</th>
                                    <th className="px-4 py-3">Total Tagihan</th>
                                    <th className="px-4 py-3">Status Pembayaran</th>
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
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        Ambil di Toko
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{formatRp(Number(ord.total || 0))}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold shadow-2xs ${
                                                        ord.payment_status === 'paid' 
                                                            ? 'bg-emerald-600 text-white' 
                                                            : 'bg-amber-500 text-white'
                                                    }`}>
                                                        {ord.payment_status === 'paid' ? 'LUNAS' : 'PENDING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                                            Belum ada transaksi hari ini. Buka <Link href={route('pos.index')} className="text-blue-600 dark:text-yellow-400 underline font-bold">POS Kasir</Link> untuk mencoba!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Pagination Footer */}
                    {totalOrdersCount > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <span>
                                Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalOrdersCount)} dari {totalOrdersCount} transaksi
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

            </div>
        </AuthenticatedLayout>
    );
}