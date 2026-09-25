import React, { useEffect, useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    FiSearch, 
    FiEye, 
    FiEdit2, 
    FiPrinter, 
    FiRefreshCw,
    FiChevronLeft, 
    FiChevronRight,
    FiClock, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiXCircle
} from 'react-icons/fi';

export default function OrderIndex({ initialOrders = {}, summary = {}, filters = {} }) {
    const { auth, app_settings } = usePage().props;
    const locale = app_settings?.locale || 'id';
    const userName = auth?.user?.name || 'Kasir';
    // auth.roles is a flat string array (e.g. ['owner']) shared by HandleInertiaRequests
    const userRole = (auth?.roles ?? []).includes('owner') ? 'Owner' : 'Kasir';

    const extractPaginator = (data) => {
        if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
            return data;
        }
        const list = Array.isArray(data) ? data : [];
        return { data: list, current_page: 1, last_page: 1, total: list.length, per_page: 10 };
    };

    const paginator = extractPaginator(initialOrders);
    const [orders, setOrders] = useState(() => paginator.data);
    const [statusFilter, setStatusFilter] = useState(filters.status || 'All');
    const [dateFilter, setDateFilter] = useState(filters.date || 'all');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [printOrderData, setPrintOrderData] = useState(null);
    const [isPrintingId, setIsPrintingId] = useState(null);

    const initialSummaryProp = summary && Object.keys(summary).length > 0 ? summary : (usePage().props.summary || {});
    const [localSummary, setLocalSummary] = useState(initialSummaryProp);

    useEffect(() => {
        const propSummary = summary && Object.keys(summary).length > 0 ? summary : (usePage().props.summary || {});
        if (propSummary && Object.keys(propSummary).length > 0) {
            setLocalSummary(propSummary);
        }
    }, [summary, usePage().props.summary]);

    const handlePrintOrder = async (order) => {
        const orderId = order.real_id || order.id;
        setIsPrintingId(orderId);
        try {
            const res = await axios.get(`/api/orders/${orderId}`);
            setPrintOrderData(res.data);
            setTimeout(() => {
                window.print();
            }, 150);
        } catch (err) {
            toast.error('Gagal mengambil data struk pesanan: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsPrintingId(null);
        }
    };

    useEffect(() => {
        setOrders(extractPaginator(initialOrders).data);
    }, [initialOrders]);

    const currentPage = paginator.current_page || 1;
    const totalPages = paginator.last_page || 1;
    const totalItems = paginator.total ?? orders.length;
    const perPage = paginator.per_page || 10;

    const changePage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        router.get('/orders', {
            page: newPage,
            status: statusFilter,
            date: statusFilter === 'All' && dateFilter !== 'all' ? dateFilter : undefined,
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        if (newStatus === 'action') setDateFilter('all');
        router.get('/orders', {
            page: 1,
            status: newStatus,
            date: newStatus === 'All' && dateFilter !== 'all' ? dateFilter : undefined,
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleDateFilterChange = (newDate) => {
        setDateFilter(newDate);
        router.get('/orders', {
            page: 1,
            status: statusFilter,
            date: newDate !== 'all' ? newDate : undefined,
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    // Search di-debounce → refetch dari server agar mencari SEMUA pesanan (lintas halaman).
    // Filter diambil via ref agar pencarian memakai pilihan terbaru tanpa double-refetch.
    const statusFilterRef = useRef(statusFilter);
    const dateFilterRef = useRef(dateFilter);
    useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
    useEffect(() => { dateFilterRef.current = dateFilter; }, [dateFilter]);

    const isFirstSearchRender = useRef(true);
    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/orders', {
                page: 1,
                status: statusFilterRef.current,
                date: statusFilterRef.current === 'All' && dateFilterRef.current !== 'all' ? dateFilterRef.current : undefined,
                search: searchQuery || undefined,
            }, { preserveState: true, preserveScroll: true });
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const refreshOrders = () => router.get('/orders', {
        page: currentPage,
        status: statusFilter,
        date: statusFilter === 'All' && dateFilter !== 'all' ? dateFilter : undefined,
        search: searchQuery || undefined,
    }, { preserveState: true, preserveScroll: true });

    // Keyboard shortcut (Ctrl+F or Cmd+F) to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('order-search-input');
                if (searchInput) searchInput.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const statusConfig = {
        pending:    { label: 'Diterima',     icon: FiClock,        color: 'bg-slate-600 text-white' },
        processing: { label: 'Disiapkan',    icon: FiAlertCircle,  color: 'bg-yellow-400 text-white' },
        preparing:  { label: 'Disiapkan',    icon: FiAlertCircle,  color: 'bg-yellow-400 text-white' },
        ready:      { label: 'Siap Diambil', icon: FiCheckCircle,  color: 'bg-emerald-600 text-white' },
        completed:  { label: 'Selesai',      icon: FiCheckCircle,  color: 'bg-blue-600 text-white' },
        cancelled:  { label: 'Dibatalkan',   icon: FiXCircle,      color: 'bg-rose-600 text-white' },
    };

    const getStatusDisplay = (orderStatus, paymentStatus, returnedAmount = 0) => {
        const isPaid = paymentStatus === 'paid';

        if (paymentStatus === 'refunded') {
            return {
                primary: { label: 'Retur Penuh', color: 'bg-amber-600 text-white', icon: FiCheckCircle },
                secondary: null,
                tooltip: 'Semua barang pada pesanan ini telah diretur',
            };
        }

        if (orderStatus === 'completed') {
            return {
                primary: { label: 'Selesai', color: 'bg-blue-600 text-white', icon: FiCheckCircle },
                secondary: returnedAmount > 0 ? { label: 'RETUR SEBAGIAN', color: 'bg-amber-600 text-white' } : null,
                tooltip: 'Pesanan telah selesai disajikan dan dibayar',
            };
        }

        if (orderStatus === 'cancelled') {
            return {
                primary: { label: 'Dibatalkan', color: 'bg-rose-600 text-white', icon: FiXCircle },
                secondary: null,
                tooltip: 'Pesanan dibatalkan',
            };
        }

        if (orderStatus === 'pending') {
            if (isPaid) {
                return {
                    primary: { label: 'Siap diproses', color: 'bg-slate-600 text-white', icon: FiClock },
                    secondary: { label: 'LUNAS', color: 'bg-emerald-600 text-white shadow-2xs' },
                    tooltip: 'Pembayaran sudah diterima, pesanan menunggu diproses',
                };
            }
            return {
                primary: { label: 'Konfirmasi bayar', color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200', icon: FiClock },
                secondary: null,
                tooltip: 'Pastikan pembayaran diterima sebelum pesanan diproses',
            };
        }

        if (orderStatus === 'preparing' || orderStatus === 'processing') {
            return {
                primary: { label: 'Diproses', color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200', icon: FiAlertCircle },
                secondary: isPaid
                    ? { label: 'LUNAS', color: 'bg-emerald-600 text-white shadow-2xs' }
                    : { label: 'BELUM BAYAR', color: 'bg-amber-500 text-white shadow-2xs' },
                tooltip: isPaid ? 'Pesanan sedang diproses dan sudah lunas' : 'Pesanan sedang diproses',
            };
        }

        if (orderStatus === 'ready') {
            return {
                primary: { label: 'Siap', color: 'bg-emerald-600 text-white', icon: FiCheckCircle },
                secondary: isPaid
                    ? { label: 'LUNAS', color: 'bg-emerald-600 text-white shadow-2xs' }
                    : { label: 'BELUM BAYAR', color: 'bg-amber-500 text-white shadow-2xs' },
                tooltip: isPaid ? 'Pesanan siap disajikan dan sudah lunas' : 'Pesanan siap disajikan',
            };
        }

        return {
            primary: { label: orderStatus || 'Menunggu', color: 'bg-slate-600 text-white', icon: FiClock },
            secondary: isPaid
                ? { label: 'LUNAS', color: 'bg-emerald-600 text-white shadow-2xs' }
                : { label: 'BELUM BAYAR', color: 'bg-amber-500 text-white shadow-2xs' },
            tooltip: '',
        };
    };

    const statuses = ['action', 'All'];
    const statusLabel = (status) => status === 'action' ? 'Perlu Ditangani' : 'Semua Transaksi';

    const PENDING_BUCKET = ['pending'];
    const PROCESSING_BUCKET = ['preparing', 'processing'];

    const handleUpdateStatus = async (order, nextStatus) => {
        if (nextStatus !== 'cancelled' && order.payment_status !== 'paid') {
            toast.error('Pesanan belum dibayar. Terima pembayaran terlebih dahulu sebelum memproses pesanan.');
            return;
        }

        const orderId = order.real_id || order.id;
        const prevStatus = order.status;
        const prevSummary = { ...localSummary };

        // 1. OPTIMISTIC UPDATE: Baris Tabel
        setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => (o.real_id || o.id) === orderId ? { ...o, status: nextStatus } : o));

        // 2. OPTIMISTIC UPDATE: Summary Cards (Pendekatan Bucket Tergeneralisasi)
        setLocalSummary(prev => {
            const next = { ...prev };
            const wasPending = PENDING_BUCKET.includes(prevStatus);
            const isPending = PENDING_BUCKET.includes(nextStatus);
            const wasProcessing = PROCESSING_BUCKET.includes(prevStatus);
            const isProcessing = PROCESSING_BUCKET.includes(nextStatus);

            if (wasPending && !isPending) {
                next.pending_count = Math.max(0, (next.pending_count || 0) - 1);
            }
            if (!wasPending && isPending) {
                next.pending_count = (next.pending_count || 0) + 1;
            }
            if (!wasProcessing && isProcessing) {
                next.processing_count = (next.processing_count || 0) + 1;
            }
            if (wasProcessing && !isProcessing) {
                next.processing_count = Math.max(0, (next.processing_count || 0) - 1);
            }
            if (prevStatus === 'ready' && nextStatus === 'completed') {
                next.active_count = Math.max(0, (next.active_count || 0) - 1);
            }
            return next;
        });

        setUpdatingStatusId(orderId);

        try {
            await axios.patch(`/api/orders/${orderId}/status`, { status: nextStatus });
            const nextLabel = statusConfig[nextStatus]?.label || nextStatus;
            toast.success(`Status pesanan ${order.id} diubah ke ${nextLabel}`);
            refreshOrders();
        } catch (err) {
            // 3. ROLLBACK GANDA JIKA GAGAL (Baris Tabel & Card Summary)
            setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => (o.real_id || o.id) === orderId ? { ...o, status: prevStatus } : o));
            setLocalSummary(prevSummary);

            toast.error('Gagal mengubah status pesanan: ' + (err.response?.data?.message || err.message));
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const openPayment = (order) => {
        setPaymentOrder(order);
        setPaymentMethod('cash');
        setAmountReceived(String(order.total));
    };

    const confirmPayment = async () => {
        if (!paymentOrder) return;

        const received = paymentMethod === 'cash' ? Number(amountReceived) : Number(paymentOrder.total);
        if (!Number.isFinite(received) || received < Number(paymentOrder.total)) {
            toast.error('Nominal pembayaran kurang dari total tagihan.');
            return;
        }

        setIsProcessingPayment(true);
        try {
            const response = await axios.post('/api/payments', {
                order_id: paymentOrder.real_id || paymentOrder.id,
                payment_method: paymentMethod,
                amount_received: received,
                notes: `Pembayaran dikonfirmasi kasir - ${paymentMethod.toUpperCase()}`,
            });
            const payment = response.data?.data;
            setOrders(prev => (Array.isArray(prev) ? prev : []).map(order => order.id === paymentOrder.id ? {
                ...order,
                status: payment?.order?.order_status || order.status,
                payment_status: 'paid',
                paid_at: payment?.paid_at || new Date().toISOString(),
            } : order));
            
            if (app_settings?.auto_print_receipt) {
                handlePrintOrder(paymentOrder);
            }
            
            setPaymentOrder(null);
            toast.success('Pembayaran diterima. Pendapatan sudah masuk dashboard dan laporan.');
        } catch (err) {
            toast.error('Gagal memproses pembayaran: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const safeOrdersList = Array.isArray(orders) ? orders : [];
    const pageOrders = safeOrdersList;

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

    const summaryData = localSummary && Object.keys(localSummary).length > 0 ? localSummary : (summary && Object.keys(summary).length > 0 ? summary : (usePage().props.summary || {}));

    const todayOrderCount = summaryData.today_order_count ?? totalItems;
    const todayOrderValue = summaryData.today_order_value ?? 0;
    const activeCount = summaryData.active_count ?? 0;

    const getNextStatusAction = (order) => {
        if (order.status === 'pending') return { nextStatus: 'preparing', label: 'Proses' };
        if (order.status === 'preparing' || order.status === 'processing') return { nextStatus: 'ready', label: 'Siap' };
        if (order.status === 'ready') return { nextStatus: 'completed', label: 'Selesai' };
        return null;
    };

    const cleanUserName = (auth?.user?.name || 'Kasir').replace(/\s*\(.*?\)/g, '');

    return (
        <AuthenticatedLayout pageTitle={locale === 'en' ? 'Orders List' : 'Daftar Pesanan'}>
            <Head title={`${locale === 'en' ? 'Orders List' : 'Daftar Pesanan'}`}>
                <meta name="description" content="Kelola dan pantau seluruh daftar pesanan pelanggan Motorku secara real-time." />
            </Head>

            <div className="mx-auto w-full max-w-[1440px] space-y-3 p-2 sm:space-y-4 sm:p-5">

                <div className="sm:hidden px-1 py-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span>Hari ini</span>
                        <strong className="text-sm text-slate-900 dark:text-white">{todayOrderCount} pesanan</strong>
                        <strong className="ml-auto text-sm text-slate-900 dark:text-white">{formatRp(todayOrderValue)}</strong>
                    </div>
                    <div className="mt-1">Perlu ditangani <strong className="text-slate-900 dark:text-white">{activeCount}</strong></div>
                </div>

                {/* Desktop summary */}
                <div className="hidden sm:flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-slate-200 dark:border-slate-800 px-1 pb-3 text-sm text-slate-500 dark:text-slate-400">
                    <span>Hari ini <strong className="ml-1 text-slate-900 dark:text-white">{todayOrderCount} pesanan</strong></span>
                    <span>Nilai <strong className="ml-1 text-slate-900 dark:text-white">{formatRp(todayOrderValue)}</strong></span>
                    <span>Perlu ditangani <strong className="ml-1 text-slate-900 dark:text-white">{activeCount}</strong></span>
                </div>

                {/* Main Transaction Panel */}
                <div className="bg-white dark:bg-slate-900 sm:rounded-xl sm:shadow-2xs sm:border sm:border-slate-200/80 dark:sm:border-slate-800 overflow-hidden transition-colors">
                    
                    {/* Unified Control Bar */}
                    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 sm:gap-3 sm:bg-slate-50/50 dark:sm:bg-slate-800/50">
                        <div className="flex w-full items-center justify-between gap-2 lg:w-auto">
                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white shrink-0">Pesanan</h3>
                            <button type="button" onClick={refreshOrders} aria-label="Muat ulang pesanan" title="Muat ulang pesanan" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                                <FiRefreshCw size={15} />
                            </button>
                        </div>
                        
                        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                            {/* Filter Tabs */}
                            <div className="hidden sm:flex min-w-0 max-w-full items-center gap-1 overflow-x-auto no-scrollbar">
                                {statuses.map(s => {
                                    const isActive = statusFilter === s;
                                    const label = statusLabel(s);
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => handleFilterChange(s)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                                isActive 
                                                    ? 'bg-blue-600 text-white shadow-2xs' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                aria-label="Filter status pesanan"
                                className="sm:hidden w-40 shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400"
                            >
                                {statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                            </select>

                            {/* Search Input */}
                            <div className="relative order-first w-full min-w-0 sm:order-none sm:w-64 lg:w-72">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
                                <input
                                    id="order-search-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nomor, pelanggan, atau barang..."
                                    className="w-full min-w-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-slate-400 dark:focus:border-slate-500 transition-all"
                                />
                            </div>

                            {statusFilter === 'All' && <select
                                value={dateFilter}
                                onChange={(e) => handleDateFilterChange(e.target.value)}
                                aria-label="Filter tanggal pesanan"
                                className="w-32 shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 focus:border-slate-400"
                            >
                                <option value="all">Semua tanggal</option>
                                <option value="today">Hari ini</option>
                                <option value="week">7 hari terakhir</option>
                            </select>}
                        </div>
                    </div>

                    {/* Mobile order list */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {pageOrders.map(order => {
                            if (!order) return null;
                            const display = getStatusDisplay(order.status, order.payment_status, Number(order.returned_amount || 0));
                            const StatusIcon = display.primary.icon;
                            const nextAction = getNextStatusAction(order);
                            const orderId = order.real_id || order.id;

                            return (
                                <article key={orderId} className="px-3 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link href={`/orders/${orderId}`} className="block truncate font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{order.id}</Link>
                                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">{order.customer}</p>
                                        </div>
                                        <strong className="shrink-0 text-sm text-slate-900 dark:text-white">{formatRp(order.total)}</strong>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{order.channel} · {order.date} · {order.time} · {order.items} item</p>
                                    {order.matching_item && <p className="mt-0.5 truncate text-[11px] text-blue-700 dark:text-blue-300">Barang: {order.matching_item}</p>}
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5" title={display.tooltip}>
                                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${display.primary.color}`}>
                                            <StatusIcon size={12} />{display.primary.label}
                                        </span>
                                        {display.secondary && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${display.secondary.color}`}>{display.secondary.label}</span>}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs font-bold">
                                        <Link href={`/orders/${orderId}`} className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">Detail <FiChevronRight size={14} /></Link>
                                        <div className="ml-auto flex items-center gap-2">
                                            {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                                                <button type="button" onClick={() => openPayment(order)} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-white">Konfirmasi Bayar</button>
                                            )}
                                            {order.payment_status === 'paid' && nextAction && (
                                                <button type="button" onClick={() => handleUpdateStatus(order, nextAction.nextStatus)} disabled={updatingStatusId === orderId} className="rounded-md bg-blue-600 px-2.5 py-1.5 text-white disabled:opacity-50">{nextAction.label}</button>
                                            )}
                                            <button type="button" onClick={() => handlePrintOrder(order)} disabled={isPrintingId === orderId} aria-label={`Cetak struk ${order.id}`} className="p-1.5 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                                                <FiPrinter size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                        {pageOrders.length === 0 && <p className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">{statusFilter === 'action' ? 'Belum ada pesanan yang perlu ditangani.' : 'Tidak ada transaksi yang sesuai.'}</p>}
                    </div>

                    {/* Desktop data table */}
                    <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)] no-scrollbar">
                        <table className="w-full min-w-[840px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                                    <th className="px-3.5 py-2.5">PESANAN</th>
                                    <th className="px-3.5 py-2.5">PELANGGAN</th>
                                    <th className="px-3.5 py-2.5">ITEM</th>
                                    <th className="px-3.5 py-2.5">TOTAL</th>
                                    <th className="px-3.5 py-2.5">STATUS</th>
                                    <th className="px-3.5 py-2.5 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                                {pageOrders.map(order => {
                                    if (!order) return null;
                                    const nextAction = getNextStatusAction(order);

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                            {/* ID and time */}
                                            <td className="px-3.5 py-2.5">
                                                <span className="block whitespace-nowrap font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{order.id}</span>
                                                <span className="mt-0.5 block whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">{order.channel} · {order.date} · {order.time}</span>
                                            </td>
                                            
                                            {/* PELANGGAN */}
                                            <td className="px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {order.customer}
                                                {order.matching_item && <span className="mt-0.5 block truncate text-[11px] font-medium text-blue-700 dark:text-blue-300">Barang: {order.matching_item}</span>}
                                            </td>
                                            
                                            {/* JUMLAH ITEM */}
                                            <td className="px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">{order.items} item</td>

                                            {/* TOTAL TAGIHAN */}
                                            <td className="px-3.5 py-2.5 font-black text-slate-900 dark:text-white text-xs">
                                                {formatRp(order.total)}
                                            </td>

                                             {/* STATUS PESANAN */}
                                             <td className="px-3.5 py-2.5">
                                                 {(() => {
                                                     const display = getStatusDisplay(order.status, order.payment_status, Number(order.returned_amount || 0));
                                                     const PrimaryIcon = display.primary.icon;
                                                     return (
                                                         <div className="flex items-center gap-1.5" title={display.tooltip}>
                                                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${display.primary.color}`}>
                                                                 <PrimaryIcon size={12} />
                                                                 {display.primary.label}
                                                             </span>
                                                             {display.secondary && (
                                                                 <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-wider ${display.secondary.color}`}>
                                                                     {display.secondary.label}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     );
                                                 })()}
                                             </td>

                                            {/* AKSI */}
                                            <td className="px-3.5 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Highlighted Konfirmasi Pembayaran Button for Unpaid Orders */}
                                                    {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => openPayment(order)}
                                                            className="px-2.5 py-1 text-[11px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-2xs rounded-lg border border-emerald-500 transition-all animate-pulse cursor-pointer shrink-0"
                                                            title="Konfirmasi Pembayaran Kasir"
                                                        >
                                                            Konfirmasi Bayar
                                                        </button>
                                                    )}

                                                    {/* View Details */}
                                                    <Link 
                                                        href={`/orders/${order.real_id || order.id}`}
                                                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors inline-flex"
                                                        title="Lihat Detail Pesanan"
                                                    >
                                                        <FiEye size={15} />
                                                    </Link>

                                                    {/* Status Action / Edit */}
                                                    {order.payment_status === 'paid' && nextAction && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order, nextAction.nextStatus)}
                                                            disabled={updatingStatusId === (order.real_id || order.id)}
                                                            className="p-1.5 text-blue-600 dark:text-yellow-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors inline-flex disabled:opacity-50"
                                                            title={`Ubah status ke ${nextAction.label}`}
                                                        >
                                                            <FiEdit2 size={15} />
                                                        </button>
                                                    )}

                                                    {/* Print Receipt */}
                                                    <button
                                                        onClick={() => handlePrintOrder(order)}
                                                        disabled={isPrintingId === (order.real_id || order.id)}
                                                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors inline-flex disabled:opacity-50 cursor-pointer"
                                                        title="Cetak Struk"
                                                    >
                                                        <FiPrinter size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pageOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-semibold">
                                            {statusFilter === 'action' ? 'Belum ada pesanan yang perlu ditangani.' : 'Tidak ada transaksi yang sesuai.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Standardized Table Pagination Footer */}
                    <div className="p-2.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span className="min-w-0">
                            <span className="sm:hidden">{totalItems > 0 ? `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, totalItems)}` : '0'} / {totalItems}</span>
                            <span className="hidden sm:inline">{totalItems > 0 ? `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, totalItems)}` : '0'} dari {totalItems} pesanan</span>
                        </span>

                        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                aria-label="Halaman sebelumnya"
                                className="p-1.5 sm:px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 sm:shadow-2xs text-xs"
                            >
                                <FiChevronLeft size={14} strokeWidth={2.5} />
                                <span className="hidden sm:inline">Sebelumnya</span>
                            </button>
                            
                            <span className="px-1.5 sm:px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                aria-label="Halaman selanjutnya"
                                className="p-1.5 sm:px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1 sm:shadow-2xs text-xs"
                            >
                                <span className="hidden sm:inline">Selanjutnya</span>
                                <FiChevronRight size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Modal */}
            {paymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Konfirmasi Pembayaran</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{paymentOrder.id} · {paymentOrder.customer}</p>
                        <p className="mt-4 text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatRp(paymentOrder.total)}</p>

                        <div className="mt-5 space-y-4">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Metode pembayaran: Tunai</p>

                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Nominal diterima
                                <input
                                    type="number"
                                    min={paymentOrder.total}
                                    value={paymentMethod === 'cash' ? amountReceived : paymentOrder.total}
                                    onChange={(event) => setAmountReceived(event.target.value)}
                                    disabled={paymentMethod !== 'cash'}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2.5 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-850 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </label>

                            {paymentMethod === 'cash' && Number(amountReceived) >= Number(paymentOrder.total) && (
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    Kembalian: {formatRp(Number(amountReceived) - Number(paymentOrder.total))}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setPaymentOrder(null)}
                                disabled={isProcessingPayment}
                                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmPayment}
                                disabled={isProcessingPayment}
                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300 shadow-xs"
                            >
                                {isProcessingPayment ? 'Memproses...' : 'Konfirmasi Lunas'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* THERMAL PRINTABLE RECEIPT TEMPLATE FOR ORDER LIST */}
            {printOrderData && (
                <div id="thermal-printable-receipt" className="hidden">
                    <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                        <h2 className="font-bold text-sm uppercase tracking-wider">{app_settings?.store_name || 'MOTORKU'}</h2>
                        <p className="text-[10px]">{app_settings?.store_name || 'Motorku'}</p>
                        {app_settings?.store_address && <p className="text-[9px]">{app_settings.store_address}</p>}
                        {app_settings?.store_phone && <p className="text-[9px]">Telp: {app_settings.store_phone}</p>}
                    </div>

                    <div className="py-1 border-b border-dashed border-black text-[10px] space-y-0.5 mb-2">
                        <div className="flex justify-between">
                            <span>No. Struk:</span>
                            <span className="font-bold">{printOrderData.order_number || 'ORD-POS'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Waktu:</span>
                            <span>{printOrderData.created_at ? new Date(printOrderData.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Pelanggan:</span>
                            <span className="font-bold">{printOrderData.customer_name || 'Walk-in Guest'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tipe Order:</span>
                            <span>Ambil di Toko</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kasir:</span>
                            <span>{printOrderData.cashier?.name || userName}</span>
                        </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="py-1 border-b border-dashed border-black text-[10px] mb-2">
                        <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
                            <span>Item</span>
                            <span>Total</span>
                        </div>
                        {printOrderData.items?.map((item, idx) => (
                            <div key={idx} className="mb-1">
                                <div className="flex justify-between font-bold">
                                    <span>{item.product_name || item.name} x{item.quantity}</span>
                                    <span>Rp {(Number(item.subtotal) || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="text-[9px] text-gray-600 pl-1">
                                    @ Rp {(Number(item.unit_price) || 0).toLocaleString('id-ID')} {item.notes ? `(${item.notes})` : ''}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FINANCIAL TOTALS */}
                    <div className="py-1 border-b border-dashed border-black text-[10px] space-y-0.5 mb-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rp {(Number(printOrderData.subtotal) || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {Number(printOrderData.tax_amount) > 0 && (
                            <div className="flex justify-between">
                                <span>Pajak</span>
                                <span>Rp {(Number(printOrderData.tax_amount) || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-[12px] pt-1 border-t border-black">
                            <span>TOTAL TAGIHAN</span>
                            <span>Rp {(Number(printOrderData.total) || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span>Status Bayar:</span>
                            <span className="font-bold uppercase">{printOrderData.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</span>
                        </div>
                        {printOrderData.payments && printOrderData.payments.length > 0 && (
                            <>
                                <div className="flex justify-between">
                                    <span>Metode Bayar:</span>
                                    <span className="font-bold uppercase">{printOrderData.payments[0].payment_method}</span>
                                </div>
                                {printOrderData.payments[0].payment_method === 'cash' && printOrderData.payments[0].amount_received != null && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Uang Diterima:</span>
                                            <span>Rp {(Number(printOrderData.payments[0].amount_received) || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span>Kembalian:</span>
                                            <span>Rp {(Number(printOrderData.payments[0].change_amount) || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="pt-2 text-center text-[9px] space-y-0.5">
                        <p className="font-bold">*** TERIMA KASIH ***</p>
                        <p>Terima kasih sudah berbelanja di Motorku</p>
                        <p>Simpan Struk Ini Sebagai Bukti Pembayaran</p>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
