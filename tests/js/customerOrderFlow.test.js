import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { businessStorage } from '../../resources/js/Utils/storefrontContext.js';
import { readCustomerOrders, saveCustomerOrder } from '../../resources/js/Utils/customerOrderStore.js';
import { customerOrderState } from '../../resources/js/Utils/customerOrderState.js';
import { customerOrderStatus } from '../../resources/js/Api/customerOrders.js';

function rawStorage() {
    const data = new Map();
    return { get length() { return data.size; }, key: index => [...data.keys()][index], getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
const row = (id, version = 1) => ({ order_id: id, customer_token: 'x'.repeat(64), order_status: 'pending', payment_status: 'unpaid', sync_version: version });

test('a stale tab cannot erase a newly created receipt, including after a legacy history write', () => {
    const raw = rawStorage();
    const tab1 = businessStorage('multi-tab', raw);
    const tab2 = businessStorage('multi-tab', raw);
    const old = row('old');
    tab1.setItem('motorku_orders_history', JSON.stringify([old]));
    saveCustomerOrder(tab2, row('new'));
    saveCustomerOrder(tab1, { ...old, sync_version: 2, order_status: 'preparing' });
    tab1.setItem('motorku_orders_history', JSON.stringify([old]));
    assert.deepEqual(new Set(readCustomerOrders(tab2).map(row => row.order_id)), new Set(['old', 'new']));
    assert.equal(readCustomerOrders(tab2).find(row => row.order_id === 'old').order_status, 'preparing');
});

test('history, current receipt and payment backup are merged even when history is not empty', () => {
    const storage = businessStorage('backups', rawStorage());
    storage.setItem('motorku_orders_history', JSON.stringify([row('history')]));
    storage.setItem('motorku_current_order', JSON.stringify(row('current')));
    storage.setItem('motorku_order_for_payment', JSON.stringify(row('payment')));
    assert.equal(readCustomerOrders(storage).length, 3);
});

test('out-of-order server responses cannot regress status or discard a refund', () => {
    const storage = businessStorage('versions', rawStorage());
    saveCustomerOrder(storage, { ...row('order', 5), order_status: 'completed', payment_status: 'paid', refunded_amount: 10000 });
    saveCustomerOrder(storage, row('order', 3));
    const latest = readCustomerOrders(storage)[0];
    assert.equal(latest.sync_version, 5);
    assert.equal(latest.refunded_amount, 10000);
    assert.equal(latest.order_status, 'completed');
});

test('a failed receipt write preserves access in memory without pretending it is durable', () => {
    const raw = rawStorage();
    raw.setItem = () => { throw new Error('QuotaExceeded'); };
    const storage = businessStorage('storage-failure', raw);
    const saved = saveCustomerOrder(storage, row('receipt'));
    assert.equal(saved.persisted, false);
    assert.equal(readCustomerOrders(storage)[0].customer_token, 'x'.repeat(64));
    assert.equal(readCustomerOrders(businessStorage('another-shop', raw)).length, 0);
});

test('cancelled and expired orders take precedence over unpaid messaging and never expose payment actions', () => {
    for (const reason of ['customer', 'expired']) {
        const state = customerOrderState({ ...row('order'), order_status: 'cancelled', cancel_reason: reason, connection: 'fresh' });
        assert.equal(state.canPay, false);
        assert.equal(state.canCancel, false);
        assert.equal(state.title, reason === 'expired' ? 'Pesanan kedaluwarsa' : 'Pesanan dibatalkan');
    }
});

test('review pauses expiry; cached and inaccessible orders cannot accept financial actions', () => {
    const report = { ...row('order'), payment_review_requested_at: '2026-10-25T01:00:00Z', expires_at: '2026-10-25T01:15:00Z', connection: 'fresh' };
    const review = customerOrderState(report, new Date('2026-10-25T02:00:00Z').getTime());
    assert.equal(review.review, true); assert.equal(review.expired, false); assert.equal(review.canPay, false); assert.equal(review.canCancel, false);
    for (const connection of ['stale', 'unavailable', undefined]) {
        assert.equal(customerOrderState({ ...row('order'), connection }).canPay, false);
        assert.equal(customerOrderState({ ...row('order'), connection }).canCancel, false);
    }
});

test('refunds remain explicit even after fulfillment is completed', () => {
    assert.equal(customerOrderState({ ...row('order'), order_status: 'completed', payment_status: 'paid', refunded_amount: 10000 }).payment, 'Refund sebagian');
    assert.equal(customerOrderState({ ...row('order'), order_status: 'completed', payment_status: 'refunded' }).payment, 'Dana dikembalikan');
});

test('status authentication travels in a header, never in a URL parameter', async () => {
    const previous = axios.defaults.adapter;
    axios.defaults.adapter = async config => {
        assert.equal(config.params, undefined);
        assert.equal(config.headers['X-Customer-Token'], 'secret');
        assert.equal(config.url.includes('secret'), false);
        return { config, status: 200, headers: {}, data: { data: { id: 'order' } } };
    };
    try { assert.deepEqual(await customerOrderStatus('order', 'secret'), { id: 'order' }); }
    finally { axios.defaults.adapter = previous; }
});

test('ambiguous checkout retries preserve the entire payload and request ID after a reload', async () => {
    const { prepareCustomerCheckout } = await import('../../resources/js/Utils/customerCheckout.js');
    const storage = businessStorage('attempts', rawStorage());
    const cart = { total: 30000, cart: [{ id: 'product', qty: 2 }] };
    const first = prepareCustomerCheckout(storage, cart, { customer_name: 'First', payment_preference: 'qris' }, () => 'stable-id');
    const retry = prepareCustomerCheckout(storage, { ...cart, total: 40000 }, { customer_name: 'Changed', payment_preference: 'kasir' }, () => 'different-id');
    assert.deepEqual(retry, first);
});

test('checkout never sends without durable retry material and never clears cart before the receipt is saved', async () => {
    const { prepareCustomerCheckout, finishCustomerCheckout, CHECKOUT_ATTEMPT } = await import('../../resources/js/Utils/customerCheckout.js');
    const raw = rawStorage();
    const storage = businessStorage('receipt-cleanup', raw);
    const cart = { total: 30000, cart: [{ id: 'product', qty: 2 }] };
    storage.setItem('motorku_cart', JSON.stringify(cart));
    prepareCustomerCheckout(storage, cart, { customer_name: 'Name', payment_preference: 'qris' }, () => 'request');
    const original = raw.setItem;
    raw.setItem = () => { throw new Error('QuotaExceeded'); };
    assert.equal(finishCustomerCheckout(storage, { ...row('saved-order'), id: 'saved-order' }).persisted, false);
    assert.notEqual(storage.getItem('motorku_cart'), null);
    assert.notEqual(storage.getItem(CHECKOUT_ATTEMPT), null);
    assert.throws(() => prepareCustomerCheckout(businessStorage('no-write', raw), cart, {}, () => 'id'), /Browser belum dapat menyimpan/);
    raw.setItem = original;
    assert.equal(finishCustomerCheckout(storage, { ...row('saved-order'), id: 'saved-order' }).persisted, true);
    assert.equal(storage.getItem('motorku_cart'), null);
    assert.equal(storage.getItem(CHECKOUT_ATTEMPT), null);
});

test('legacy access-token fields are retained when loading older receipts', () => {
    const storage = businessStorage('legacy-access', rawStorage());
    const old = { ...row('legacy') };
    delete old.customer_token;
    old.customer_access_token = 'legacy-secret';
    storage.setItem('motorku_orders_history', JSON.stringify([old]));
    assert.equal(readCustomerOrders(storage)[0].customer_token, 'legacy-secret');
});

test('one-time cleanup hides only inaccessible closed receipts and can restore them without data loss', async () => {
    const { cleanLegacyCustomerOrders, archivedOrderIds, restoreArchivedCustomerOrders } = await import('../../resources/js/Utils/customerOrderStore.js');
    const storage = businessStorage('cleanup', rawStorage());
    const valid = { ...row('valid'), order_status: 'completed', payment_status: 'paid' };
    const old = { ...row('old'), order_status: 'cancelled' };
    const active = row('active');
    [valid, old, active].forEach(order => saveCustomerOrder(storage, order));
    cleanLegacyCustomerOrders(storage, ['old', 'active']);
    assert.deepEqual(archivedOrderIds(storage), ['old']);
    assert.deepEqual(new Set(readCustomerOrders(storage).map(order => order.order_id)), new Set(['valid', 'active']));
    assert.equal(readCustomerOrders(storage, { includeArchived: true }).length, 3);
    restoreArchivedCustomerOrders(storage);
    cleanLegacyCustomerOrders(storage, ['old']);
    assert.equal(readCustomerOrders(storage).length, 3);
});

test('archiving is scoped to each shop and never removes the original legacy history', async () => {
    const { archiveCustomerOrders } = await import('../../resources/js/Utils/customerOrderStore.js');
    const raw = rawStorage();
    const storage = businessStorage('cleanup-shop', raw);
    const other = businessStorage('other-cleanup-shop', raw);
    const legacy = { ...row('closed'), order_status: 'completed' };
    storage.setItem('motorku_orders_history', JSON.stringify([legacy]));
    archiveCustomerOrders(storage, [legacy]);
    assert.equal(readCustomerOrders(storage).length, 0);
    assert.equal(JSON.parse(storage.getItem('motorku_orders_history')).length, 1);
    assert.equal(readCustomerOrders(other).length, 0);
});
