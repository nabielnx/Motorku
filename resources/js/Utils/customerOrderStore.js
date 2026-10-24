const PREFIX = 'motorku_order:';
const ARCHIVED_KEY = 'motorku_archived_order_ids';
const CLEANUP_KEY = 'motorku_legacy_history_cleaned_v1';
const memory = new Map();
const safeParse = raw => { try { return JSON.parse(raw); } catch { return null; } };
export const orderId = order => order?.order_id || order?.id;
export function normalizeOrder(order) {
    return orderId(order) ? { ...order, order_id: orderId(order), customer_token: order.customer_token || order.customer_access_token, payment_preference: order.payment_preference || (order.payment_method === 'qris' ? 'qris' : 'kasir') } : null;
}
export function newerOrder(previous, incoming) {
    if (!previous) return normalizeOrder(incoming);
    const oldVersion = Number(previous.sync_version || 0);
    const newVersion = Number(incoming.sync_version || 0);
    if (newVersion < oldVersion) return previous;
    // Concurrent polls can return an older server snapshot at the same version.
    if (newVersion === oldVersion && previous.updated_at && incoming.updated_at && new Date(incoming.updated_at) < new Date(previous.updated_at)) return previous;
    return normalizeOrder({ ...previous, ...incoming, customer_token: incoming.customer_token || previous.customer_token });
}
export function readCustomerOrders(storage, { includeArchived = false } = {}) {
    const records = new Map();
    const add = value => { const row = normalizeOrder(value); if (row) records.set(row.order_id, newerOrder(records.get(row.order_id), row)); };
    try {
        const history = safeParse(storage.getItem('motorku_orders_history'));
        if (Array.isArray(history)) history.forEach(add);
        ['motorku_current_order', 'motorku_order_for_payment'].forEach(key => add(safeParse(storage.getItem(key))));
        (storage.keys?.() || []).filter(key => key.startsWith(PREFIX)).forEach(key => add(safeParse(storage.getItem(key))));
    } catch { /* Memory receipts remain usable if browser storage is unavailable. */ }
    const scope = storage.key(PREFIX);
    for (const [key, value] of memory) if (key.startsWith(scope)) add(value);
    const archived = includeArchived ? [] : archivedOrderIds(storage);
    return [...records.values()].filter(row => !archived.includes(row.order_id)).sort((a, b) => new Date(b.ordered_at || b.created_at || 0) - new Date(a.ordered_at || a.created_at || 0));
}
export function saveCustomerOrder(storage, incoming) {
    const id = orderId(incoming);
    if (!id) throw new Error('Nomor pesanan tidak tersedia.');
    const previous = readCustomerOrders(storage, { includeArchived: true }).find(row => row.order_id === id);
    const row = newerOrder(previous, incoming);
    const key = PREFIX + id;
    memory.set(storage.key(key), row);
    try { storage.setItem(key, JSON.stringify(row)); return { order: row, persisted: true }; }
    catch { return { order: row, persisted: false }; }
}

export function archivedOrderIds(storage) {
    try {
        const value = safeParse(storage.getItem(ARCHIVED_KEY));
        return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [];
    } catch { return []; }
}

export function archiveCustomerOrders(storage, candidates) {
    const ids = new Set(archivedOrderIds(storage));
    // Archive only closed local receipts, never an active order or a server record.
    candidates.filter(order => ['completed', 'cancelled'].includes(order.order_status)).forEach(order => ids.add(orderId(order)));
    storage.setItem(ARCHIVED_KEY, JSON.stringify([...ids]));
    return ids.size;
}

export function cleanLegacyCustomerOrders(storage, unavailableIds) {
    if (storage.getItem(CLEANUP_KEY) === '1') return;
    const candidates = readCustomerOrders(storage).filter(order => unavailableIds.includes(order.order_id));
    archiveCustomerOrders(storage, candidates);
    storage.setItem(CLEANUP_KEY, '1');
}

export function restoreArchivedCustomerOrders(storage) {
    storage.removeItem(ARCHIVED_KEY);
    // Keep the one-time cleanup marker so restored receipts stay visible.
}
