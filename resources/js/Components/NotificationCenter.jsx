import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, router } from '@inertiajs/react';
import { FiBell, FiCheck, FiCheckCircle, FiChevronLeft, FiChevronRight, FiClipboard, FiDollarSign, FiPackage, FiRefreshCw, FiRotateCcw, FiUsers, FiX } from 'react-icons/fi';

const icons = { order: FiClipboard, payment: FiDollarSign, stock: FiPackage, return: FiRotateCcw, staff: FiUsers, cash: FiDollarSign };
let cachedSummary = null;

export default function NotificationCenter({ user, roles, onActiveOrderCountChange, timezone = 'Asia/Jakarta' }) {
    const userKey = `${user.id}:${[...roles].sort().join(',')}`;
    const [open, setOpen] = useState(false);
    const [summary, setSummary] = useState(() => cachedSummary?.key === userKey ? cachedSummary.data : {});
    const [unreadOnly, setUnreadOnly] = useState(true);
    const [page, setPage] = useState(1);
    const [items, setItems] = useState(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const revision = useRef(0);

    const applySummary = (data) => {
        const value = { unread_count: data.unread_count, active_order_count: data.active_order_count, low_stock_count: data.low_stock_count, out_stock_count: data.out_stock_count };
        cachedSummary = { key: userKey, data: value, fetchedAt: Date.now() };
        setSummary(value);
        onActiveOrderCountChange(Number(value.active_order_count ?? 0));
    };

    useEffect(() => {
        const controller = new AbortController();
        let fetching = false;
        setSummary(cachedSummary?.key === userKey ? cachedSummary.data : {});
        onActiveOrderCountChange(cachedSummary?.key === userKey ? Number(cachedSummary.data.active_order_count ?? 0) : 0);
        setOpen(false);
        setItems(null);
        setPage(1);
        setError('');
        if (!user.email_verified_at || !roles.some(role => ['owner', 'cashier'].includes(role))) return;
        const fetchSummary = async () => {
            if (fetching || document.hidden || (cachedSummary?.key === userKey && Date.now() - cachedSummary.fetchedAt < 30000)) return;
            fetching = true;
            const currentRevision = revision.current;
            try {
                const { data } = await window.axios.get('/api/notifications/summary', { signal: controller.signal });
                if (!controller.signal.aborted && currentRevision === revision.current) applySummary(data);
            } catch { /* Preserve the badge during a temporary connection failure. */ }
            finally { fetching = false; }
        };
        fetchSummary();
        const timer = setInterval(fetchSummary, 30000);
        document.addEventListener('visibilitychange', fetchSummary);
        return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', fetchSummary); };
    }, [userKey, user.email_verified_at, onActiveOrderCountChange]);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        const currentRevision = ++revision.current;
        setLoading(true);
        setError('');
        window.axios.get('/api/notifications', { params: { page, unread: unreadOnly ? 1 : 0 }, signal: controller.signal })
            .then(({ data }) => {
                if (controller.signal.aborted || revision.current !== currentRevision) return;
                if (data.items.last_page < page) { setPage(data.items.last_page); return; }
                setItems(data.items);
                applySummary(data);
            })
            .catch(() => { if (!controller.signal.aborted) setError('Notifikasi gagal dimuat. Silakan coba lagi.'); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [open, userKey, unreadOnly, page, refresh]);

    const read = async (item = null) => {
        if (busy) return;
        setBusy(true);
        setError('');
        ++revision.current;
        try {
            await window.axios.patch(item ? `/api/notifications/${item.id}/read` : '/api/notifications/read-all');
            // Force a fresh count on the next navigation, including after the panel closes.
            cachedSummary = null;
            if (item) {
                setSummary(value => ({ ...value, unread_count: Math.max(0, (value.unread_count ?? 0) - (item.read_at ? 0 : 1)) }));
                setOpen(false);
                router.visit(item.url);
            } else {
                setSummary(value => ({ ...value, unread_count: 0 }));
                setRefresh(value => value + 1);
            }
        } catch {
            setError('Gagal menandai notifikasi dibaca. Silakan coba lagi.');
        } finally { setBusy(false); }
    };

    const count = Number(summary.unread_count ?? 0);
    return (
        <>
            <button type="button" onClick={() => { setUnreadOnly(true); setPage(1); setOpen(true); }} aria-label={count ? `Notifikasi, ${count} belum dibaca` : 'Notifikasi'} aria-haspopup="dialog" aria-expanded={open}
                className="relative flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                <FiBell size={19} className={count ? 'text-amber-500 dark:text-amber-400' : ''} />
                {count > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-rose-600 px-1 text-[9px] font-black text-white dark:border-slate-900">{count > 99 ? '99+' : count}</span>}
            </button>
            <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-slate-900/30" aria-hidden="true" />
                <div className="fixed inset-0 flex justify-end p-2 sm:p-4">
                    <DialogPanel className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
                        <div className="flex shrink-0 items-center gap-3 bg-primary px-5 py-4 text-white">
                            <FiBell size={21} className="text-[#FFF200]" />
                            <div className="flex-1"><DialogTitle className="text-base font-bold">Notifikasi</DialogTitle><p className="text-xs text-white/80">{count} belum dibaca</p></div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup notifikasi" className="rounded-lg p-2 hover:bg-white/10"><FiX size={20} /></button>
                        </div>
                        <div className="shrink-0 border-b border-slate-200 p-4 dark:border-slate-800">
                            <p className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">PERLU PERHATIAN SAAT INI</p>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/orders?status=action" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-primaryDark dark:bg-slate-800 dark:text-slate-200"><FiClipboard />{summary.active_order_count ?? 0} pesanan aktif</Link>
                                <Link href="/products?stock_status=out" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-primaryDark dark:bg-slate-800 dark:text-slate-200"><FiPackage />{summary.out_stock_count ?? 0} stok habis</Link>
                                {summary.low_stock_count > summary.out_stock_count && <Link href="/products?stock_status=low" onClick={() => setOpen(false)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-primaryDark dark:bg-slate-800 dark:text-slate-200">{summary.low_stock_count - summary.out_stock_count} stok menipis</Link>}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                            {[false, true].map(value => <button type="button" key={String(value)} aria-pressed={unreadOnly === value} disabled={busy} onClick={() => { setUnreadOnly(value); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${unreadOnly === value ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{value ? 'Belum dibaca' : 'Semua'}</button>)}
                            <button type="button" disabled={loading || busy} onClick={() => setRefresh(value => value + 1)} aria-label="Muat ulang notifikasi" className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><FiRefreshCw className={loading ? 'animate-spin' : ''} /></button>
                        </div>
                        {error && <div role="alert" className="shrink-0 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}<button type="button" onClick={() => setRefresh(value => value + 1)} className="ml-2 font-bold underline">Coba lagi</button></div>}
                        <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={loading}>
                            {loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Memuat notifikasi…</p> : !error && !items?.data?.length ? <div className="px-6 py-12 text-center"><FiCheckCircle className="mx-auto mb-3 text-slate-400" size={32} /><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{unreadOnly ? 'Semua notifikasi sudah dibaca.' : 'Belum ada notifikasi.'}</p><p className="mt-2 text-xs text-slate-500">Aktivitas baru toko akan muncul di sini.</p></div> : !error && items?.data?.map(item => {
                                const Icon = icons[item.category] || FiBell;
                                return <button type="button" key={item.id} disabled={busy} onClick={() => read(item)} className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800 ${item.read_at ? '' : 'bg-blue-50/50 dark:bg-slate-800/50'}`}>
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[#FFF200]"><Icon size={18} /></span>
                                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">{item.title}{!item.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />}</span><span className="mt-1 block break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.message}</span><time dateTime={item.created_at} className="mt-2 block text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: timezone })}</time></span>
                                    <FiChevronRight className="mt-2 shrink-0 text-slate-400" />
                                </button>;
                            })}
                        </div>
                        <div className="shrink-0 space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs text-slate-500"><span>{items ? items.total + " notifikasi · " + items.current_page + "/" + items.last_page : 'Riwayat belum dimuat'}</span><div className="flex gap-2"><button type="button" aria-label="Notifikasi sebelumnya" disabled={page <= 1 || loading || busy} onClick={() => setPage(value => value - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-slate-700"><FiChevronLeft /></button><button type="button" aria-label="Notifikasi berikutnya" disabled={!items || page >= items.last_page || loading || busy} onClick={() => setPage(value => value + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-slate-700"><FiChevronRight /></button></div></div>
                            <button type="button" onClick={() => read()} disabled={!count || loading || busy || Boolean(error)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-40"><FiCheck />Tandai semua dibaca</button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
}
