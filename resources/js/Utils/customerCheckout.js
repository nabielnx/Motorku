import { createRequestId } from './checkout.js';
import { saveCustomerOrder } from './customerOrderStore.js';

export const CHECKOUT_ATTEMPT = 'tokom_checkout_attempt';
export const CHECKOUT_DRAFT = 'tokom_checkout_draft';
export function prepareCustomerCheckout(storage, display, details, uuid = createRequestId) {
    let existing;
    try { existing = JSON.parse(storage.getItem(CHECKOUT_ATTEMPT)); } catch { /* Replace corrupt data. */ }
    if (existing?.payload?.request_id) return existing;
    const attempt = { display, payload: {
        ...details, expected_total: Number(display.total), request_id: uuid(),
        items: display.cart.map(item => ({ product_id: item.id, quantity: item.qty, notes: item.notes || null })),
    } };
    try { storage.setItem(CHECKOUT_ATTEMPT, JSON.stringify(attempt)); }
    catch { throw new Error('Browser belum dapat menyimpan pesanan. Aktifkan penyimpanan atau gunakan browser lain sebelum mencoba kembali.'); }
    return attempt;
}
export function finishCustomerCheckout(storage, order) {
    if (!order?.id || !order?.customer_token) throw new Error('Respons pesanan belum lengkap. Coba periksa kembali dengan tombol yang sama.');
    const saved = saveCustomerOrder(storage, { ...order, order_id: order.id });
    // Never remove the cart/retry material before the access token is saved durably.
    if (saved.persisted) {
        try { ['tokom_pending_order', 'tokom_cart', 'tokom_cart_time', CHECKOUT_DRAFT, CHECKOUT_ATTEMPT, 'customer_checkout'].forEach(key => storage.removeItem(key)); }
        catch { /* The persisted request still retrieves the same order on a retry. */ }
    }
    return saved;
}
