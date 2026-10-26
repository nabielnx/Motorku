import DeleteButton from '@/Components/Admin/DeleteButton';
import Pagination from '@/Components/Pagination';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiX, FiSearch } from 'react-icons/fi';
import Button from '@/Components/Admin/Button';
import Dialog, { DialogTitle } from '@/Components/Admin/Dialog';
import ImagePicker from '@/Components/ImagePicker';
import { IMAGE_ACCEPT, IMAGE_HELP } from '@/Utils/imageUpload';
import { referenceEntrySchema, dataTypeError } from '@/Utils/dataTypes';

export default function EntryFormModal({ type, entry, onClose, onSaved }) {
    const [form, setForm] = useState({ name: entry?.name ?? '', description: entry?.description ?? '',
        values: Object.fromEntries(type.fields.map(field => [field.key, entry?.values?.[field.key] ?? ''])) });
    const [selected, setSelected] = useState(entry?.products ?? []);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [results, setResults] = useState([]);
    const [lastPage, setLastPage] = useState(1);
    const [lookupError, setLookupError] = useState('');
    const [loading, setLoading] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!file) { setPreview(null); return; }
        const url = URL.createObjectURL(file); setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setLookupError(''); setResults([]);
        const timer = setTimeout(async () => {
            try {
                const { data } = await axios.get(`/references/${type.id}/products`, { params: { search, page }, signal: controller.signal });
                if (!controller.signal.aborted) { setResults(data.data); setLastPage(data.last_page); }
            } catch (failure) {
                if (!controller.signal.aborted) setLookupError('Produk gagal dimuat.');
            } finally { if (!controller.signal.aborted) setLoading(false); }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [type.id, search, page, retry]);
    const value = (key, next) => setForm(current => ({ ...current, values: { ...current.values, [key]: next } }));
    const toggleProduct = product => {
        if (selected.some(item => item.id === product.id)) setSelected(current => current.filter(item => item.id !== product.id));
        else if (selected.length < 50) setSelected(current => [...current, product]);
        else setError('Maksimal 50 produk untuk satu data referensi.');
    };
    const save = async event => {
        event.preventDefault(); setError('');
        const result = referenceEntrySchema(type.fields).safeParse(form);
        if (!result.success) { setError(result.error.issues[0].message); return; }
        setBusy(true);
        const data = new FormData();
        data.append('name', result.data.name); data.append('description', result.data.description);
        data.append('values', JSON.stringify(result.data.values));
        data.append('product_ids', JSON.stringify(selected.map(product => product.id)));
        data.append('schema_version', String(type.sync_version));
        data.append('remove_image', removeImage ? '1' : '0');
        if (entry) { data.append('_method', 'PUT'); data.append('version', String(entry.sync_version)); }
        if (file) data.append('image', file);
        try { await axios.post(`/references/${type.id}/entries${entry ? `/${entry.id}` : ''}`, data); onSaved(); }
        catch (failure) { setError(dataTypeError(failure)); } finally { setBusy(false); }
    };
    const photo = preview || (!removeImage && entry?.image_path ? `/storage/${entry.image_path}` : null);
    return <Dialog onClose={onClose} closeable={!busy} className="max-w-3xl overflow-hidden rounded-xl">
        <form onSubmit={save}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4"><DialogTitle className="min-w-0 break-words font-heading text-lg font-semibold">{entry ? 'Edit' : 'Tambah'} Data {type.name}</DialogTitle><button type="button" disabled={busy} aria-label="Tutup" onClick={onClose} className="admin-icon-button shrink-0 p-2"><FiX /></button></div>
            <div className="max-h-[65dvh] space-y-5 overflow-y-auto p-4 sm:p-5">
                {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <fieldset disabled={busy} className="min-w-0 space-y-3">
                    <label className="block text-xs font-semibold">Nama *<input autoFocus className="admin-control mt-1 w-full" maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
                    <label className="block text-xs">Deskripsi<textarea className="admin-control mt-1 w-full" rows={2} maxLength={2000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
                    <div className="grid gap-3 sm:grid-cols-2">{type.fields.map(field => <label key={field.key} className={`block min-w-0 text-xs ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                        <span>{field.label}{field.required ? ' *' : ''}</span>
                        {field.type === 'textarea' ? <textarea rows={3} className="admin-control mt-1 w-full" value={form.values[field.key]} maxLength={2000} onChange={event => value(field.key, event.target.value)} />
                            : field.type === 'select' ? <select className="admin-control mt-1 w-full" value={form.values[field.key]} onChange={event => value(field.key, event.target.value)}><option value="">Pilih…</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select>
                                : field.type === 'boolean' ? <select className="admin-control mt-1 w-full" value={form.values[field.key] === '' ? '' : form.values[field.key] ? 'yes' : 'no'} onChange={event => value(field.key, event.target.value === '' ? '' : event.target.value === 'yes')}><option value="">Pilih…</option><option value="no">Tidak</option><option value="yes">Ya</option></select>
                                    : <input className="admin-control mt-1 w-full" type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} step={field.type === 'number' ? 'any' : undefined} maxLength={field.type === 'text' ? 255 : undefined} value={form.values[field.key]} onChange={event => value(field.key, event.target.value)} />}
                    </label>)}</div>
                </fieldset>
                <section className="space-y-2"><h2 className="text-sm font-semibold">Foto</h2>{photo && <img src={photo} alt="Pratinjau foto referensi" className="h-32 w-40 rounded-lg border border-slate-200 bg-white object-contain" />}<div className="flex flex-wrap items-center gap-2"><ImagePicker disabled={busy} label="referensi" onSelect={image => { if (!IMAGE_ACCEPT.split(',').includes(image.type) || image.size > 4 * 1024 * 1024) { setError(IMAGE_HELP); return; } setFile(image); setRemoveImage(false); }} />{photo && <DeleteButton as={Button} draft={Boolean(file) || !entry?.image_path} variant="secondary" disabled={busy} onClick={() => { setFile(null); setRemoveImage(!file && Boolean(entry?.image_path)); }}>{file ? 'Batal pilih foto' : 'Hapus Foto'}</DeleteButton>}</div><p className="text-xs text-slate-500">{removeImage ? 'Foto akan dihapus dari penyimpanan setelah disimpan.' : IMAGE_HELP}</p></section>
                <section className="space-y-3"><h2 className="text-sm font-semibold">Produk terkait ({selected.length}/50)</h2>
                    {selected.length > 0 && <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">{selected.map(product => <li key={product.id} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 break-words">{product.name}</span><button type="button" disabled={busy} aria-label={`Lepas ${product.name}`} onClick={() => toggleProduct(product)} className="admin-icon-button shrink-0 p-2"><FiX /></button></li>)}</ul>}
                    <label className="block text-xs">Cari produk untuk dihubungkan<div className="relative mt-1"><FiSearch className="pointer-events-none absolute left-3 top-3" /><input className="admin-control w-full pl-9" maxLength={100} placeholder="Nama atau kode produk…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div></label>
                    {loading ? <p role="status" className="text-xs text-slate-500">Memuat produk…</p> : lookupError ? <p role="alert" className="text-xs text-red-600">{lookupError} <button type="button" className="underline" onClick={() => setRetry(current => current + 1)}>Coba lagi</button></p> : <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200">{results.map(product => <label key={product.id} className="flex cursor-pointer items-start gap-2 border-b border-slate-100 p-2.5 text-xs last:border-0"><input type="checkbox" disabled={busy} className="mt-0.5 shrink-0 rounded" checked={selected.some(item => item.id === product.id)} onChange={() => toggleProduct(product)} /><span className="min-w-0 break-words">{product.name}<small className="mt-1 block text-slate-500">{product.sku}</small></span></label>)}{results.length === 0 && <p className="p-3 text-xs text-slate-500">Produk tidak ditemukan.</p>}</div>}
                    <div className="flex justify-end"><Pagination currentPage={page} totalPages={lastPage} onPageChange={setPage} disabled={loading || busy} label="Halaman pilihan produk" /></div>
                </section>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Data'}</Button></div>
        </form>
    </Dialog>;
}
