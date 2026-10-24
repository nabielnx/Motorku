import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import Pagination from '@/Components/Pagination';
import ThermalReceipt from '@/Components/ThermalReceipt';
import MoneyInput from '@/Components/MoneyInput';
import React, { useEffect, useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import OrderTableSkeleton from '@/Components/Skeletons/OrderTableSkeleton';
import OrderToolbar from '@/Components/Orders/OrderToolbar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    FiEye,
    FiEdit2,
    FiPrinter,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiXCircle,
} from 'react-icons/fi';

export default function OrderIndex({ initialOrders = {}, summary = {}, filters = {} }) {
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
            if (targetPath && targetPath.startsWith('/orders')) {
                setIsNavigating(true);
            }
        });
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    const { auth, app_settings, summary: sharedSummary } = usePage().props;
    const locale = app_settings?.locale || 'id';
    const userName = auth?.user?.name || 'Kasir';

    const extractPaginator = (data) => {
        if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
            return data;
        }
        const list = Array.isArray(data) ? data : [];
        return { data: list, current_page: 1, last_page: 1, total: list.length, per_page: 10 };
    };

    const paginator = extractPaginator(initialOrders);
    const [orders, setOrders] = useState(() => paginator.data);
    const ordersSourceRef = useRef(initialOrders);
    const orderScrollRef = useRef(null);
    const statusFilter = filters.status || 'All';
    const periodFilter = filters.period || (filters.date === 'week' ? '7_days' : (filters.date || 'all'));
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [isRevenueVisible, setIsRevenueVisible] = useState(false);
    const [showDateFilters, setShowDateFilters] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [fundsChecked, setFundsChecked] = useState(false);
    const [paymentReference, setPaymentReference] = useState('');
    const [rejectingReview, setRejectingReview] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [amountReceived, setAmountReceived] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [printOrderData, setPrintOrderData] = useState(null);
    const [isPrintingId, setIsPrintingId] = useState(null);

    const initialSummaryProp = summary && Object.keys(summary).length > 0 ? summary : (sharedSummary || {});
    const [localSummary, setLocalSummary] = useState(initialSummaryProp);

    useEffect(() => {
        const propSummary = summary && Object.keys(summary).length > 0 ? summary : (sharedSummary || {});
        if (propSummary && Object.keys(propSummary).length > 0) {
            setLocalSummary(propSummary);
        }
    }, [summary, sharedSummary]);

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
        ordersSourceRef.current = initialOrders;
        setOrders(extractPaginator(initialOrders).data);
    }, [initialOrders]);

    const currentPage = paginator.current_page || 1;
    const totalPages = paginator.last_page || 1;
    const totalItems = paginator.total ?? orders.length;
    const perPage = paginator.per_page || 10;

    useEffect(() => {
        if (orderScrollRef.current) orderScrollRef.current.scrollTop = 0;
    }, [currentPage, statusFilter, periodFilter, filters.start_date, filters.end_date, filters.search]);

    const periodFilterRef = useRef(periodFilter);
    const startDateRef = useRef(startDate);
    const endDateRef = useRef(endDate);
    useEffect(() => { periodFilterRef.current = periodFilter; }, [periodFilter]);
    useEffect(() => { startDateRef.current = startDate; }, [startDate]);
    useEffect(() => { endDateRef.current = endDate; }, [endDate]);
    useEffect(() => {
        setStartDate(filters.start_date || '');
        setEndDate(filters.end_date || '');
    }, [filters.start_date, filters.end_date]);

    const dateParams = (targetStatus = statusFilter, targetPeriod = periodFilterRef.current, start = startDateRef.current, end = endDateRef.current) => (
        targetStatus !== 'All' || targetPeriod === 'all'
            ? {}
            : { period: targetPeriod, ...(targetPeriod === 'custom' ? { start_date: start || undefined, end_date: end || undefined } : {}) }
    );

    const changePage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        router.get('/orders', {
            page: newPage,
            status: statusFilter,
            ...dateParams(),
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true, showProgress: false });
    };

    const handleFilterChange = (newStatus) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        statusFilterRef.current = newStatus;
        if (newStatus === 'action') {
            periodFilterRef.current = 'all';
            startDateRef.current = '';
            endDateRef.current = '';
            setStartDate('');
            setEndDate('');
        }
        router.get('/orders', {
            page: 1,
            status: newStatus,
            ...dateParams(newStatus),
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true, showProgress: false });
    };

    const handlePeriodChange = (newPeriod) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        periodFilterRef.current = newPeriod;
        setShowDateFilters(false);
        router.get('/orders', {
            page: 1,
            status: statusFilter,
            ...dateParams(statusFilter, newPeriod, '', ''),
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true, showProgress: false });
    };

    const handleApplyDateRange = (start, end) => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        periodFilterRef.current = 'custom';
        setShowDateFilters(false);
        startDateRef.current = start;
        endDateRef.current = end;
        setStartDate(start);
        setEndDate(end);
        router.get('/orders', {
            page: 1,
            status: statusFilter,
            ...dateParams(statusFilter, 'custom', start, end),
            search: searchQuery || undefined,
        }, { preserveState: true, preserveScroll: true, showProgress: false });
    };

    // Search di-debounce → refetch dari server agar mencari SEMUA pesanan (lintas halaman).
    // Filter diambil via ref agar pencarian memakai pilihan terbaru tanpa double-refetch.
    const statusFilterRef = useRef(statusFilter);
    const searchTimerRef = useRef(null);
    useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);

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
                ...dateParams(statusFilterRef.current),
                search: searchQuery || undefined,
            }, { preserveState: true, preserveScroll: true, showProgress: false });
        }, 400);
        searchTimerRef.current = t;
        return () => clearTimeout(t);
    }, [searchQuery]);

    const refreshOrders = () => router.get('/orders', {
        page: currentPage,
        status: statusFilter,
        ...dateParams(),
        search: searchQuery || undefined,
    }, { preserveState: true, preserveScroll: true, showProgress: false });

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
        processing: { label: 'Disiapkan',    icon: FiAlertCircle,  color: 'bg-accentYellow text-primaryDark' },
        preparing:  { label: 'Disiapkan',    icon: FiAlertCircle,  color: 'bg-accentYellow text-primaryDark' },
        ready:      { label: 'Siap Diambil', icon: FiCheckCircle,  color: 'bg-emerald-600 text-white' },
        completed:  { label: 'Selesai',      icon: FiCheckCircle,  color: 'bg-blue-600 text-white' },
        cancelled:  { label: 'Dibatalkan',   icon: FiXCircle,      color: 'bg-rose-600 text-white' },
    };

    const getStatusDisplay = (orderStatus, paymentStatus, returnedAmount = 0, review = false) => {
        if (review && paymentStatus === 'unpaid' && orderStatus === 'pending') return { primary: { label: 'Periksa QRIS', color: 'bg-accentYellow text-primaryDark', icon: FiClock }, secondary: null, tooltip: 'Pelanggan melaporkan sudah membayar; periksa dana masuk' };
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
                primary: { label: 'Selesai', color: 'text-primaryDark dark:text-blue-300', icon: FiCheckCircle, plain: true },
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
                primary: { label: 'Konfirmasi bayar', color: 'bg-accentYellow text-primaryDark', icon: FiClock },
                secondary: null,
                tooltip: 'Pastikan pembayaran diterima sebelum pesanan diproses',
            };
        }

        if (orderStatus === 'preparing' || orderStatus === 'processing') {
            return {
                primary: { label: 'Diproses', color: 'bg-accentYellow text-primaryDark', icon: FiAlertCircle },
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
        if (app_settings?.cash_enabled === false && !app_settings?.customer_qris_enabled && !order.payment_review_requested_at) {
            toast.error('Metode pembayaran belum tersedia. Hubungi owner.');
            return;
        }
        setPaymentOrder(order);
        setPaymentMethod(order.payment_review_requested_at || (order.payment_preference === 'qris' && app_settings?.customer_qris_enabled) || app_settings?.cash_enabled === false ? 'qris_manual' : 'cash');
        setAmountReceived(String(order.total));
        setFundsChecked(false);
        setPaymentReference(order.payment_reference || '');
        setRejectingReview(false);
        setRejectionReason('');
    };

    const rejectReview = async () => {
        if (rejectionReason.trim().length < 5) { toast.error('Isi alasan pemeriksaan minimal 5 karakter.'); return; }
        setIsProcessingPayment(true);
        try {
            await axios.post(`/api/payments/order/${paymentOrder.real_id || paymentOrder.id}/reject-review`, { reason: rejectionReason.trim() });
            setPaymentOrder(null);
            refreshOrders();
            toast.success('Hasil pemeriksaan dikirim ke pelanggan.');
        } catch (error) { toast.error(error.response?.data?.message || 'Gagal mengirim hasil pemeriksaan.'); }
        finally { setIsProcessingPayment(false); }
    };

    const confirmPayment = async () => {
        if (!paymentOrder || isProcessingPayment) return;
        if (paymentMethod === 'qris_manual' && !fundsChecked) { toast.error('Periksa dana masuk terlebih dahulu.'); return; }

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
                reference_number: paymentMethod === 'qris_manual' ? paymentReference.trim() || null : null,
                amount_received: received,
                notes: `Pembayaran dikonfirmasi kasir - ${paymentMethod.toUpperCase()}`,
            });
            const payment = response.data?.data;
            setOrders(prev => (Array.isArray(prev) ? prev : []).map(order => order.id === paymentOrder.id ? {
                ...order,
                status: payment?.order?.order_status || order.status,
                payment_status: 'paid',
                payment_review_requested_at: null,
                payment_method: payment?.payment_method || paymentMethod,
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

    const visibleOrders = ordersSourceRef.current === initialOrders ? orders : paginator.data;
    const safeOrdersList = Array.isArray(visibleOrders) ? visibleOrders : [];
    const pageOrders = safeOrdersList;

    const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
    const paymentMethodLabel = (method) => ({ cash: 'Tunai', qris_manual: 'QRIS', qris: 'QRIS' }[method] || method || '—');

    const summaryData = localSummary && Object.keys(localSummary).length > 0 ? localSummary : (summary && Object.keys(summary).length > 0 ? summary : (sharedSummary || {}));

    const periodOrderCount = summaryData.period_order_count ?? summaryData.today_order_count ?? totalItems;
    const periodOrderValue = summaryData.period_order_value ?? summaryData.today_order_value ?? 0;
    const summaryPeriod = summaryData.period || periodFilter;
    const summaryPeriodLabel = summaryPeriod === 'custom' && startDate && endDate
        ? `${startDate.split('-').reverse().join('/')} – ${endDate.split('-').reverse().join('/')}`
        : ({
            all: 'Semua tanggal',
            today: 'Hari ini',
            '7_days': '7 hari terakhir',
            '30_days': '30 hari terakhir',
            this_month: 'Bulan ini',
            this_year: 'Tahun ini',
        }[summaryPeriod] || 'Semua tanggal');
    const activeCount = summaryData.active_count ?? 0;

    const getNextStatusAction = (order) => {
        if (order.status === 'pending') return { nextStatus: 'preparing', label: 'Proses' };
        if (order.status === 'preparing' || order.status === 'processing') return { nextStatus: 'ready', label: 'Siap' };
        if (order.status === 'ready') return { nextStatus: 'completed', label: 'Selesai' };
        return null;
    };

    const revenueText = formatRp(periodOrderValue);
    const skeletonParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('skeleton') : null;

    return (
        <AuthenticatedLayout pageTitle={locale === 'en' ? 'Orders List' : 'Daftar Pesanan'} noPadding>
            <Head title={`${locale === 'en' ? 'Orders List' : 'Daftar Pesanan'}`}>
                <meta name="description" content="Kelola dan pantau seluruh daftar pesanan pelanggan Motorku secara real-time." />
            </Head>

            {skeletonParam ? (
                <OrderTableSkeleton />
            ) : (
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-2 p-3 sm:p-6 lg:p-8">
                <OrderToolbar
                    periodLabel={summaryPeriodLabel}
                    orderCount={periodOrderCount}
                    revenueText={revenueText}
                    revenueVisible={isRevenueVisible}
                    onToggleRevenue={() => setIsRevenueVisible(visible => !visible)}
                    activeCount={activeCount}
                    status={statusFilter}
                    onStatusChange={handleFilterChange}
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRefresh={refreshOrders}
                    refreshing={isNavigating}
                    period={periodFilter}
                    startDate={startDate}
                    endDate={endDate}
                    datesOpen={showDateFilters}
                    onToggleDates={() => setShowDateFilters(visible => !visible)}
                    onPeriodChange={handlePeriodChange}
                    onDateRangeApply={handleApplyDateRange}
                />
                <div aria-busy={isNavigating} className="order-results flex min-h-0 flex-1 flex-col xl:overflow-hidden xl:rounded-[12px] xl:border xl:border-slate-200 dark:xl:border-slate-800">
                    <div ref={orderScrollRef} role="region" aria-label="Daftar pesanan" tabIndex={0} className="order-scroll-region min-h-0 flex-1 overflow-auto overscroll-contain">
                        {/* Mobile order list */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
                            {pageOrders.map(order => {
                                if (!order) return null;
                                const display = getStatusDisplay(order.status, order.payment_status, Number(order.returned_amount || 0), order.payment_review_requested_at);
                                const StatusIcon = display.primary.icon;
                                const nextAction = getNextStatusAction(order);
                                const orderId = order.real_id || order.id;

                                return (
                                    <article key={orderId} className="admin-surface order-card relative min-w-0 border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                                        <Link href={`/orders/${orderId}`} aria-label={`Lihat detail pesanan ${order.id}`} className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] rounded-[inherit] focus-visible:outline-primary" />
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-mono text-xs font-bold text-primaryDark dark:text-blue-300">{order.id}</p>
                                                <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">{order.customer}</p>
                                            </div>
                                            <strong className="shrink-0 text-sm text-slate-900 dark:text-white">{formatRp(order.total)}</strong>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{order.channel} · {order.date} · {order.time} · {order.items} item</p>
                                        {order.item_details?.length > 0 ? (
                                            <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                                {order.item_details.slice(0, 2).map((item, index) => (
                                                    <p key={index} className="truncate">{item.quantity}× {item.name}</p>
                                                ))}
                                                {order.item_details.length > 2 && <p className="text-slate-500 dark:text-slate-400">+{order.item_details.length - 2} barang lainnya</p>}
                                            </div>
                                        ) : <p className="mt-1 text-[11px] text-slate-500">Belum ada rincian barang</p>}
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5" title={display.tooltip}>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${display.primary.plain ? '' : 'rounded-md px-2 py-0.5'} ${display.primary.color}`}>
                                                <StatusIcon size={12} />{display.primary.label}
                                            </span>
                                            {display.secondary && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${display.secondary.color}`}>{display.secondary.label}</span>}
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs font-bold">
                                            <span className="mr-auto text-slate-600 dark:text-slate-300">Metode: {paymentMethodLabel(order.payment_method)}</span>
                                            <div className="relative z-20 flex items-center gap-2">
                                                {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                                                    <button type="button" onClick={() => openPayment(order)} className="admin-button min-h-10 bg-accentYellow px-2.5 py-2 text-primaryDark font-bold">{order.payment_review_requested_at ? 'Periksa QRIS' : 'Konfirmasi Bayar'}</button>
                                                )}
                                                {order.payment_status === 'paid' && nextAction && (
                                                    <button type="button" onClick={() => handleUpdateStatus(order, nextAction.nextStatus)} disabled={updatingStatusId === orderId} className="admin-button min-h-10 bg-primary px-2.5 py-2 text-white disabled:bg-slate-600">{nextAction.label}</button>
                                                )}
                                                <button type="button" onClick={() => handlePrintOrder(order)} disabled={isPrintingId === orderId} aria-label={`Cetak struk ${order.id}`} className="flex h-10 w-10 items-center justify-center admin-button text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 disabled:text-slate-400">
                                                    <FiPrinter size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                            {pageOrders.length === 0 && <p className="admin-surface col-span-full border border-slate-200 bg-white px-3 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">{statusFilter === 'action' ? 'Belum ada pesanan yang perlu ditangani.' : 'Tidak ada transaksi yang sesuai.'}</p>}
                        </div>

                        {/* Desktop data table */}
                        <div className="hidden xl:block">
                            <table className="w-full min-w-[840px] table-fixed text-left border-collapse">
                                <colgroup>
                                    <col className="w-[21%]" />
                                    <col className="w-[16%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[15%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[13%]" />
                                    <col className="w-[13%]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                                        <th className="px-3.5 py-3.5">PESANAN</th>
                                        <th className="px-3.5 py-3.5">PELANGGAN</th>
                                        <th className="px-3.5 py-3.5 text-center">ITEM</th>
                                        <th className="px-3.5 py-3.5 text-right">TOTAL</th>
                                        <th className="px-3.5 py-3.5 text-center">STATUS</th>
                                        <th className="px-3.5 py-3.5 text-center">METODE PEMBAYARAN</th>
                                        <th className="px-3.5 py-3.5 text-center">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                                    {pageOrders.map(order => {
                                        if (!order) return null;
                                        const nextAction = getNextStatusAction(order);

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                {/* ID and time */}
                                                <td className="px-3.5 py-3.5">
                                                    <span className="block whitespace-nowrap font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{order.id}</span>
                                                    <span className="mt-0.5 block whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">{order.channel} · {order.date} · {order.time}</span>
                                                </td>

                                                {/* PELANGGAN */}
                                                <td className="break-words px-3.5 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    {order.customer}
                                                    {order.matching_item && <span className="mt-0.5 block truncate text-[11px] font-medium text-blue-700 dark:text-blue-300">Barang: {order.matching_item}</span>}
                                                </td>

                                                {/* JUMLAH ITEM */}
                                                <td className="whitespace-nowrap px-3.5 py-3.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{order.items} item</td>

                                                {/* TOTAL TAGIHAN */}
                                                <td className="whitespace-nowrap px-3.5 py-3.5 text-right font-black text-slate-900 dark:text-white text-xs">
                                                    {formatRp(order.total)}
                                                </td>

                                                 {/* STATUS PESANAN */}
                                                 <td className="px-3.5 py-3.5">
                                                     {(() => {
                                                         const display = getStatusDisplay(order.status, order.payment_status, Number(order.returned_amount || 0), order.payment_review_requested_at);
                                                         const PrimaryIcon = display.primary.icon;
                                                         return (
                                                             <div className="flex flex-wrap items-center justify-center gap-1.5 text-center" title={display.tooltip}>
                                                                 <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${display.primary.plain ? '' : 'rounded-md px-2 py-0.5'} ${display.primary.color}`}>
                                                                     <PrimaryIcon size={12} className="shrink-0" />
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

                                                {/* METODE PEMBAYARAN */}
                                                <td className="px-3.5 py-3.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {paymentMethodLabel(order.payment_method)}
                                                </td>
                                                {/* AKSI */}
                                                <td className="px-3.5 py-3.5">
                                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                                        {/* Highlighted Konfirmasi Pembayaran Button for Unpaid Orders */}
                                                        {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => openPayment(order)}
                                                                className="max-w-full px-2.5 py-1 text-[11px] font-extrabold text-primaryDark bg-accentYellow hover:bg-yellow-300 active:scale-95 shadow-2xs rounded-lg border border-accentYellow transition-all cursor-pointer"
                                                                title="Konfirmasi Pembayaran Kasir"
                                                            >
                                                                {order.payment_review_requested_at ? 'Periksa QRIS' : 'Konfirmasi Bayar'}
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
                                                                className="p-1.5 text-primary dark:text-yellow-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors inline-flex disabled:opacity-50"
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
                                            <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-semibold">
                                                {statusFilter === 'action' ? 'Belum ada pesanan yang perlu ditangani.' : 'Tidak ada transaksi yang sesuai.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Standardized Table Pagination Footer */}
                    <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-[12px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-normal text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 xl:mt-0 xl:rounded-none xl:border-0 xl:border-t">
                        <span className="min-w-0">
                            <span className="sm:hidden">{totalItems > 0 ? `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, totalItems)}` : '0'} / {totalItems}</span>
                            <span className="hidden sm:inline">{totalItems > 0 ? `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, totalItems)}` : '0'} dari {totalItems} pesanan</span>
                        </span>

                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={changePage} label="Halaman pesanan" />
                    </div>
                </div>
            </div>
            )}

            {/* Confirm actual funds before recording a manual payment. */}
            <Dialog open={Boolean(paymentOrder)} onClose={() => !isProcessingPayment && setPaymentOrder(null)} className="relative z-50">
                <div className="fixed inset-0 bg-[#19231f]" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
                    {paymentOrder && <DialogPanel className="w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto rounded-lg border border-[#dddfd5] bg-white p-6 text-[#19231f]">
                        <DialogTitle className="font-heading text-xl font-semibold">{rejectingReview ? 'Hasil pemeriksaan QRIS' : 'Konfirmasi pembayaran'}</DialogTitle>
                        <p className="mt-1 text-xs text-[#58645e]">{paymentOrder.id} · {paymentOrder.customer}</p>
                        <p className="mt-4 font-heading text-3xl font-semibold">{formatRp(paymentOrder.total)}</p>
                        {paymentOrder.payment_review_requested_at && <p className="mt-4 rounded-md border border-[#e3cf71] bg-[#fff4bd] p-3 text-xs leading-relaxed">Pelanggan melaporkan sudah membayar melalui QRIS. Periksa transaksi di aplikasi merchant sebelum melanjutkan.{paymentOrder.payment_reference && <span className="mt-1 block font-semibold">Referensi pelanggan: {paymentOrder.payment_reference}</span>}</p>}
                        {rejectingReview ? <label className="mt-5 block text-xs font-semibold">Keterangan untuk pelanggan<textarea className="mt-2 w-full rounded-md border border-[#c8cdc1] p-3 text-sm" rows={3} maxLength={255} value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} placeholder="Jelaskan hasil pengecekan dana masuk" /><span className="mt-1 block text-xs font-normal text-[#58645e]">Status kembali belum dibayar dan batas pembayaran diperpanjang. Pastikan dana memang belum diterima.</span></label> : <div className="mt-5 space-y-4">
                            <label className="block text-xs font-semibold">Metode pembayaran<select className="mt-2 min-h-11 w-full rounded-md border border-[#c8cdc1] text-sm" value={paymentMethod} onChange={event => { setPaymentMethod(event.target.value); setFundsChecked(false); }} disabled={Boolean(paymentOrder.payment_review_requested_at)}>
                                {app_settings?.cash_enabled !== false && <option value="cash">Tunai</option>}
                                {(app_settings?.customer_qris_enabled || paymentOrder.payment_review_requested_at) && <option value="qris_manual">QRIS</option>}
                            </select></label>
                            {paymentMethod === 'cash' ? <><label className="block text-xs font-semibold">Nominal diterima<MoneyInput min={paymentOrder.total} value={amountReceived} onChange={event => setAmountReceived(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-[#c8cdc1] p-3 text-sm" /></label><p className="text-xs text-[#58645e]">Kembalian: {formatRp(Math.max(0, Number(amountReceived) - Number(paymentOrder.total)))}</p></> : <><label className="block text-xs font-semibold">Referensi transaksi (opsional)<input type="text" maxLength={100} value={paymentReference} onChange={event => setPaymentReference(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-[#c8cdc1] p-3 text-sm" /></label><label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-[#dddfd5] bg-[#f3f3ed] p-3 text-xs leading-relaxed"><input type="checkbox" checked={fundsChecked} onChange={event => setFundsChecked(event.target.checked)} className="mt-1 rounded text-[#19231f]" /><span>Saya sudah memeriksa aplikasi merchant dan dana sebesar {formatRp(paymentOrder.total)} benar-benar masuk.</span></label></>}
                        </div>}
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button onClick={() => rejectingReview ? setRejectingReview(false) : setPaymentOrder(null)} disabled={isProcessingPayment} className="min-h-11 rounded-md border border-[#c8cdc1] px-4 text-xs font-semibold">Kembali</button>
                            {paymentOrder.payment_review_requested_at && !rejectingReview && <button onClick={() => setRejectingReview(true)} disabled={isProcessingPayment} className="min-h-11 rounded-md border border-[#c8cdc1] px-4 text-xs font-semibold">Dana belum masuk</button>}
                            <button onClick={rejectingReview ? rejectReview : confirmPayment} disabled={isProcessingPayment || (rejectingReview ? rejectionReason.trim().length < 5 : paymentMethod === 'qris_manual' && !fundsChecked)} className="min-h-11 rounded-md bg-[#FFDD00] px-4 text-xs font-bold disabled:bg-[#e5e7df] disabled:text-[#58645e]">{isProcessingPayment ? 'Memproses…' : rejectingReview ? 'Kirim keterangan' : 'Konfirmasi lunas'}</button>
                        </div>
                    </DialogPanel>}
                </div>
            </Dialog>

            {/* THERMAL PRINTABLE RECEIPT TEMPLATE FOR ORDER LIST */}
            {printOrderData && (
                <ThermalReceipt order={printOrderData} settings={app_settings} fallbackCashier={userName} />
            )}
        </AuthenticatedLayout>
    );
}
