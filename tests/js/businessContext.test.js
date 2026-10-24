import test from 'node:test';
import assert from 'node:assert/strict';
import { businessStorage, storefrontUrl, currentShopSlug, LEGACY_BUSINESS_ID } from '../../resources/js/Utils/storefrontContext.js';
import { businessRegistrationSchema, businessSlug } from '../../resources/js/Utils/businessRegistration.js';

const memory = () => {
    const data = new Map();
    return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};

test('public cart and order tokens are isolated across shops, preserving original shop storage', () => {
    const raw = memory();
    raw.setItem('motorku_cart', 'legacy-cart');
    const legacy = businessStorage(LEGACY_BUSINESS_ID, raw);
    const b = businessStorage('business-b', raw);
    const c = businessStorage('business-c', raw);
    assert.equal(legacy.getItem('motorku_cart'), 'legacy-cart');
    assert.equal(b.getItem('motorku_cart'), null);
    b.setItem('motorku_cart', 'B');
    c.setItem('motorku_cart', 'C');
    b.setItem('motorku_current_order', 'secret-token-b');
    assert.equal(c.getItem('motorku_current_order'), null);
    assert.equal(b.getItem('motorku_cart'), 'B');
    c.removeItem('motorku_cart');
    assert.equal(b.getItem('motorku_cart'), 'B');
});

test('POS carts are isolated by account as well as business', () => {
    const raw = memory();
    const a = businessStorage('shop', raw, 'cashier-a');
    const b = businessStorage('shop', raw, 'cashier-b');
    a.setItem('pos_cart', 'A');
    assert.equal(b.getItem('pos_cart'), null);
    assert.notEqual(a.key('pos_cart'), b.key('pos_cart'));
});

test('shop URLs preserve query parameters and fragments through the customer flow', () => {
    assert.equal(storefrontUrl('/', 'toko-baru'), '/s/toko-baru');
    assert.equal(storefrontUrl('/?openCart=1', 'toko-baru'), '/s/toko-baru?openCart=1');
    assert.equal(storefrontUrl('/order/status?foo=bar#latest', 'toko-baru'), '/order/status?foo=bar&shop=toko-baru#latest');
    assert.equal(storefrontUrl('/motor-saya?shop=toko-baru', 'toko-baru'), '/motor-saya?shop=toko-baru');
    assert.equal(storefrontUrl('/', null), '/');
    assert.equal(storefrontUrl('https://example.org', 'toko-baru'), 'https://example.org');
    assert.equal(currentShopSlug({ pathname: '/s/toko-baru', search: '' }), 'toko-baru');
    assert.equal(currentShopSlug({ pathname: '/payment', search: '?shop=toko-baru' }), 'toko-baru');
});

test('registration validates password and safe public store address', () => {
    const valid = { name: 'Owner', email: 'owner@example.test', business_name: 'Toko Baru', business_slug: 'toko-baru', password: 'Strong@1234', password_confirmation: 'Strong@1234' };
    assert.equal(businessRegistrationSchema.safeParse(valid).success, true);
    assert.equal(businessRegistrationSchema.safeParse({ ...valid, business_slug: '../admin' }).success, false);
    assert.equal(businessRegistrationSchema.safeParse({ ...valid, password_confirmation: 'different' }).success, false);
    assert.equal(businessSlug(' Toko & Bengkel Àman '), 'toko-bengkel-aman');
});
