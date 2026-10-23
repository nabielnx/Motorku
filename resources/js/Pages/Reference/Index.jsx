import Pagination from '@/Components/Pagination';
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiBookOpen } from 'react-icons/fi';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Admin/Button';
import Dialog, { DialogTitle } from '@/Components/Admin/Dialog';
import EntryFormModal from '@/Components/Reference/EntryFormModal';
import { dataTypeError, displayReferenceValue } from '@/Utils/dataTypes';

export default function ReferenceIndex({ type, entries, filters = {} }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const remove = async () => {
        setBusy(true); setError('');
        try { await axios.delete(`/references/${type.id}/entries/${deleting.id}`); setDeleting(null); router.reload(); toast.success('Data dihapus.'); }
        catch (failure) { setError(dataTypeError(failure)); } finally { setBusy(false); }
    };
    const specifications = (entry, fields) => <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">{fields.map(field => <div key={field.key} className="min-w-0"><dt className="break-words text-slate-500">{field.label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{displayReferenceValue(field, entry.values[field.key])}</dd></div>)}</dl>;
    return <AuthenticatedLayout pageTitle={type.name}>
        <Head title={`${type.name} | Data Referensi`} />
        <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-slate-500">Data Referensi</p><h1 className="mt-1 break-words font-heading text-xl font-semibold">{type.name} <span className="text-xs font-normal text-slate-500">{entries.total} data</span></h1></div><div className="flex flex-wrap gap-2"><Link href="/data-types?kind=reference" className="admin-button admin-button-secondary">Kelola Jenis</Link><Button onClick={() => setEditing({})}><FiPlus />Tambah Data</Button></div></div>
            <form className="flex max-w-lg gap-2" onSubmit={event => { event.preventDefault(); router.get(`/references/${type.id}`, search.trim() ? { search: search.trim() } : {}, { preserveState: true }); }}><label className="relative min-w-0 flex-1"><span className="sr-only">Cari data {type.name}</span><FiSearch className="pointer-events-none absolute left-3 top-3" /><input className="admin-control w-full pl-9" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder={`Cari ${type.name.toLowerCase()}…`} /></label><Button variant="secondary" type="submit">Cari</Button></form>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{entries.data.map(entry => <article key={entry.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-3">{entry.image_path ? <img src={`/storage/${entry.image_path}`} alt={entry.name} loading="lazy" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100"><FiBookOpen size={22} /></div>}<div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold">{entry.name}</h2>{entry.description && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-600">{entry.description}</p>}</div></div>
                {specifications(entry, type.fields.slice(0, 4))}
                {type.fields.length > 4 && <details className="text-xs"><summary className="cursor-pointer font-medium">Spesifikasi lainnya</summary><div className="mt-3">{specifications(entry, type.fields.slice(4))}</div></details>}
                <details className="border-t border-slate-100 pt-3 text-xs"><summary className="cursor-pointer font-medium">Produk terkait ({entry.products.length})</summary>{entry.products.length ? <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">{entry.products.map(product => <li key={product.id}><Link className="break-words hover:underline" href={`/products?search=${encodeURIComponent(product.sku)}`}>{product.name}</Link></li>)}</ul> : <p className="mt-2 text-slate-500">Belum ada produk yang dihubungkan.</p>}</details>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3"><Button variant="secondary" aria-label={`Edit ${entry.name}`} onClick={() => setEditing(entry)}><FiEdit2 />Edit</Button><Button variant="secondary" aria-label={`Hapus ${entry.name}`} onClick={() => { setError(''); setDeleting(entry); }}><FiTrash2 /></Button></div>
            </article>)}</div>
            {!entries.data.length && <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">{filters.search ? 'Data tidak ditemukan. Coba nama lain.' : 'Belum ada data. Klik Tambah Data untuk mulai mengisi.'}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p>{entries.from ?? 0}–{entries.to ?? 0} dari {entries.total} data</p><Pagination currentPage={entries.current_page} totalPages={entries.last_page} previousDisabled={!entries.prev_page_url} nextDisabled={!entries.next_page_url} onPageChange={page => router.visit(page < entries.current_page ? entries.prev_page_url : entries.next_page_url)} label="Halaman data referensi" /></div>
        </section>
        {editing && <EntryFormModal key={editing.id ?? 'new'} type={type} entry={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.reload(); toast.success('Data tersimpan.'); }} />}
        <Dialog show={deleting !== null} onClose={() => !busy && setDeleting(null)} closeable={!busy} className="max-w-sm rounded-xl p-5"><DialogTitle className="font-heading text-lg">Hapus Data</DialogTitle><p className="my-3 break-words text-sm">Hapus {deleting?.name} beserta foto dan hubungannya dengan produk?</p>{error && <p role="alert" className="mb-3 text-xs text-red-600">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>Batal</Button><Button disabled={busy} onClick={remove}>Hapus</Button></div></Dialog>
    </AuthenticatedLayout>;
}
