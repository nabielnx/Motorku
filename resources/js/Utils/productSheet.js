import { z } from 'zod';

export const sheetFileSchema = z.custom(value => value && typeof value.name === 'string', 'Pilih file terlebih dahulu.')
    .refine(file => /\.(xlsx|csv)$/i.test(file.name), 'Gunakan Excel (.xlsx) atau CSV (.csv).')
    .refine(file => file.size > 0 && file.size <= 4 * 1024 * 1024, 'Ukuran file maksimal 4 MB.');

export const sheetPreviewSchema = z.object({
    token: z.uuid(),
    mode: z.enum(['add', 'upsert', 'update']),
    default_group: z.enum(['automotive', 'electronics', 'hardware', 'bicycle']),
    use_estimated_cost: z.boolean(),
    sheets: z.array(z.object({
        id: z.number().int().nonnegative(),
        mapping: z.record(z.string(), z.number().int().min(0).max(39).nullable()),
    }).superRefine((sheet, context) => {
        const columns = Object.values(sheet.mapping).filter(value => value !== null);
        if (new Set(columns).size !== columns.length) {
            context.addIssue({ code: 'custom', message: 'Satu kolom hanya boleh dipakai untuk satu informasi.' });
        }
        for (const [field, label] of [['name', 'Nama Barang'], ['price', 'Harga Jual'], ['category', 'Kategori']]) {
            if (sheet.mapping[field] == null) {
                context.addIssue({ code: 'custom', message: `Cocokkan kolom ${label} pada setiap tab yang dipilih.` });
            }
        }
    })).min(1, 'Pilih minimal satu tab.'),
});

export function selectableSheetRows(rows) {
    return rows.filter(row => row.errors.length === 0 && row.action !== 'skip').map(row => row.id);
}

export function sheetError(error) {
    return Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message || 'Proses gagal. Coba lagi.';
}
