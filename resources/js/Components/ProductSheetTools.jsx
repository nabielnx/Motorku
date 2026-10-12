import { useState } from 'react';
import { DialogTitle } from '@headlessui/react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiDownload, FiUpload, FiX } from 'react-icons/fi';
import Modal from '@/Components/Modal';
import { sheetError, sheetFileSchema, sheetPreviewSchema, selectableSheetRows } from '@/Utils/productSheet';

const groups = { automotive: 'Otomotif', bicycle: 'Sepeda', electronics: 'Elektronik', hardware: 'Alat Bangunan' };
const money = value => value == null ? '—' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const control = 'w-full rounded-lg border-slate-300 text-sm dark:border-slate-600 dark:bg-slate-800';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50';
const primary = 'rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50';

export default function ProductSheetTools({ selectedGroup }) {
    const [dialog, setDialog] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [draft, setDraft] = useState(null);
    const [sheets, setSheets] = useState([]);
    const [preview, setPreview] = useState(null);
    const [selected, setSelected] = useState([]);
    const [mode, setMode] = useState('add');
    const [defaultGroup, setDefaultGroup] = useState(selectedGroup || 'automotive');
    const [estimated, setEstimated] = useState(false);
    const [exportGroup, setExportGroup] = useState('');
    const [format, setFormat] = useState('xlsx');
    const close = () => {
        if (busy) return;
        setDialog(null); setDraft(null); setPreview(null); setFile(null); setError(''); setSelected([]);
        setMode('add'); setEstimated(false);
    };
    const run = async action => {
        setBusy(true); setError('');
        try { await action(); } catch (err) { setError(sheetError(err)); } finally { setBusy(false); }
    };
    const inspect = () => run(async () => {
        const validated = sheetFileSchema.safeParse(file);
        if (!validated.success) throw new Error(validated.error.issues[0].message);
        const form = new FormData(); form.append('file', file);
        const { data } = await axios.post(route('api.products.sheets.inspect'), form);
        setDraft(data); setSheets(data.sheets.map(sheet => ({ ...sheet, enabled: true })));
    });
    const buildPreview = () => run(async () => {
        const input = { token: draft.token, mode, default_group: defaultGroup, use_estimated_cost: estimated,
            sheets: sheets.filter(sheet => sheet.enabled).map(({ id, mapping }) => ({ id, mapping })) };
        const valid = sheetPreviewSchema.safeParse(input);
        if (!valid.success) throw new Error(valid.error.issues[0].message);
        const { data } = await axios.post(route('api.products.sheets.preview'), valid.data);
        setPreview(data); setSelected(selectableSheetRows(data.rows));
    });
    const commit = () => run(async () => {
        const { data } = await axios.post(route('api.products.sheets.commit'), { token: draft.token, revision: preview.revision, rows: selected });
        toast.success(`${data.created} barang ditambahkan, ${data.updated} harga diperbarui.`);
        setDialog(null); setDraft(null); setPreview(null); setFile(null); setSelected([]);
        setMode('add'); setEstimated(false);
        router.reload({ only: ['initialProducts', 'initialCategories', 'lowStockCount', 'outOfStockCount'] });
    });
    const changeSheet = (id, change) => setSheets(current => current.map(sheet => sheet.id === id ? { ...sheet, ...change } : sheet));
    const eligible = preview ? selectableSheetRows(preview.rows) : [];

    return <>
        <button type="button" className={secondary} onClick={() => { setDialog('import'); setError(''); }}><FiUpload aria-hidden="true" />Impor</button>
        <button type="button" className={secondary} onClick={() => { setDialog('export'); setError(''); }}><FiDownload aria-hidden="true" />Ekspor</button>
        <Modal show={dialog !== null} onClose={close} closeable={!busy} maxWidth="5xl">
            <div className="max-h-[85dvh] w-full overflow-y-auto p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <DialogTitle className="text-lg font-bold">{dialog === 'export' ? 'Ekspor daftar barang' : 'Impor daftar barang'}</DialogTitle>
                    <button type="button" onClick={close} disabled={busy} aria-label="Tutup" className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><FiX /></button>
                </div>
                {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
                {dialog === 'export' ? <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Kolom tetap bahasa Indonesia. Kode Barang membantu mencocokkan barang saat diimpor kembali. Harga beli dan stok ikut tercantum.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">Barang yang diekspor<select className={`${control} mt-1`} value={exportGroup} onChange={event => setExportGroup(event.target.value)}><option value="">Seluruh katalog</option>{Object.entries(groups).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                        <label className="text-sm">Format file<select className={`${control} mt-1`} value={format} onChange={event => setFormat(event.target.value)}><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option></select></label>
                    </div>
                    <a className={`${primary} inline-block`} href={route('api.products.sheets.export', { format, ...(exportGroup ? { group: exportGroup } : {}) })}>Unduh daftar barang</a>
                </div> : !draft ? <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Dari Google Sheets: buka <strong>File → Download → Microsoft Excel (.xlsx)</strong>. Semua tab akan ikut terbaca. Bisa juga memakai CSV UTF-8 untuk satu tab.</p>
                    <label className="block text-sm font-medium">Pilih file (maksimal 4 MB, 2.000 barang)<input type="file" accept=".xlsx,.csv" className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2" onChange={event => { setFile(event.target.files?.[0] || null); setError(''); }} /></label>
                    <p className="text-sm">Kolom wajib: Nama Barang, Kategori, dan Harga Jual. Kolom lain boleh kosong. Gambar serta kecocokan motor dapat ditambahkan setelah impor.</p>
                    <div className="flex flex-wrap items-center gap-3"><button type="button" className={primary} onClick={inspect} disabled={busy || !file}>{busy ? 'Membaca file…' : 'Baca file'}</button><a className="text-sm underline" href={route('api.products.sheets.template')}>Unduh template Excel</a></div>
                </div> : !preview ? <div className="space-y-4">
                    <p className="text-sm">Periksa pencocokan kolom. Tab yang tidak ingin diimpor bisa dilepas centangnya. Margin dihitung dari harga jual dan modal, sehingga tidak perlu dicocokkan.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm">Cara impor<select className={`${control} mt-1`} value={mode} onChange={event => setMode(event.target.value)}><option value="add">Tambah barang baru saja</option><option value="upsert">Tambah baru + perbarui harga barang lama</option><option value="update">Perbarui harga barang lama saja</option></select></label>
                        <label className="text-sm">Grup jika kolom Grup Barang kosong<select className={`${control} mt-1`} value={defaultGroup} onChange={event => setDefaultGroup(event.target.value)}>{Object.entries(groups).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                    </div>
                    <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-slate-800"><input type="checkbox" checked={estimated} onChange={event => setEstimated(event.target.checked)} className="mt-1 rounded" /><span>Gunakan <strong>Estimasi Modal</strong> sebagai harga beli. Centang hanya jika angkanya sudah kamu periksa. Harga Beli yang terisi lebih diutamakan.</span></label>
                    {sheets.map(sheet => <details key={sheet.id} open={sheets.length === 1} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                        <summary className="cursor-pointer text-sm font-semibold">{sheet.name} · {sheet.count} baris</summary>
                        <label className="my-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={sheet.enabled} onChange={event => changeSheet(sheet.id, { enabled: event.target.checked })} className="rounded" />Impor tab ini</label>
                        {sheet.enabled && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(draft.fields).map(([field, label]) => <label key={field} className="min-w-0 text-sm">{label}{['name', 'price', 'category'].includes(field) ? ' *' : ''}<select className={`${control} mt-1`} value={sheet.mapping[field] ?? ''} onChange={event => changeSheet(sheet.id, { mapping: { ...sheet.mapping, [field]: event.target.value === '' ? null : Number(event.target.value) } })}><option value="">Tidak digunakan</option>{sheet.headers.map((header, index) => <option key={index} value={index}>{index + 1}. {header || '(tanpa judul)'}</option>)}</select></label>)}</div>}
                    </details>)}
                    <div className="flex flex-wrap gap-2"><button className={secondary} type="button" disabled={busy} onClick={() => { setDraft(null); setError(''); }}>Ganti file</button><button className={primary} type="button" disabled={busy} onClick={buildPreview}>{busy ? 'Memeriksa…' : 'Lihat pratinjau'}</button></div>
                </div> : <div className="space-y-4">
                    <p className="text-sm">{preview.rows.length} baris diperiksa · {eligible.length} dapat disimpan · {preview.rows.filter(row => row.errors.length > 0).length} bermasalah · {preview.rows.filter(row => row.action === 'skip').length} dilewati.</p>
                    <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Barang lama dicocokkan menggunakan Kode Barang, atau nama lengkap dan merek jika kode kosong. Periksa nama hasil pencocokan sebelum menyimpan. Pembaruan harga tidak mengubah stok, gambar, nama, kategori, dan satuan.</p>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={eligible.length > 0 && selected.length === eligible.length} onChange={event => setSelected(event.target.checked ? eligible : [])} />Pilih semua baris valid ({selected.length} dipilih)</label>
                    <div className="max-h-[45vh] overflow-auto rounded-lg border dark:border-slate-700">
                        <table className="w-full min-w-[650px] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-slate-700"><tr><th className="p-3">Pilih</th><th className="p-3">Barang / asal</th><th className="p-3">Tindakan & harga</th><th className="p-3">Catatan</th></tr></thead><tbody>{preview.rows.map(row => <tr key={row.id} className="border-t align-top dark:border-slate-700">
                            <td className="p-3"><input type="checkbox" className="rounded" aria-label={`Pilih ${row.data.name || `baris ${row.number}`}`} disabled={row.errors.length > 0 || row.action === 'skip' || busy} checked={selected.includes(row.id)} onChange={event => setSelected(current => event.target.checked ? [...current, row.id] : current.filter(id => id !== row.id))} /></td>
                            <td className="max-w-xs p-3"><p className="font-semibold">{row.data.name || '(nama kosong)'}</p><p className="mt-1 text-xs">Merek: {row.data.brand || '—'}{row.data.sku && <><br />Kode: {row.data.sku}</>}</p><p className="mt-1 text-xs text-slate-500">{row.sheet} · Baris {row.number}<br />{groups[row.group]} · {row.category}</p>{row.matched_name && <p className="mt-1 text-xs">Cocok: {row.matched_name}</p>}</td>
                            <td className="p-3"><p className="font-semibold">{{ create: 'Tambah baru', update: 'Perbarui harga', skip: 'Dilewati' }[row.action]}</p>{row.old_price != null && <p className="text-xs">{money(row.old_price)} →</p>}<p>{money(row.data.price)}</p><p className="mt-1 text-xs">Modal: {money(row.data.cost_price)}</p></td>
                            <td className="max-w-xs p-3 text-xs">{row.errors.map((message, i) => <p key={`error-${i}`} className="mb-1 text-red-600">{message}</p>)}{row.warnings.map((message, i) => <p key={`warning-${i}`} className="mb-1 text-slate-500 dark:text-slate-400">{message}</p>)}</td>
                        </tr>)}</tbody></table>
                    </div>
                    <p className="text-xs text-slate-500">Baris bermasalah tidak akan disimpan. Perbaiki file lalu upload ulang. Pratinjau berlaku 30 menit.</p>
                    <div className="flex flex-wrap gap-2"><button className={secondary} type="button" disabled={busy} onClick={() => { setPreview(null); setError(''); }}>Ubah pencocokan</button><button className={primary} type="button" disabled={busy || selected.length === 0} onClick={commit}>{busy ? 'Menyimpan…' : `Simpan ${selected.length} barang`}</button></div>
                </div>}
            </div>
        </Modal>
    </>;
}
