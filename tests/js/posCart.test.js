import test from 'node:test';
import assert from 'node:assert/strict';
import { POS_CART_KEY, formatPosProduct, readPosCart, addToPosCart } from '../../resources/js/Utils/posCart.js';

const product = { id: 'tire', name: 'Ban IRC', price: '322000.00', stock: 3, is_available: true, image_path: 'products/tire.webp', category: { name: 'Ban' } };

test('Data Motor additions survive storage and merge with the existing POS cart', () => {
    const saved = new Map();
    const storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
    const other = { id: 'oil', name: 'Oli', price: 82000, stock: 10, qty: 2, notes: 'Catatan oli' };
    storage.setItem(POS_CART_KEY, JSON.stringify([other]));
    const item = formatPosProduct(product);
    let cart = addToPosCart(readPosCart(storage), item);
    storage.setItem(POS_CART_KEY, JSON.stringify(cart));
    cart = readPosCart(storage);
    assert.equal(cart.length, 2);
    assert.deepEqual(cart[0], other);
    assert.equal(cart[1].qty, 1);
    assert.equal(cart[1].price, 322000);
    assert.equal(cart[1].image, '/storage/products/tire.webp');
    cart[1].notes = 'Untuk ADV 150';
    const previous = structuredClone(cart);
    cart = addToPosCart(cart, { ...item, price: 330000 });
    assert.equal(cart.length, 2);
    assert.equal(cart[1].qty, 2);
    assert.equal(cart[1].price, 330000);
    assert.equal(cart[1].notes, 'Untuk ADV 150');
    assert.equal(previous[1].qty, 1);
});

test('both entry points enforce availability, stock and POS quantity/item limits', () => {
    const item = formatPosProduct(product);
    assert.throws(() => addToPosCart([], { ...item, stock: 0 }), /habis/);
    assert.throws(() => addToPosCart([], { ...item, is_available: false }), /tidak aktif/);
    assert.throws(() => addToPosCart([], { ...item, price: NaN }), /Harga/);
    assert.throws(() => addToPosCart([], { ...item, price: -1 }), /Harga/);
    const fullStock = [{ ...item, qty: 3, notes: '' }];
    assert.throws(() => addToPosCart(fullStock, item), /Stok.*tidak mencukupi/);
    assert.equal(fullStock[0].qty, 3);
    assert.throws(() => addToPosCart([{ ...item, qty: 200 }], { ...item, stock: 300 }), /Maksimal 200/);
    const fullCart = Array.from({ length: 20 }, (_, index) => ({ ...item, id: String(index), qty: 1 }));
    assert.throws(() => addToPosCart(fullCart, item), /Maksimal 20/);
    assert.equal(addToPosCart(fullCart, { ...item, id: '0' })[0].qty, 2);
});

test('invalid saved cart data cannot crash the POS on entry', () => {
    for (const value of [null, 'invalid JSON', '{}', 'null']) {
        assert.deepEqual(readPosCart({ getItem: () => value }), []);
    }
    assert.deepEqual(readPosCart({ getItem: () => { throw new Error('Storage blocked'); } }), []);
});
