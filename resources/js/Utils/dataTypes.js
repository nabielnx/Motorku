import { z } from 'zod';

export const fieldTypeLabels = { text: 'Teks', textarea: 'Teks panjang', number: 'Angka', date: 'Tanggal', select: 'Pilihan', boolean: 'Ya / Tidak' };
export const dataTypeSchema = z.object({
    kind: z.enum(['product', 'reference']),
    name: z.string().trim().min(1, 'Nama jenis wajib diisi.').max(80),
    is_public: z.boolean().optional(),
    fields: z.array(z.object({
        key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/, 'Kode kolom harus diawali huruf kecil, tanpa spasi.').refine(key => !['constructor', 'prototype'].includes(key), 'Kode kolom tidak dapat digunakan.'),
        label: z.string().trim().min(1, 'Nama kolom wajib diisi.').max(80),
        type: z.enum(['text', 'textarea', 'number', 'date', 'select', 'boolean']),
        required: z.boolean(),
        options: z.array(z.string().trim().min(1).max(100)).max(30),
    })).max(20, 'Maksimal 20 kolom.'),
}).superRefine((data, context) => {
    const keys = data.fields.map(field => field.key);
    if (new Set(keys).size !== keys.length) context.addIssue({ code: 'custom', path: ['fields'], message: 'Kode kolom tidak boleh sama.' });
    if (data.kind === 'product' && data.fields.length) context.addIssue({ code: 'custom', message: 'Kolom fleksibel digunakan pada referensi.' });
    if (data.kind === 'product' && data.is_public !== undefined) context.addIssue({ code: 'custom', path: ['is_public'], message: 'Pengaturan katalog ini hanya untuk jenis referensi.' });
    data.fields.forEach((field, index) => {
        if (field.type === 'select' && (!field.options.length || new Set(field.options).size !== field.options.length)) {
            context.addIssue({ code: 'custom', path: ['fields', index, 'options'], message: 'Isi pilihan yang tidak ganda, satu per baris.' });
        }
    });
});

export function referenceEntrySchema(fields) {
    const shape = Object.fromEntries(fields.map(field => {
        let schema;
        if (field.type === 'number') schema = z.number({ error: `${field.label} harus berupa angka.` }).finite().min(-1e12).max(1e12);
        else if (field.type === 'boolean') schema = z.boolean({ error: `Pilih Ya atau Tidak untuk ${field.label}.` });
        else if (field.type === 'date') schema = z.iso.date();
        else if (field.type === 'select') schema = z.string().refine(value => field.options.includes(value), `Pilih ${field.label}.`);
        else schema = z.string().trim().min(1, `${field.label} wajib diisi.`).max(field.type === 'textarea' ? 2000 : 255);
        if (!field.required) schema = schema.nullable().optional();
        return [field.key, z.preprocess(value => value === '' || value == null ? (field.required ? undefined : null) : field.type === 'number' ? Number(value) : value, schema)];
    }));
    return z.object({ name: z.string().trim().min(1, 'Nama wajib diisi.').max(160), description: z.string().max(2000), values: z.object(shape).strict() });
}

export const dataTypeError = error => Object.values(error.response?.data?.errors ?? {}).flat().join(' ') || error.message || 'Gagal menyimpan data.';
export const fieldKey = label => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[0-9]+/, '').slice(0, 32) || 'kolom';
export function displayReferenceValue(field, value) {
    if (value == null || value === '') return '—';
    if (field.type === 'boolean') return value ? 'Ya' : 'Tidak';
    if (field.type === 'number') return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 8 }).format(value);
    return String(value);
}
