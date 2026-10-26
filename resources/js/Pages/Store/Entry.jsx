import { Head, Link, usePage } from '@inertiajs/react';
import { FiArrowRight, FiShoppingBag } from 'react-icons/fi';

export default function StoreEntry() {
    const { auth } = usePage().props;

    return <div className="min-h-dvh bg-[#f3f3ed] text-[#19231f]">
        <Head title="Buka toko · TokoM" />
        <header className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5">
            <Link href="/" className="flex items-center gap-2 font-heading text-xl font-semibold"><FiShoppingBag aria-hidden="true" />TokoM</Link>
            <Link href={auth?.user ? '/dashboard' : '/login'} className="rounded-lg border border-[#dedfd7] bg-white px-4 py-2 text-sm font-semibold">{auth?.user ? 'Buka admin' : 'Masuk pengelola'}</Link>
        </header>
        <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-16 text-center sm:py-24">
            <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#19231f] text-[#FFDD00]"><FiShoppingBag size={30} aria-hidden="true" /></span>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Buka toko pilihanmu</h1>
            <p className="mt-4 text-sm leading-7 text-[#526159]">Gunakan tautan atau pindai QR yang dibagikan penjual untuk melihat katalog dan memesan dari toko yang tepat.</p>
            <div className="mt-8 w-full rounded-xl border border-[#dedfd7] bg-white p-5 text-left">
                <h2 className="text-sm font-semibold">Sudah punya akun pelanggan?</h2>
                <p className="mt-2 text-sm leading-6 text-[#526159]">Akunmu tetap bisa dipakai di berbagai toko. Buka tautan toko untuk belanja dan melihat pesanan di sana.</p>
                <Link href="/customer/account" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Buka akun pelanggan<FiArrowRight aria-hidden="true" /></Link>
            </div>
        </main>
    </div>;
}
