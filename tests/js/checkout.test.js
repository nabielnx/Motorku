import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { webcrypto } from 'node:crypto';
import { checkoutRequestId, createRequestId } from '../../resources/js/Utils/checkout.js';

test('checkout without randomUUID creates a valid UUID and keeps it across retries', () => {
    const data = new Map();
    const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
    const cryptoApi = { getRandomValues: buffer => webcrypto.getRandomValues(buffer) };
    const uuid = () => createRequestId(cryptoApi);
    const cart = { items: [{ product_id: 'product', quantity: 1 }] };
    const id = checkoutRequestId(storage, 'pos', cart, uuid);

    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(checkoutRequestId(storage, 'pos', JSON.parse(JSON.stringify(cart)), uuid), id);
    assert.notEqual(checkoutRequestId(storage, 'pos', { items: [{ product_id: 'product', quantity: 2 }] }, uuid), id);
});

test('request IDs use native randomUUID when available and reject a missing random source', () => {
    const nativeId = webcrypto.randomUUID();
    assert.equal(createRequestId({ randomUUID: () => nativeId }), nativeId);
    assert.throws(() => createRequestId({}), /Browser tidak mendukung pembuatan ID transaksi/);
});

test('a timeout and page reload preserve checkout identity; a new cart gets a new identity', () => {
    const data = new Map();
    const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
    let count = 0;
    const uuid = () => `request-${++count}`;
    const cart = { items: [{ product_id: 'product', quantity: 1 }], amount_received: 10000 };
    const first = checkoutRequestId(storage, 'pos', cart, uuid);
    assert.equal(checkoutRequestId(storage, 'pos', JSON.parse(JSON.stringify(cart)), uuid), first);
    assert.notEqual(checkoutRequestId(storage, 'pos', { ...cart, amount_received: 20000 }, uuid), first);
    storage.removeItem('pos');
    assert.notEqual(checkoutRequestId(storage, 'pos', cart, uuid), first);
});

test('the interceptor exposes POS data while retaining the legacy payment response shape', async () => {
    globalThis.window = {};
    await import('../../resources/js/bootstrap.js');
    const fixture = { order: { id: 'order', total: 10000 }, payment: { invoice_number: 'INV-20261006-0001', amount_received: 20000, change_amount: 10000 } };
    const previous = axios.defaults.adapter;
    axios.defaults.adapter = async config => ({ config, status: 201, headers: {}, data: { success: true, message: 'Saved', data: fixture } });
    try {
        const pos = await axios.post('/api/orders/pos-sale', {});
        assert.deepEqual(pos.data, fixture);
        axios.defaults.adapter = async config => ({ config, status: 201, headers: {}, data: { message: 'Paid', data: fixture.payment } });
        const payment = await axios.post('/api/payments', {});
        assert.equal(payment.data.data.invoice_number, fixture.payment.invoice_number);
    } finally {
        axios.defaults.adapter = previous;
        delete globalThis.window;
    }
});
