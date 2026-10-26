import test from 'node:test';
import assert from 'node:assert/strict';
import { businessStorage, customerStorage, LEGACY_BUSINESS_ID } from '../../resources/js/Utils/storefrontContext.js';
import { prepareCustomerCheckout } from '../../resources/js/Utils/customerCheckout.js';
import { readCustomerOrders, saveCustomerOrder } from '../../resources/js/Utils/customerOrderStore.js';

function nativeStorage() {
    const values = new Map();
    return {
        get length() { return values.size; }, key: index => [...values.keys()][index],
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key),
    };
}

test('old carts migrate on read and stay synchronized with tabs running the previous version', () => {
    const raw = nativeStorage();
    raw.setItem('motorku_cart', '[{"id":"old","qty":1}]');
    const current = businessStorage(LEGACY_BUSINESS_ID, raw);
    assert.equal(current.getItem('tokom_cart'), raw.getItem('motorku_cart'));
    assert.equal(raw.getItem('tokom_cart'), raw.getItem('motorku_cart'));
    current.setItem('tokom_cart', '[{"id":"new","qty":2}]');
    assert.equal(raw.getItem('motorku_cart'), raw.getItem('tokom_cart'));
    raw.setItem('motorku_cart', '[{"id":"old-tab","qty":3}]');
    assert.equal(current.getItem('tokom_cart'), '[{"id":"old-tab","qty":3}]');
    assert.equal(raw.getItem('tokom_cart'), raw.getItem('motorku_cart'));
    assert.deepEqual(current.keys().filter(key => key.endsWith('_cart')), ['tokom_cart']);
    current.removeItem('tokom_cart');
    assert.equal(raw.getItem('motorku_cart'), null);
    assert.equal(raw.getItem('tokom_cart'), null);
    assert.equal(current.getItem('tokom_cart'), null);
});

test('migration respects shop and customer boundaries and preserves the shared shopping cart', () => {
    const raw = nativeStorage();
    raw.setItem('business:a:motorku_cart', 'cart-a');
    raw.setItem('business:b:motorku_cart', 'cart-b');
    raw.setItem('business:a:user:customer:alice:motorku_order:secret', JSON.stringify({ order_id: 'secret', customer_token: 'private' }));
    const alice = customerStorage('a', raw, 'alice');
    const bob = customerStorage('a', raw, 'bob');
    const guest = customerStorage('a', raw);
    assert.equal(alice.getItem('tokom_cart'), 'cart-a');
    assert.equal(bob.getItem('tokom_cart'), 'cart-a');
    assert.equal(customerStorage('b', raw).getItem('tokom_cart'), 'cart-b');
    assert.equal(readCustomerOrders(alice)[0].customer_token, 'private');
    assert.equal(readCustomerOrders(bob).length, 0);
    assert.equal(readCustomerOrders(guest).length, 0);
    assert.equal(raw.getItem('business:b:user:customer:alice:tokom_order:secret'), null);
    assert.equal(alice.matchesEventKey('business:a:user:customer:alice:motorku_order:secret'), true);
    assert.equal(alice.matchesEventKey('business:a:user:customer:alice:tokom_order:secret'), true);
    assert.equal(alice.matchesEventKey('business:a:motorku_cart'), true);
    assert.equal(alice.matchesEventKey('business:a:user:customer:bob:tokom_order:secret'), false);
    assert.equal(alice.matchesEventKey('business:b:tokom_cart'), false);
    assert.equal(guest.matchesEventKey('business:a:user:customer:alice:motorku_order:secret'), false);
});

test('a migrated checkout reuses the original request ID and exact payload after a reload', () => {
    const raw = nativeStorage();
    const attempt = { display: { total: 1000 }, payload: { request_id: 'original-id', expected_total: 1000, items: [{ product_id: 'p', quantity: 1 }] } };
    raw.setItem('business:checkout:motorku_checkout_attempt', JSON.stringify(attempt));
    const storage = businessStorage('checkout', raw);
    const retry = prepareCustomerCheckout(storage, { total: 9000, cart: [] }, { customer_name: 'Changed' }, () => { throw new Error('Must not create another request ID'); });
    assert.deepEqual(retry, attempt);
    assert.equal(raw.getItem('business:checkout:tokom_checkout_attempt'), JSON.stringify(attempt));
});

test('legacy receipts remain readable on quota failures, while failed writes never claim durability', () => {
    const raw = nativeStorage();
    const receipt = { order_id: 'receipt', customer_token: 'token', sync_version: 1 };
    raw.setItem('business:quota:motorku_order:receipt', JSON.stringify(receipt));
    const write = raw.setItem;
    raw.setItem = (key, value) => {
        if (key.includes('tokom_')) throw new Error('QuotaExceeded');
        write(key, value);
    };
    const storage = businessStorage('quota', raw);
    assert.equal(readCustomerOrders(storage)[0].customer_token, 'token');
    assert.equal(saveCustomerOrder(storage, { ...receipt, sync_version: 2 }).persisted, false);
    assert.equal(readCustomerOrders(storage)[0].sync_version, 2);
    assert.equal(readCustomerOrders(businessStorage('unrelated', raw)).length, 0);
});

test('new-only storage is readable and unrelated POS keys are not renamed or duplicated', () => {
    const raw = nativeStorage();
    raw.setItem('business:new:tokom_cart', 'new-cart');
    const storage = businessStorage('new', raw);
    assert.equal(storage.getItem('tokom_cart'), 'new-cart');
    storage.setItem('pos_cart', 'pos-data');
    assert.equal(raw.getItem('business:new:pos_cart'), 'pos-data');
    assert.equal(raw.getItem('business:new:motorku_pos_cart'), null);
    assert.equal(storage.matchesEventKey('business:new:pos_cart'), false);
});
