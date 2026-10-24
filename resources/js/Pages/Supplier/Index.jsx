import DeleteButton from '@/Components/Admin/DeleteButton';
import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { FiEdit2, FiExternalLink, FiPlus, FiSearch, FiTrash2, FiTruck, FiX } from 'react-icons/fi';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Admin/Button';
import Dialog, { DialogTitle } from '@/Components/Admin/Dialog';
import Pagination from '@/Components/Pagination';
import { safeSupplierLinks, supplierFormValues, supplierSchema } from '@/Utils/suppliers';

const fields = [
    { key: 'name', label: 'Nama supplier', max: 150, required: true, autoComplete: 'organization' },
    { key: 'contact_person', label: 'Nama kontak', max: 150, autoComplete: 'name' },
    { key: 'phone', label: 'Telepon / WhatsApp', max: 30, type: 'tel', autoComplete: 'tel' },
    { key: 'email', label: 'Email', max: 254, type: 'email', autoComplete: 'email' },
    { key: 'address', label: 'Alamat', max: 1000, rows: 2, autoComplete: 'street-address' },
    { key: 'notes', label: 'Catatan', max: 2000, rows: 3 },
];

function SupplierForm({ supplier, onClose }) {
    const form = useForm(supplierFormValues(supplier));
    const updateLink = (index, key, value) => form.setData('links', form.data.links.map((link, position) => position === index ? { ...link, [key]: value } : link));
    const submit = event => {
        event.preventDefault();
        if (form.processing) return;
        form.clearErrors();
        const parsed = supplierSchema.safeParse(form.data);
        if (!parsed.success) {
            form.setError(Object.fromEntries(parsed.error.issues.map(issue => [issue.path.join('.'), issue.message])));
            document.getElementById(`supplier-${parsed.error.issues[0].path.join('-')}`)?.focus();
            return;
        }
        form.transform(() => parsed.data);
        const options = { preserveScroll: true, onSuccess: onClose };
        if (supplier) form.put(route('suppliers.update', supplier.id), options);
        else form.post(route('suppliers.store'), options);
    };
    return <Dialog onClose={onClose} closeable={!form.processing} className="max-w-xl overflow-hidden rounded-xl">
        <form onSubmit={submit} noValidate aria-busy={form.processing}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <DialogTitle className="font-heading text-lg font-semibold">{supplier ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
                <button type="button" onClick={onClose} disabled={form.processing} aria-label="Tutup form supplier" className="admin-icon-button p-2"><FiX /></button>
            </div>
            <fieldset disabled={form.processing} className="grid max-h-[65dvh] min-w-0 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
                {fields.map(field => <div key={field.key} className={`min-w-0 ${field.rows ? 'sm:col-span-2' : ''}`}>
                    <label htmlFor={`supplier-${field.key}`} className="mb-1 block text-xs font-semibold">{field.label}{field.required ? ' *' : ''}</label>
                    {field.rows
                        ? <textarea id={`supplier-${field.key}`} className="admin-control w-full" rows={field.rows} maxLength={field.max} autoComplete={field.autoComplete} value={form.data[field.key]} onChange={event => form.setData(field.key, event.target.value)} aria-invalid={Boolean(form.errors[field.key])} aria-describedby={form.errors[field.key] ? `supplier-error-${field.key}` : undefined} />
                        : <input id={`supplier-${field.key}`} className="admin-control w-full" type={field.type ?? 'text'} maxLength={field.max} required={field.required} autoFocus={field.key === 'name'} autoComplete={field.autoComplete} value={form.data[field.key]} onChange={event => form.setData(field.key, event.target.value)} aria-invalid={Boolean(form.errors[field.key])} aria-describedby={form.errors[field.key] ? `supplier-error-${field.key}` : undefined} />}
                    {form.errors[field.key] && <p id={`supplier-error-${field.key}`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{form.errors[field.key]}</p>}
                </div>)}
                <div className="min-w-0 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700 sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div><h3 className="text-xs font-semibold">Link toko / website</h3><p className="mt-1 text-[11px] text-slate-500">Opsional · maksimal 10 link per supplier.</p></div>
                        <Button variant="secondary" disabled={form.data.links.length >= 10} onClick={() => { form.clearErrors('links'); form.setData('links', [...form.data.links, { label: '', url: '' }]); }}><FiPlus aria-hidden="true" />Tambah Link</Button>
                    </div>
                    {form.errors.links && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{form.errors.links}</p>}
                    {form.data.links.map((link, index) => <div key={index} className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                            {['label', 'url'].map(key => {
                                const error = form.errors[`links.${index}.${key}`];
                                const id = `supplier-links-${index}-${key}`;
                                return <div key={key} className="min-w-0">
                                    <label htmlFor={id} className="mb-1 block text-xs font-semibold">{key === 'label' ? 'Nama platform' : 'Link toko'} {index + 1} *</label>
                                    <input id={id} type={key === 'url' ? 'url' : 'text'} required maxLength={key === 'url' ? 2048 : 60} className="admin-control w-full" placeholder={key === 'label' ? 'Shopee, Tokopedia, Website…' : 'https://…'} value={link[key]} onChange={event => updateLink(index, key, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
                                    {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
                                </div>;
                            })}
                        </div>
                        <button type="button" className="admin-icon-button mt-5 p-2 text-red-600 dark:text-red-400" aria-label={`Hapus link ${index + 1}`} onClick={() => { form.clearErrors(); form.setData('links', form.data.links.filter((_, position) => position !== index)); }}><FiTrash2 size={15} /></button>
                    </div>)}
                </div>
            </fieldset>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                <Button variant="secondary" disabled={form.processing} onClick={onClose}>Batal</Button>
                <Button type="submit" disabled={form.processing}>{form.processing ? 'Menyimpan…' : 'Simpan Supplier'}</Button>
            </div>
        </form>
    </Dialog>;
}

function SupplierDetails({ supplier }) {
    if (!supplier.address && !supplier.notes) return <span className="text-xs text-slate-500">Belum ada alamat atau catatan.</span>;
    return <details className="text-xs">
        <summary className="cursor-pointer font-semibold">Alamat & catatan</summary>
        <dl className="mt-2 space-y-2">
            {supplier.address && <div><dt className="text-slate-500">Alamat</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{supplier.address}</dd></div>}
            {supplier.notes && <div><dt className="text-slate-500">Catatan</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{supplier.notes}</dd></div>}
        </dl>
    </details>;
}

function SupplierContact({ supplier }) {
    const links = safeSupplierLinks(supplier.links);
    return <div className="space-y-1 break-words text-xs">
        {supplier.contact_person && <p>{supplier.contact_person}</p>}
        {supplier.phone && <a className="block hover:underline" href={`tel:${supplier.phone.replace(/[^0-9+]/g, '')}`}>{supplier.phone}</a>}
        {supplier.email && <a className="block break-all hover:underline" href={`mailto:${supplier.email}`}>{supplier.email}</a>}
        {!supplier.contact_person && !supplier.phone && !supplier.email && !links.length && <span className="text-slate-500">Belum ada kontak.</span>}
        {links.length > 0 && <div className="flex flex-wrap gap-x-3 gap-y-2 pt-1">{links.map((link, index) => <a key={index} className="inline-flex min-w-0 max-w-full items-start gap-1 font-semibold hover:underline" href={link.url} target="_blank" rel="noopener noreferrer" title={link.url} aria-label={`Buka ${link.label} — ${supplier.name} (tab baru)`}><span className="min-w-0 break-words">{link.label}</span><FiExternalLink className="mt-0.5 shrink-0" size={12} aria-hidden="true" /></a>)}</div>}
    </div>;
}

export default function SupplierIndex({ suppliers, filters }) {
    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const deletion = useForm({});
    const [navigating, setNavigating] = useState(false);
    useEffect(() => setSearch(filters.search), [filters.search]);
    const visit = (page = 1, value = search) => router.get(route('suppliers.index'), {
        ...(value.trim() ? { search: value.trim() } : {}), ...(page > 1 ? { page } : {}),
    }, { preserveState: true, preserveScroll: true, onStart: () => setNavigating(true), onFinish: () => setNavigating(false) });
    const actions = supplier => <div className="flex shrink-0 items-center gap-1">
        <button type="button" className="admin-icon-button p-2" aria-label={`Edit supplier ${supplier.name}`} onClick={() => setEditing(supplier)}><FiEdit2 size={15} /></button>
        <DeleteButton type="button" className="admin-icon-button p-2 text-red-600 dark:text-red-400" aria-label={`Hapus supplier ${supplier.name}`} onClick={() => { deletion.clearErrors(); setDeleting(supplier); }}><FiTrash2 size={15} /></DeleteButton>
    </div>;
    return <AuthenticatedLayout pageTitle="Supplier" noPadding>
        <Head title="Supplier" />
        <section className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-3 p-3 sm:p-6 lg:p-8">
            <div className="flex shrink-0 items-center justify-between gap-2">
                <div><h1 className="font-heading text-xl font-semibold">Supplier</h1><p className="mt-1 text-xs text-slate-500">{suppliers.total} supplier{filters.search ? ' ditemukan' : ''}</p></div>
                <Button onClick={() => setEditing({})}><FiPlus aria-hidden="true" />Tambah Supplier</Button>
            </div>
            <form className="flex shrink-0 gap-2" role="search" aria-label="Cari supplier" onSubmit={event => { event.preventDefault(); visit(); }}>
                <div className="relative min-w-0 flex-1 sm:max-w-md"><label className="sr-only" htmlFor="supplier-search">Cari supplier</label><FiSearch className="pointer-events-none absolute left-3 top-3" aria-hidden="true" /><input id="supplier-search" className="admin-control w-full pl-9" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="Cari nama, kontak, atau telepon…" /></div>
                <Button variant="secondary" type="submit" disabled={navigating}>Cari</Button>
                {filters.search && <Button variant="secondary" disabled={navigating} onClick={() => { setSearch(''); visit(1, ''); }}>Reset</Button>}
            </form>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={navigating}>
                {!suppliers.data.length ? <div className="admin-surface flex flex-col items-center gap-2 border border-slate-200 bg-white px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900"><FiTruck size={28} aria-hidden="true" /><h2 className="text-sm font-semibold">{filters.search ? 'Supplier tidak ditemukan' : 'Belum ada supplier'}</h2><p className="max-w-sm text-xs text-slate-500">{filters.search ? 'Coba nama atau kontak lain, atau reset pencarian.' : 'Tambahkan pemasok untuk menyimpan kontak, alamat, dan catatannya.'}</p></div>
                    : <>
                        <div className="space-y-3 md:hidden">{suppliers.data.map(supplier => <article key={supplier.id} className="admin-surface min-w-0 space-y-3 border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-2"><h2 className="min-w-0 break-words text-sm font-semibold">{supplier.name}</h2>{actions(supplier)}</div><SupplierContact supplier={supplier} /><div className="border-t border-slate-200 pt-3 dark:border-slate-700"><SupplierDetails supplier={supplier} /></div></article>)}</div>
                        <div className="admin-surface hidden overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:block">
                            <table className="w-full table-fixed text-left text-xs"><thead className="border-b border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800"><tr><th className="w-[28%] px-4 py-3 font-semibold">Nama supplier</th><th className="w-[28%] px-4 py-3 font-semibold">Kontak</th><th className="px-4 py-3 font-semibold">Detail</th><th className="w-24 px-4 py-3 text-right font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{suppliers.data.map(supplier => <tr key={supplier.id}><td className="break-words px-4 py-3 align-top font-semibold">{supplier.name}</td><td className="px-4 py-3 align-top"><SupplierContact supplier={supplier} /></td><td className="break-words px-4 py-3 align-top"><SupplierDetails supplier={supplier} /></td><td className="px-3 py-2 align-top">{actions(supplier)}</td></tr>)}</tbody></table>
                        </div>
                    </>}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><p>{suppliers.from ?? 0}–{suppliers.to ?? 0} dari {suppliers.total} supplier</p><Pagination currentPage={suppliers.current_page} totalPages={suppliers.last_page} disabled={navigating} onPageChange={page => visit(page, filters.search)} label="Halaman supplier" /></div>
        </section>
        {editing !== null && <SupplierForm key={editing.id ?? 'new'} supplier={editing.id ? editing : null} onClose={() => setEditing(null)} />}
        <Dialog show={deleting !== null} onClose={() => setDeleting(null)} closeable={!deletion.processing} className="max-w-sm rounded-xl p-5">
            <DialogTitle className="font-heading text-lg font-semibold">Hapus Supplier</DialogTitle>
            <p className="my-3 break-words text-sm">Hapus supplier <strong>{deleting?.name}</strong>? Data kontak, alamat, dan catatannya akan dihapus permanen.</p>
            <div className="flex justify-end gap-2"><Button variant="secondary" disabled={deletion.processing} onClick={() => setDeleting(null)}>Batal</Button><DeleteButton as={Button} variant="danger" disabled={deletion.processing} onClick={() => deletion.delete(route('suppliers.destroy', deleting.id), { preserveScroll: true, onSuccess: () => setDeleting(null) })}>{deletion.processing ? 'Menghapus…' : 'Hapus Supplier'}</DeleteButton></div>
        </Dialog>
    </AuthenticatedLayout>;
}
