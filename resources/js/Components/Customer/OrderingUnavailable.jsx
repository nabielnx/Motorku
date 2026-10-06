import { Head, Link } from '@inertiajs/react';

export default function OrderingUnavailable() {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Head title="Pemesanan dinonaktifkan" />
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900">Pemesanan online sedang dinonaktifkan</h1>
            <p className="mt-3 text-slate-600">Silakan pesan langsung melalui kasir toko. Pesanan yang sudah dibuat tetap dapat dilihat.</p>
            <Link href="/order/status" className="mt-5 inline-block font-semibold text-blue-700">Lihat pesanan saya</Link>
        </div>
    </main>;
}
