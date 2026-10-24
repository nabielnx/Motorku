import DeleteButton from '@/Components/Admin/DeleteButton';
import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/Admin/Button';
import Dialog, { DialogTitle } from '@/Components/Admin/Dialog';
import { dataTypeSchema, dataTypeError, fieldTypeLabels, fieldKey } from '@/Utils/dataTypes';

export default function DataTypeIndex({ types = [] }) {
    const { url } = usePage();
    const kind = new URL(url, 'http://localhost').searchParams.get('kind') === 'reference' ? 'reference' : 'product';
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const open = type => {
        setEditing(type); setError('');
        setForm({ kind: type?.kind ?? kind, name: type?.name ?? '', fields: (type?.fields ?? []).map(field => ({ ...field, optionText: field.options.join('\n') })) });
    };
    const updateField = (index, changes) => setForm(current => ({ ...current, fields: current.fields.map((field, i) => i === index ? { ...field, ...changes } : field) }));
    const move = (index, offset) => setForm(current => {
        const fields = [...current.fields];
        [fields[index], fields[index + offset]] = [fields[index + offset], fields[index]];
        return { ...current, fields };
    });
    const save = async event => {
        event.preventDefault(); setError('');
        const input = { ...form, fields: form.fields.map(({ optionText, ...field }) => ({ ...field, options: field.type === 'select' ? optionText.split('\n').map(value => value.trim()).filter(Boolean) : [] })) };
        const result = dataTypeSchema.safeParse(input);
        if (!result.success) { setError(result.error.issues[0].message); return; }
        setBusy(true);
        try {
            if (editing) await axios.put(`/data-types/${editing.id}`, { ...result.data, version: editing.sync_version });
            else await axios.post('/data-types', result.data);
            setForm(null); toast.success('Jenis berhasil disimpan.'); router.reload();
        } catch (failure) { setError(dataTypeError(failure)); } finally { setBusy(false); }
    };
    const remove = async () => {
        setBusy(true); setError('');
        try { await axios.delete(`/data-types/${deleting.id}`); setDeleting(null); router.reload(); toast.success('Jenis dihapus.'); }
        catch (failure) { setError(dataTypeError(failure)); } finally { setBusy(false); }
    };
    const listed = types.filter(type => type.kind === kind);
    return <AuthenticatedLayout pageTitle="Kelola Jenis">
        <Head title="Kelola Jenis" />
        <section className="mx-auto w-full max-w-5xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h1 className="font-heading text-xl font-semibold">Kelola Jenis</h1><p className="mt-1 text-xs text-slate-600">Atur kelompok produk dan jenis data referensi toko.</p></div>
                <Button onClick={() => open(null)}><FiPlus />Tambah Jenis</Button>
            </div>
            <nav aria-label="Jenis data" className="flex flex-wrap gap-2">
                {[['product', 'Produk'], ['reference', 'Data Referensi']].map(([key, label]) => <Link key={key} href={`/data-types?kind=${key}`} aria-current={kind === key ? 'page' : undefined} className={`admin-button ${kind === key ? 'admin-button-primary' : 'admin-button-secondary'}`}>{label}</Link>)}
            </nav>
            <p className="text-xs leading-5 text-slate-600">{kind === 'product' ? 'Jenis baru otomatis tersedia di menu Produk, kategori, dan pilihan impor/ekspor.' : 'Tentukan kolom untuk setiap jenis, lalu buka jenis tersebut untuk mengisi data dan menghubungkan produk.'}</p>
            <div className="space-y-2">{listed.map(type => <article key={type.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
                <div className="min-w-0 flex-1"><Link className="break-words text-sm font-semibold hover:underline" href={kind === 'product' ? `/products?group=${type.key}` : type.driver === 'motorcycles' ? '/motorcycles' : `/references/${type.id}`}>{type.name}</Link><p className="mt-1 text-xs text-slate-500">{type.driver ? `Form khusus motor · ${type.records_count} data` : kind === 'reference' ? `${type.fields.length} kolom · ${type.entries_count} data` : `${type.categories_count} kategori`}{type.is_system ? ' · Bawaan' : ''}</p></div>
                <div className="flex shrink-0 gap-2"><Button variant="secondary" onClick={() => open(type)} aria-label={`Edit jenis ${type.name}`}><FiEdit2 />Edit</Button><DeleteButton as={Button} variant="secondary" disabled={busy} onClick={() => { setDeleting(type); setError(''); }} aria-label={`Hapus jenis ${type.name}`}><FiTrash2 /></DeleteButton></div>
            </article>)}</div>
            {!listed.length && <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">Belum ada jenis. Tambahkan jenis pertama untuk mulai mengisi data.</div>}
        </section>
        <Dialog show={form !== null} onClose={() => !busy && setForm(null)} closeable={!busy} className="max-w-3xl overflow-hidden rounded-xl">
            {form && <form onSubmit={save}>
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4"><DialogTitle className="font-heading text-lg font-semibold">{editing ? 'Edit' : 'Tambah'} Jenis {kind === 'product' ? 'Produk' : 'Referensi'}</DialogTitle><button type="button" aria-label="Tutup" disabled={busy} onClick={() => setForm(null)} className="admin-icon-button p-2"><FiX /></button></div>
                <fieldset disabled={busy} className="max-h-[65dvh] min-w-0 space-y-4 overflow-y-auto p-4 sm:p-5">
                    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <label className="block text-xs font-semibold">Nama jenis<input autoFocus className="admin-control mt-1 w-full" value={form.name} maxLength={80} onChange={event => setForm({ ...form, name: event.target.value })} placeholder={kind === 'product' ? 'Contoh: Peralatan Kebun' : 'Contoh: Elektronik'} /></label>
                    {kind === 'reference' && !editing?.driver && <>
                        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Kolom tambahan ({form.fields.length}/20)</h2><Button variant="secondary" disabled={form.fields.length >= 20} onClick={() => setForm({ ...form, fields: [...form.fields, { key: `kolom_${Date.now().toString(36)}`, label: '', type: 'text', required: false, options: [], optionText: '' }] })}><FiPlus />Tambah Kolom</Button></div>
                        <p className="text-xs text-slate-500">Nama data, deskripsi, foto, dan mapping produk sudah tersedia. Kolom tambahan tampil sesuai urutan di bawah.</p>
                        {form.fields.map((field, index) => <fieldset key={index} className="min-w-0 space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                            <legend className="px-1 text-xs font-semibold">Kolom {index + 1}</legend>
                            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Nama kolom<input className="admin-control mt-1 w-full" value={field.label} maxLength={80} placeholder="Contoh: Voltase" onChange={event => updateField(index, { label: event.target.value, ...(!editing ? { key: fieldKey(event.target.value) } : {}) })} /></label><label className="text-xs">Tipe kolom<select className="admin-control mt-1 w-full" value={field.type} disabled={editing?.entries_count > 0 && editing.fields.some(old => old.key === field.key)} onChange={event => updateField(index, { type: event.target.value })}>{Object.entries(fieldTypeLabels).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label></div>
                            {field.type === 'select' && <label className="block text-xs">Pilihan (satu per baris)<textarea rows={3} className="admin-control mt-1 w-full" value={field.optionText} onChange={event => updateField(index, { optionText: event.target.value })} /></label>}
                            <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" className="rounded" checked={field.required} onChange={event => updateField(index, { required: event.target.checked })} />Wajib diisi</label><div className="flex gap-1"><Button variant="secondary" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Naikkan kolom ${index + 1}`}><FiArrowUp /></Button><Button variant="secondary" disabled={index === form.fields.length - 1} onClick={() => move(index, 1)} aria-label={`Turunkan kolom ${index + 1}`}><FiArrowDown /></Button><Button variant="secondary" disabled={editing?.entries_count > 0 && editing.fields.some(old => old.key === field.key)} onClick={() => setForm({ ...form, fields: form.fields.filter((_, i) => i !== index) })} aria-label={`Hapus kolom ${index + 1}`}><FiTrash2 /></Button></div></div>
                        </fieldset>)}
                    </>}
                    {editing?.driver && <p className="text-xs text-slate-500">Jenis ini menggunakan form dan mapping motor yang sudah tersedia.</p>}
                </fieldset>
                <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" disabled={busy} onClick={() => setForm(null)}>Batal</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Jenis'}</Button></div>
            </form>}
        </Dialog>
        <Dialog show={deleting !== null} onClose={() => !busy && setDeleting(null)} closeable={!busy} className="max-w-sm rounded-xl p-5">
            <DialogTitle className="font-heading text-lg">Hapus Jenis {deleting?.name}?</DialogTitle>
            <div className="my-3 space-y-2 text-sm">
                <p>{deleting?.kind === 'product'
                    ? 'Seluruh kategori, subkategori, produk, mapping produk, dan foto dalam jenis ini ikut dihapus permanen.'
                    : 'Seluruh data referensi, mapping kecocokan, dan foto dalam jenis ini ikut dihapus permanen. Produk yang terhubung tetap tersimpan.'}</p>
                <p className="font-semibold text-red-700 dark:text-red-300">Tindakan ini tidak dapat dibatalkan.</p>
                {deleting?.kind === 'product' && <p className="text-xs text-slate-600 dark:text-slate-300">Riwayat nota dan mutasi stok tetap tersimpan.</p>}
            </div>
            {error && <p role="alert" className="mb-3 text-xs text-red-600">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>Batal</Button><DeleteButton as={Button} variant="danger" disabled={busy} onClick={remove}>{busy ? 'Menghapus…' : 'Hapus Jenis & Isinya'}</DeleteButton></div>
        </Dialog>
    </AuthenticatedLayout>;
}
