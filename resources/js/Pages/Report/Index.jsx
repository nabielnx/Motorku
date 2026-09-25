import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportSkeleton from '@/Components/Skeletons/ReportSkeleton';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    FiCalendar, FiDollarSign, FiShoppingBag, FiTrendingUp,
    FiPrinter, FiChevronDown
} from 'react-icons/fi';

export default function ReportIndex({ reportStats = {}, filters = {} }) {
    const [isNavigating, setIsNavigating] = useState(false);
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const [cashDate, setCashDate] = useState(today);
    const [cashSummary, setCashSummary] = useState(null);
    const [openingCash, setOpeningCash] = useState('0');
    const [cashOut, setCashOut] = useState('0');
    const [actualCash, setActualCash] = useState('');
    const [cashNotes, setCashNotes] = useState('');
    const [savingCash, setSavingCash] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const rawUrl = event?.detail?.visit?.url;
            let targetPath = '';
            if (typeof rawUrl === 'string') {
                targetPath = new URL(rawUrl, window.location.origin).pathname;
            } else if (rawUrl?.pathname) {
                targetPath = rawUrl.pathname;
            }
            if (targetPath && targetPath.startsWith('/reports')) {
                setIsNavigating(true);
            }
        });
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        return () => { removeStart(); removeFinish(); };
    }, []);
    const { auth, app_settings } = usePage().props;
    const locale = app_settings?.locale || 'id';
    const userName = auth?.user?.name || 'Owner';
    const userRole = auth?.roles?.[0] || auth?.user?.role || 'owner';

    useEffect(() => {
        let active = true;
        setCashSummary(null);
        setOpeningCash('0');
        setCashOut('0');
        setActualCash('');
        setCashNotes('');
        axios.get('/api/reports/cash', { params: { date: cashDate } }).then(({ data }) => {
            if (!active) return;
            setCashSummary(data.data);
            if (data.data.closing) {
                setOpeningCash(String(data.data.closing.opening_cash));
                setCashOut(String(data.data.closing.cash_out));
                setActualCash(String(data.data.closing.actual_cash));
                setCashNotes(data.data.closing.notes || '');
            }
        }).catch(() => { if (active) toast.error('Gagal memuat rekap kas.'); });
        return () => { active = false; };
    }, [cashDate]);

    const totalRevenue = Number(reportStats.total_revenue ?? 0);
    const totalRefunds = Number(reportStats.total_refunds ?? 0);
    const totalSubtotal = Number(reportStats.total_subtotal ?? 0);
    const totalTax = Number(reportStats.total_tax ?? 0);
    const totalOrders = Number(reportStats.total_orders ?? 0);
    const avgOrderValue = Number(reportStats.avg_order_value ?? 0);
    const avgOrdersPerDay = Number(reportStats.avg_orders_per_day ?? 0);
    const daysInRange = Number(reportStats.days_in_range ?? 1);

    const topSelling = (reportStats.top_selling || []).map((item, idx) => ({
        rank: idx + 1,
        name: item.product?.name ?? 'Produk',
        category: item.product?.category?.name ?? '-',
        sold: Number(item.total_qty || 0),
        revenue: Number(item.total_revenue || 0),
    }));

    const categoryBreakdown = (reportStats.category_breakdown || []).map(cat => ({
        name: cat.category_name || 'Lainnya',
        percentage: cat.percentage || 0,
        amount: Number(cat.total_revenue || 0),
    }));

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
    const expectedCash = Number(openingCash || 0) + Number(cashSummary?.cash_sales || 0) - Number(cashSummary?.cash_returns || 0) - Number(cashOut || 0);
    const cashDifference = actualCash === '' ? null : Number(actualCash) - expectedCash;

    const saveCashClosing = async () => {
        if (savingCash || cashSummary?.closing || actualCash === '') return;
        setSavingCash(true);
        try {
            const { data } = await axios.post('/api/reports/cash/close', {
                date: cashDate,
                opening_cash: Number(openingCash),
                cash_out: Number(cashOut),
                actual_cash: Number(actualCash),
                notes: cashNotes,
            });
            setCashSummary(prev => ({ ...prev, closing: data.data }));
            toast.success('Tutup kas harian tersimpan.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan tutup kas.');
        } finally {
            setSavingCash(false);
        }
    };
    const formatPct = (val) => {
        if (val === 0) return '0%';
        if (val > 0 && val < 1) return '<1%';
        return `${val}%`;
    };

    // Period presets
    const [periodOpen, setPeriodOpen] = useState(false);
    const periodLabel = () => {
        const s = filters.start_date;
        const e = filters.end_date;
        if (!s || !e) return 'Bulan Ini';

        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const today = now.toISOString().split('T')[0];

        if (s === startOfMonth && e === today) return 'Bulan Ini';

        const fmt = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${fmt(s)} — ${fmt(e)}`;
    };

    const applyPeriod = (startDate, endDate) => {
        router.get(route('reports.index'), {
            start_date: startDate,
            end_date: endDate,
        }, { preserveState: true, preserveScroll: true });
        setPeriodOpen(false);
    };

    const presets = () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const prevStart = prevMonth.toISOString().split('T')[0];
        const prevEnd = prevMonthEnd.toISOString().split('T')[0];

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 6);
        const weekStart = weekAgo.toISOString().split('T')[0];

        return [
            { label: 'Hari Ini', start: today, end: today },
            { label: '7 Hari Terakhir', start: weekStart, end: today },
            { label: 'Bulan Ini', start: startOfMonth, end: today },
            { label: 'Bulan Lalu', start: prevStart, end: prevEnd },
        ];
    };

    // Print report
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const roleLabel = (r) => {
        const map = { owner: 'Owner', manager: 'Manager', cashier: 'Kasir' };
        return map[r] || r;
    };

    const handlePrint = () => window.print();

    // Category bar colors (simple rotation)
    const barColors = [
        'bg-blue-500', 'bg-yellow-400', 'bg-emerald-500',
        'bg-sky-500', 'bg-violet-500', 'bg-pink-500',
    ];

    return (
        <AuthenticatedLayout pageTitle={locale === 'en' ? 'Financial Reports' : 'Laporan Keuangan'}>
            <Head title={`${locale === 'en' ? 'Financial Reports' : 'Laporan Keuangan'}`}>
                <meta name="description" content="Laporan dan analisis statistik penjualan, pendapatan, dan produk terlaris Motorku." />
            </Head>

            <style>{`
                #printable-financial-report { display: none; }
                @media print {
                    body * { visibility: hidden !important; }
                    #printable-financial-report, #printable-financial-report * { visibility: visible !important; }
                    #printable-financial-report {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important; top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important; padding: 24px !important;
                        background: #fff !important; color: #0f172a !important;
                        font-family: ui-sans-serif, system-ui, sans-serif !important;
                    }
                }
            `}</style>

            {/* ── SCREEN VIEW ── */}
            {isNavigating ? (
                <ReportSkeleton />
            ) : (
            <div className="space-y-5">

                {/* Toolbar: Period + Export */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setPeriodOpen(!periodOpen)}
                            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                        >
                            <FiCalendar size={14} className="text-slate-400 dark:text-slate-500" />
                            {periodLabel()}
                            <FiChevronDown size={14} className={`text-slate-400 dark:text-slate-500 transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {periodOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setPeriodOpen(false)} />
                                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-40 py-1 min-w-[180px]">
                                    {presets().map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => applyPeriod(p.start, p.end)}
                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                        <FiPrinter size={14} />
                        Cetak Laporan
                    </button>
                </div>

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Cocokkan Kas Harian</h3>
                            <p className="text-xs text-slate-500">Hitung uang fisik setelah transaksi selesai; satu rekap per tanggal.</p>
                        </div>
                        <input type="date" max={today} value={cashDate} onChange={e => setCashDate(e.target.value)} className="rounded-lg border-slate-300 dark:bg-slate-800 text-sm" />
                    </div>
                    {cashSummary ? <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <label>Uang awal (Rp)<input type="number" min="0" value={openingCash} disabled={!!cashSummary.closing} onChange={e => setOpeningCash(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-800" /></label>
                            <div>Penjualan tunai<p className="mt-2 font-bold">{formatRp(cashSummary.closing?.cash_sales ?? cashSummary.cash_sales)}</p></div>
                            <div>Retur tunai<p className="mt-2 font-bold">− {formatRp(cashSummary.closing?.cash_returns ?? cashSummary.cash_returns)}</p></div>
                            <label>Pengeluaran kas (Rp)<input type="number" min="0" value={cashOut} disabled={!!cashSummary.closing} onChange={e => setCashOut(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-800" /></label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                            <div>Seharusnya ada<p className="mt-1 text-lg font-black">{formatRp(cashSummary.closing?.expected_cash ?? expectedCash)}</p></div>
                            <label>Uang fisik terhitung (Rp)<input type="number" min="0" value={actualCash} disabled={!!cashSummary.closing} onChange={e => setActualCash(e.target.value)} className="mt-1 w-full rounded-lg border-slate-300 dark:bg-slate-800" /></label>
                            <div>Selisih<p className={`mt-1 text-lg font-black ${Number(cashSummary.closing?.difference ?? cashDifference) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{cashDifference === null && !cashSummary.closing ? '—' : formatRp(cashSummary.closing?.difference ?? cashDifference)}</p></div>
                        </div>
                        <input type="text" maxLength="255" placeholder="Catatan selisih / pengeluaran (opsional)" value={cashNotes} disabled={!!cashSummary.closing} onChange={e => setCashNotes(e.target.value)} className="w-full rounded-lg border-slate-300 dark:bg-slate-800 text-xs" />
                        {cashSummary.closing ? <p className="text-xs font-bold text-emerald-700">Sudah ditutup. Rekap tersimpan dan tidak dapat diubah; transaksi setelahnya tidak masuk rekap ini.</p> : (
                            <button type="button" onClick={saveCashClosing} disabled={savingCash || actualCash === '' || Number(openingCash) < 0 || Number(cashOut) < 0 || Number(actualCash) < 0} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{savingCash ? 'Menyimpan...' : 'Simpan Tutup Kas'}</button>
                        )}
                    </> : <p className="text-xs text-slate-500">Memuat rekap kas...</p>}
                </section>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        {
                            label: 'Pendapatan Setelah Retur',
                            value: formatRp(totalRevenue),
                            sub: totalRefunds > 0 ? `Retur ${formatRp(totalRefunds)} sudah dikurangi` : null,
                            icon: FiDollarSign,
                            iconBg: 'bg-blue-600 text-white shadow-xs',
                        },
                        {
                            label: 'Total Transaksi',
                            value: `${totalOrders}`,
                            sub: `~${avgOrdersPerDay} pesanan/hari`,
                            icon: FiShoppingBag,
                            iconBg: 'bg-blue-600 text-white shadow-xs',
                        },
                        {
                            label: 'Rata-Rata Order',
                            value: formatRp(avgOrderValue),
                            sub: 'Nilai per transaksi',
                            icon: FiTrendingUp,
                            iconBg: 'bg-yellow-400 text-white shadow-xs',
                        },
                        {
                            label: 'Subtotal Penjualan',
                            value: formatRp(totalSubtotal),
                            sub: 'Sebelum pajak',
                            icon: FiDollarSign,
                            iconBg: 'bg-emerald-600 text-white shadow-xs',
                        },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{kpi.label}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">{kpi.value}</p>
                                    {kpi.sub && <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 truncate">{kpi.sub}</p>}
                                </div>
                                <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                                    <kpi.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Grid: Top Products + Category */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* Top Selling — 3 cols */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Produk Terlaris</h3>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Top 5 berdasarkan porsi terjual</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/60">
                                        <th className="py-2.5 px-4 w-8">#</th>
                                        <th className="py-2.5 px-4">Nama Menu</th>
                                        <th className="py-2.5 px-4">Kategori</th>
                                        <th className="py-2.5 px-4 text-center">Terjual</th>
                                        <th className="py-2.5 px-4 text-right">Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {topSelling.length > 0 ? topSelling.map((item) => (
                                        <tr key={item.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-2.5 px-4 text-slate-400 dark:text-slate-500 font-bold">{item.rank}</td>
                                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="py-2.5 px-4">
                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center font-bold text-blue-600 dark:text-yellow-400">{item.sold}</td>
                                            <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">{formatRp(item.revenue)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                Belum ada data penjualan pada periode ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Category Breakdown — 2 cols */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Penjualan Kotor per Kategori</h3>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                Total {formatRp(categoryBreakdown.reduce((s, c) => s + c.amount, 0))}
                            </p>
                        </div>
                        <div className="p-4 space-y-3">
                            {categoryBreakdown.length > 0 ? categoryBreakdown.map((cat, idx) => (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{formatRp(cat.amount)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${barColors[idx % barColors.length]}`}
                                                style={{ width: `${Math.max(cat.percentage, 0.5)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-8 text-right shrink-0">
                                            {formatPct(cat.percentage)}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-center py-6">Belum ada data.</p>
                            )}
                        </div>

                        {/* Revenue note */}
                        {(totalTax > 0) && (
                            <div className="px-4 pb-3">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
                                    * Kategori dihitung dari subtotal barang sebelum pajak dan retur.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* ── PRINT VIEW ── */}
            <div id="printable-financial-report">
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>MOTORKU</h1>
                            <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0', fontWeight: 600 }}>Sistem Manajemen Toko</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>Laporan Keuangan & Ringkasan Penjualan</h2>
                            <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 0 0' }}>
                                Periode: <strong>{periodLabel()}</strong>
                            </p>
                            <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0' }}>
                                Tanggal Cetak: <strong>{todayFormatted} WIB</strong>
                            </p>
                            <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0' }}>
                                Dicetak Oleh: <strong>{userName}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Print KPI */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Pendapatan Setelah Retur</p>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>{formatRp(totalRevenue)}</p>
                        {totalRefunds > 0 && <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0' }}>Retur dikurangi: {formatRp(totalRefunds)}</p>}
                    </div>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Total Transaksi</p>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>{totalOrders} Pesanan</p>
                        <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0' }}>~{avgOrdersPerDay} pesanan/hari ({daysInRange} hari)</p>
                    </div>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Rata-Rata Order (AOV)</p>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>{formatRp(avgOrderValue)}</p>
                    </div>
                </div>

                {/* Print Category */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>1. Penjualan Kotor per Kategori</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700' }}>Kategori Produk</th>
                                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700' }}>Kontribusi</th>
                                <th style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>Penjualan Kotor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryBreakdown.map((cat, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px', fontWeight: '600', color: '#1e293b' }}>{cat.name}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#0284c7' }}>{formatPct(cat.percentage)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>{formatRp(cat.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p style={{ fontSize: '9px', color: '#94a3b8', margin: '4px 0 0 0' }}>* Subtotal barang sebelum pajak dan retur.</p>
                </div>

                {/* Print Top Products */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>2. Produk Terlaris (Sebelum Retur)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700', width: '40px' }}>No</th>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700' }}>Nama Produk</th>
                                <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700' }}>Kategori</th>
                                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700' }}>Unit Terjual</th>
                                <th style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>Total Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topSelling.length > 0 ? topSelling.map((item) => (
                                <tr key={item.rank} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>{item.rank}</td>
                                    <td style={{ padding: '8px', fontWeight: '700', color: '#0f172a' }}>{item.name}</td>
                                    <td style={{ padding: '8px', color: '#475569' }}>{item.category}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: '800', color: '#2563eb' }}>{item.sold} unit</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>{formatRp(item.revenue)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data transaksi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Print Footer */}
                <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <div style={{ textAlign: 'center', width: '180px' }}>
                            <p style={{ color: '#475569', margin: '0 0 50px 0' }}>Dibuat Oleh,</p>
                            <p style={{ fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #94a3b8', paddingBottom: '2px', margin: 0 }}>{userName}</p>
                            <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0' }}>{roleLabel(userRole)}</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '180px' }}>
                            <p style={{ color: '#475569', margin: '0 0 50px 0' }}>Disetujui Oleh,</p>
                            <p style={{ fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #94a3b8', paddingBottom: '2px', margin: 0 }}>( Manager / Owner )</p>
                            <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0' }}>Motorku Management</p>
                        </div>
                    </div>
                    <p style={{ fontSize: '9px', textAlign: 'center', color: '#94a3b8', marginTop: '24px' }}>
                        *** Dokumen ini dicetak otomatis dari Sistem POS Motorku pada {todayFormatted} ***
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
