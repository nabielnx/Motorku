import { z } from 'zod';

export const MAX_BULK_DELETE = 5000;
export const emptyProductSelection = () => ({ mode: 'ids', ids: [] });
export const productSelectionScope = filters => JSON.stringify([
    filters.group || '', (filters.search || '').trim(), filters.category || 'All',
    filters.stock_status || 'all', filters.availability || 'all',
]);
export const isProductSelected = (selection, id) => selection.mode === 'filtered'
    ? !selection.excluded_ids.includes(id) : selection.ids.includes(id);
export const productSelectionCount = (selection, total) => selection.mode === 'filtered'
    ? Math.max(0, total - selection.excluded_ids.length) : selection.ids.length;

export function toggleProductSelection(selection, id) {
    const field = selection.mode === 'filtered' ? 'excluded_ids' : 'ids';
    const ids = selection[field];
    return { ...selection, [field]: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id] };
}

export function selectProductPage(selection, pageIds, checked) {
    const field = selection.mode === 'filtered' ? 'excluded_ids' : 'ids';
    const add = selection.mode === 'filtered' ? !checked : checked;
    return { ...selection, [field]: add ? [...new Set([...selection[field], ...pageIds])]
        : selection[field].filter(id => !pageIds.includes(id)) };
}

const ids = z.array(z.string().uuid()).max(MAX_BULK_DELETE);
const filters = z.object({
    group: z.string().optional(), search: z.string().max(200).optional(),
    category: z.string().max(255).optional(),
    stock_status: z.enum(['all', 'low', 'out', 'normal']).optional(),
    availability: z.enum(['all', 'active', 'inactive']).optional(),
});
export const productDeleteSelectionSchema = z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('ids'), ids: ids.min(1) }),
    z.object({ mode: z.literal('filtered'), excluded_ids: ids, filters }),
]);
export const productDeletePreviewSchema = z.object({
    count: z.number().int().min(1).max(MAX_BULK_DELETE), token: z.string().min(1),
});
