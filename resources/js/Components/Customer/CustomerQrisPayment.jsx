import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { RiQrCodeLine } from 'react-icons/ri';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { customerOrderQris } from '@/Api/customerOrders';
import { qrisErrorMessage, renderQrisImage } from '@/Utils/qris';

export default function CustomerQrisPayment({ order, initiallyOpen = false }) {
    const enabled = usePage().props.app_settings?.customer_qris_enabled === true;
    const [open, setOpen] = useState(initiallyOpen);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    const [expired, setExpired] = useState(false);
    const available = enabled && order?.order_id && order?.customer_token
        && ['unpaid', 'pending', undefined].includes(order.payment_status)
        && !['cancelled', 'completed'].includes(order.order_status);
    const key = JSON.stringify([order?.order_id, order?.total, attempt]);
    const current = result?.key === key ? result : null;
    const deadline = current?.data?.expires_at || order?.expires_at;

    useEffect(() => {
        setExpired(false);
        if (!deadline) return;
        const remaining = new Date(deadline).getTime() - Date.now();
        if (!Number.isFinite(remaining)) return;
        if (remaining <= 0) { setExpired(true); return; }
        const timeout = setTimeout(() => setExpired(true), Math.min(remaining, 2147483647));
        return () => clearTimeout(timeout);
    }, [deadline, key]);

    useEffect(() => {
        if (!open || !available) return;
        const controller = new AbortController();
        setResult({ key, loading: true });
        customerOrderQris(order.order_id, order.customer_token, controller.signal)
            .then(async data => {
                const imageUrl = data.payload ? await renderQrisImage(data.payload) : data.url;
                if (!imageUrl) throw new Error('Gambar QRIS belum tersedia. Hubungi toko.');
                if (!controller.signal.aborted) setResult({ key, data, imageUrl });
            })
            .catch(error => {
                if (!controller.signal.aborted) setResult({ key, error: qrisErrorMessage(error) });
            });
        return () => controller.abort();
    }, [open, available, order?.order_id, order?.customer_token, key]);

    if (!available) return null;
    if (!open) return (
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 hover:bg-slate-50">
            <RiQrCodeLine size={20} aria-hidden="true" /> Bayar dengan QRIS
        </button>
    );
    const loading = !current || current.loading;

    return (
        <section aria-label="Pembayaran QRIS" className="w-full rounded-lg border border-slate-200 bg-white p-4 text-center">
            <h2 className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900"><RiQrCodeLine size={20} aria-hidden="true" />Bayar dengan QRIS</h2>
            {expired ? <p role="status" className="mt-3 text-xs text-red-600">Pesanan sudah kedaluwarsa. Periksa status pesanan atau hubungi toko sebelum membayar.</p>
                : loading ? <p role="status" className="py-12 text-xs text-slate-500">Menyiapkan QRIS pesanan…</p>
                : current.error ? <p role="alert" className="mt-3 text-xs text-red-600">{current.error}</p>
                : <>
                    <img src={current.imageUrl} alt="Kode QRIS pembayaran pesanan" width="240" height="240" className="mx-auto my-3 h-auto w-60 max-w-full bg-white object-contain" onError={() => setResult({ key, error: 'Gambar QRIS gagal dimuat. Coba lagi atau hubungi toko.' })} />
                    {current.data.merchant?.name && <p className="text-xs font-semibold text-slate-900">{current.data.merchant.name}</p>}
                    <p className="mt-2 text-xs text-slate-500">Total yang dibayar</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">Rp {Number(current.data.amount).toLocaleString('id-ID')}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{current.data.payload ? 'Nominal sudah terisi. Periksa nama toko dan nominal di aplikasi pembayaran Anda.' : 'Masukkan nominal di atas saat membayar melalui aplikasi pembayaran Anda.'}</p>
                    <a href={current.imageUrl} download={`QRIS-${order.order_number || 'pesanan'}.png`} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-900 underline underline-offset-4"><FiDownload size={15} aria-hidden="true" />Simpan QRIS</a>
                </>}
            {!expired && !loading && <button type="button" onClick={() => setAttempt(value => value + 1)} className="mx-auto mt-2 flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-600"><FiRefreshCw size={14} aria-hidden="true" />Muat ulang QRIS</button>}
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">Pembayaran diverifikasi oleh kasir. Jika sudah membayar, jangan batalkan pesanan; hubungi toko bila belum dikonfirmasi.</p>
        </section>
    );
}
