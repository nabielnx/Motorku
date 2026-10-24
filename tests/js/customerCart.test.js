import test from 'node:test';
import assert from 'node:assert/strict';
import { customerCartTotals, loadCustomerCatalog, reconcileCustomerCart } from '../../resources/js/Utils/customerCart.js';

const saved = { id: 'oil', name: 'Oli', price: 10000, stock: 8, image: null, qty: 2, notes: 'Untuk motor merah', cartItemId: 'oil-123' };

test('saved customer cart follows increased and decreased prices without losing quantities or notes', () => {
    for (const price of ['15000.00', '8000.00']) {
        const cart = JSON.parse(JSON.stringify([saved, { ...saved, qty: 1, notes: 'Motor biru', cartItemId: 'oil-456' }]));
        const result = reconcileCustomerCart(cart, [{ ...saved, name: 'Oli Baru', price, stock: 5, image: '/storage/new.webp' }]);
        assert.equal(result.needsReview, true);
        assert.equal(result.cart.length, 2);
        assert.deepEqual(result.cart.map(item => [item.qty, item.notes, item.cartItemId]), cart.map(item => [item.qty, item.notes, item.cartItemId]));
        assert.equal(result.cart[0].price, Number(price));
        assert.equal(result.cart[1].price, Number(price));
        assert.equal(result.cart[0].stock, 5);
        assert.equal(result.cart[0].name, 'Oli Baru');
        assert.equal(result.cart[0].image, '/storage/new.webp');
        assert.equal(customerCartTotals(result.cart, {}).total, Number(price) * 3);
        assert.equal(cart[0].price, 10000);
    }
});

test('unchanged catalogs preserve cart identity and stock-only updates do not require another price review', () => {
    const cart = [{ ...saved }];
    assert.equal(reconcileCustomerCart(cart, [{ ...saved, price: '10000.00' }]).cart, cart);
    const result = reconcileCustomerCart(cart, [{ ...saved, stock: 3 }]);
    assert.equal(result.cart[0].stock, 3);
    assert.equal(result.needsReview, false);
});

test('deleted or hidden products are removed even when the server returns a completely empty catalog', () => {
    const cart = [saved, { ...saved, id: 'tire', cartItemId: 'tire-1' }];
    assert.deepEqual(reconcileCustomerCart(cart, []), { cart: [], needsReview: true });
    const result = reconcileCustomerCart(cart, [{ ...saved }]);
    assert.equal(result.needsReview, true);
    assert.deepEqual(result.cart, [saved]);
});

test('checkout totals use refreshed prices and tax settings instead of the saved estimate', () => {
    const { cart } = reconcileCustomerCart([saved], [{ ...saved, price: '12000.00' }]);
    assert.deepEqual(customerCartTotals(cart, { 'tax.enabled': 'true', 'tax.percentage': '11' }), { subtotal: 24000, tax: 2640, total: 26640 });
    assert.deepEqual(customerCartTotals(cart, { 'tax.enabled': 'false', 'tax.percentage': '11' }), { subtotal: 24000, tax: 0, total: 24000 });
});

test('catalog refresh waits for a successful current storefront response and runs without page navigation', async () => {
    let options;
    const pending = loadCustomerCatalog({ reload: input => { options = input; } });
    assert.equal(options.async, true);
    assert.deepEqual(options.only, ['initialProducts', 'initialCategories', 'settings']);
    const props = { initialProducts: [{ ...saved, price: 15000 }], settings: {} };
    options.onSuccess({ component: 'Order/Menu', props });
    options.onFinish();
    assert.equal(await pending, props);
});

test('failed, cancelled, invalid or redirected catalog requests cannot use stale cart prices for checkout', async () => {
    for (const finish of [
        options => options.onError({}),
        options => options.onCancel(),
        options => options.onFinish(),
        options => options.onSuccess({ component: 'Auth/Login', props: {} }),
        options => options.onSuccess({ component: 'Order/Menu', props: {} }),
    ]) {
        const result = await loadCustomerCatalog({ reload: options => finish(options) });
        assert.equal(result, null);
    }
});
