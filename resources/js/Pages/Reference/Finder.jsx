import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { FiArrowLeft, FiBookOpen, FiChevronRight, FiSearch } from 'react-icons/fi';
import useStorefront from '@/Hooks/useStorefront';
import useForceLightTheme from '@/Utils/useForceLightTheme';
import { ProductPhoto, StoreHeader } from '@/Components/Customer/Storefront';
import Pagination from '@/Components/Pagination';
import OrderingUnavailable from '@/Components/Customer/OrderingUnavailable';

const money = value => `Rp ${Number(value).toLocaleString('id-ID')}`;

export default function ReferenceFinder({ types = [], selectedType, selectedEntry, entries, products, filters = {}, settings = {} }) {
    useForceLightTheme();
    const { storeUrl } = useStorefront();
    const [search, setSearch] = useState(filters.search ?? '');
    const [busy, setBusy] = useState(false);
    useEffect(() => setSearch(filters.search ?? ''), [selectedType?.id, filters.search]);
    const path = '/cari-kecocokan' + (selectedType ? `/${selectedType.id}` : '') + (selectedEntry ? `/${selectedEntry.id}` : '');
    const visit = params => router.get(storeUrl(path), params, { preserveState: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    const listing = selectedEntry ? products : entries;
    if (settings['qr_order.enabled'] === 'false') return <OrderingUnavailable />;

    return <div className="customer-storefront min-h-screen bg-[#f3f3ed] font-sans text-[#19231f]">
        <Head title={`${selectedEntry?.name || selectedType?.name || 'Cari Kecocokan'} | TokoM`} />
        <StoreHeader settings={settings} activePage="references" />
        <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
            <Link href={storeUrl(selectedEntry ? `/cari-kecocokan/${selectedType.id}` : selectedType ? '/cari-kecocokan' : '/')} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold"><FiArrowLeft aria-hidden="true" />{selectedEntry ? `Pilih ${selectedType.name} lain` : selectedType ? 'Semua jenis referensi' : 'Kembali ke katalog'}</Link>
            <div><p className="text-xs text-slate-600">Cari Kecocokan</p><h1 className="mt-1 break-words font-heading text-2xl font-semibold">{selectedEntry?.name || selectedType?.name || 'Pilih jenis referensi'}</h1><p className="mt-2 text-sm text-slate-600">{selectedEntry ? 'Produk berikut sudah dihubungkan oleh toko ke referensi ini.' : selectedType ? 'Pilih data referensi untuk melihat produk yang cocok.' : 'Pilih jenis, lalu temukan produk berdasarkan referensi dari toko.'}</p></div>
            {!selectedType && <div className="grid gap-3 sm:grid-cols-2">{types.map(type => <Link key={type.id} href={storeUrl(type.path)} className="flex min-h-20 items-center gap-3 rounded-lg border border-[#dedfd7] bg-white p-4 hover:border-[#19231f]"><FiBookOpen size={22} aria-hidden="true" /><span className="min-w-0 flex-1 break-words text-sm font-semibold">{type.name}</span><FiChevronRight aria-hidden="true" /></Link>)}</div>}
            {!selectedType && !types.length && <p className="rounded-lg border border-[#dedfd7] bg-white p-5 text-sm">Belum ada referensi yang ditampilkan toko.</p>}
            {selectedType && !selectedEntry && <form onSubmit={event => { event.preventDefault(); visit(search.trim() ? { search: search.trim() } : {}); }} className="flex max-w-lg gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Cari {selectedType.name}</span><input className="w-full rounded-lg border border-[#dedfd7] bg-white px-3 py-2 text-sm" type="search" value={search} maxLength={100} placeholder={`Cari ${selectedType.name.toLowerCase()}…`} onChange={event => setSearch(event.target.value)} /></label><button type="submit" disabled={busy} aria-label="Cari referensi" className="flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-[#FFDD00] px-3 text-[#19231f]"><FiSearch aria-hidden="true" /></button></form>}
            {entries && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.data.map(entry => <Link key={entry.id} href={storeUrl(`/cari-kecocokan/${selectedType.id}/${entry.id}`)} className="min-w-0 rounded-lg border border-[#dedfd7] bg-white p-4 hover:border-[#19231f]"><ProductPhoto src={entry.image} name={entry.name} className="mb-3 h-28 w-full rounded-lg" fit="contain" /><h2 className="break-words text-sm font-semibold">{entry.name}</h2><p className="mt-2 text-xs text-slate-600">{entry.products_count} produk terhubung</p></Link>)}</div>}
            {products && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.data.map(product => <article key={product.id} className="flex min-w-0 flex-col rounded-lg border border-[#dedfd7] bg-white p-3"><ProductPhoto src={product.image} name={product.name} className="mb-3 aspect-square w-full rounded-lg" fit="contain" /><h2 className="break-words text-sm font-semibold">{product.name}</h2><p className="mt-1 break-words text-xs text-slate-600">{product.sku}</p><p className="mt-2 font-heading text-base font-semibold">{money(product.price)}</p><p className="mt-1 text-xs text-slate-600">{product.stock > 0 ? `Stok ${product.stock} ${product.unit}` : 'Stok habis'}</p><Link href={storeUrl(`/?search=${encodeURIComponent((product.sku || product.name).slice(0, 160))}`)} className="mt-3 flex min-h-10 items-center justify-center rounded-lg bg-[#FFDD00] px-2 text-center text-xs font-semibold text-[#19231f]">Lihat di katalog</Link></article>)}</div>}
            {listing && !listing.data.length && <p className="rounded-lg border border-[#dedfd7] bg-white p-5 text-sm">{selectedEntry ? 'Belum ada produk tersedia yang dihubungkan ke referensi ini.' : search ? 'Referensi tidak ditemukan. Coba nama lain.' : 'Belum ada data referensi.'}</p>}
            {listing && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600"><p>{listing.total} {selectedEntry ? 'produk' : 'referensi'}</p><Pagination currentPage={listing.current_page} totalPages={listing.last_page} disabled={busy} onPageChange={page => visit({ ...(filters.search ? { search: filters.search } : {}), page })} label={selectedEntry ? 'Halaman produk yang cocok' : 'Halaman referensi'} /></div>}
        </main>
    </div>;
}
