import { z } from 'zod';

export const sheetFileSchema = z.custom(value => value && typeof value.name === 'string', 'Pilih file terlebih dahulu.')
    .refine(file => /\.(xlsx|csv)$/i.test(file.name), 'Gunakan Excel (.xlsx) atau CSV (.csv).')
    .refine(file => file.size > 0 && file.size <= 10 * 1024 * 1024, 'Ukuran file maksimal 10 MB.');

export const sheetPreviewSchema = z.object({
    token: z.uuid(),
    mode: z.enum(['add', 'upsert', 'update']),
    default_group: z.string().min(1, 'Pilih jenis produk untuk impor.'),
    use_estimated_cost: z.boolean(),
    update_stock: z.boolean().default(false),
    category_parents: z.array(z.object({
        key: z.string().regex(/^[a-f0-9]{64}$/),
        parent_id: z.uuid().nullable(),
    })).max(2000).refine(choices => new Set(choices.map(choice => choice.key)).size === choices.length, 'Induk kategori tidak boleh dipilih lebih dari sekali.').optional(),
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

export function sheetPreviewSchemaForGroups(groups) {
    return sheetPreviewSchema.extend({
        default_group: z.string().refine(value => Object.hasOwn(groups, value), 'Pilih jenis produk yang tersedia di toko.'),
    });
}

export function defaultSheetGroup(groups, selectedGroup) {
    return selectedGroup && Object.hasOwn(groups, selectedGroup) ? selectedGroup : Object.keys(groups)[0] ?? '';
}

export function selectableSheetRows(rows) {
    return rows.filter(row => row.errors.length === 0 && row.action !== 'skip').map(row => row.id);
}

export function newSheetCategories(rows) {
    return [...new Map(rows.filter(row => row.action === 'create' && !row.category_id)
        .map(row => [row.category_key, row])).values()];
}

export function sheetParentChoices(rows, key, parentId) {
    return newSheetCategories(rows).map(row => ({
        key: row.category_key,
        parent_id: row.category_key === key ? parentId : row.category_parent_id ?? null,
    }));
}

export function sheetCostPreview(row) {
    const before = row.old_cost_price == null ? null : Number(row.old_cost_price);
    const incoming = row.data.cost_price == null ? null : Number(row.data.cost_price);
    if (row.action === 'skip') return { before, after: before, state: 'skipped', source: null };
    const after = incoming === null && row.action === 'update' ? before : incoming;
    const state = row.action === 'update' && (incoming === null || incoming === before) ? 'kept' : after === null ? 'empty' : 'set';
    return { before, after, state, source: row.cost_source ?? null };
}

export function sheetColumnMapping(mapping, field, column) {
    const next = { ...mapping, [field]: column };
    if (column !== null && (field === 'cost_price' || field === 'estimated_cost')) {
        const other = field === 'cost_price' ? 'estimated_cost' : 'cost_price';
        if (next[other] === column) next[other] = null;
    }
    return next;
}

export function sheetError(error) {
    return Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message || 'Proses gagal. Coba lagi.';
}
