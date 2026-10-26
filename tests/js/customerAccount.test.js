import test from 'node:test';
import assert from 'node:assert/strict';
import { customerStorage, LEGACY_BUSINESS_ID } from '../../resources/js/Utils/storefrontContext.js';
import { customerAuthSchemas, customerProfileSchema } from '../../resources/js/Utils/customerAuth.js';

test('customer receipts and retry identities are isolated while the shopping cart survives login', () => {
    const map = new Map();
    const native = { get length() { return map.size; }, key: index => [...map.keys()][index], getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
    const guest = customerStorage(LEGACY_BUSINESS_ID, native);
    const a = customerStorage(LEGACY_BUSINESS_ID, native, 'a');
    const b = customerStorage(LEGACY_BUSINESS_ID, native, 'b');
    guest.setItem('tokom_cart', 'cart');
    guest.setItem('tokom_order:guest', 'guest token');
    a.setItem('tokom_order:private', 'account token');
    a.setItem('tokom_checkout_attempt', 'private retry');
    assert.equal(a.getItem('tokom_cart'), 'cart');
    assert.equal(b.getItem('tokom_cart'), 'cart');
    assert.equal(guest.getItem('tokom_order:private'), null);
    assert.equal(b.getItem('tokom_order:private'), null);
    assert.equal(b.getItem('tokom_checkout_attempt'), null);
    assert.equal(a.getItem('tokom_order:guest'), null);
    assert.ok(a.keys().includes('tokom_order:private'));
    assert.ok(!b.keys().includes('tokom_order:private'));
});

test('customer registration and password recovery validate confirmation independently', () => {
    const data = { name: 'Pembeli', email: 'buyer@example.test', password: 'Strong@1234', password_confirmation: 'Strong@1234' };
    assert.equal(customerAuthSchemas.register.safeParse(data).success, true);
    assert.equal(customerAuthSchemas.register.safeParse({ ...data, password_confirmation: 'wrong' }).success, false);
    assert.equal(customerAuthSchemas.reset.safeParse(data).success, true);
    assert.equal(customerAuthSchemas.reset.safeParse({ ...data, password: 'weak' }).success, false);
    assert.equal(customerAuthSchemas.forgot.safeParse({ email: 'invalid' }).success, false);
});

test('customer contact form validates optional address and phone before saving', () => {
    const profile = { name: '  Nama Baru  ', phone: '', address: '' };
    assert.equal(customerProfileSchema.parse(profile).name, 'Nama Baru');
    assert.equal(customerProfileSchema.safeParse({ ...profile, address: 'Jalan Merdeka 10\nDemak' }).success, true);
    assert.equal(customerProfileSchema.safeParse({ ...profile, address: 'x'.repeat(501) }).success, false);
    assert.equal(customerProfileSchema.safeParse({ ...profile, phone: 'not a phone' }).success, false);
});
