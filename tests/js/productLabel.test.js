import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductLabel } from '../../resources/js/Utils/productLabel.js';
import { fuzzyFilterProducts } from '../../resources/js/Utils/fuzzySearch.js';
import { formatPosProduct, addToPosCart } from '../../resources/js/Utils/posCart.js';

test('separates confirmed motor application while preserving tire dimensions and TR variant', () => {
    const product = {
        name: 'Ban Luar IRC Ring 14 - 80/90 TR Non-Tubeless (Matic Trail / Semi)',
        description: 'Ban luar IRC Non-Tubeless ukuran Ring 14 - 80/90 TR. Peruntukan: Matic Trail / Semi.',
    };
    assert.deepEqual(getProductLabel(product), {
        name: 'Ban Luar IRC Ring 14 - 80/90 TR Non-Tubeless',
        application: 'Matic Trail / Semi',
    });
});

test('handles both existing Nouvo/Skywave spellings and retains equivalent tire sizes', () => {
    for (const suffix of ['Matic Ring 16 - Nouvo/Skywave', 'Matic Ring 16 (Nouvo/Skywave)']) {
        assert.deepEqual(getProductLabel({
            name: `Ban Luar IRC Ring 16 - 70/90 Non-Tubeless (${suffix})`,
            description: 'Ban luar IRC. Peruntukan: Matic Ring 16 (Nouvo/Skywave).',
        }), { name: 'Ban Luar IRC Ring 16 - 70/90 Non-Tubeless', application: 'Matic Ring 16 (Nouvo/Skywave)' });
    }
    assert.equal(getProductLabel({
        name: 'Ban Luar AHM Ring 17 - 70/90 (2.25) Non-Tubeless (Bebek Honda Depan - Supra / Revo / Blade)',
        description: 'Ban luar AHM. Peruntukan: Bebek Honda Depan (Supra / Revo / Blade).',
    }).name, 'Ban Luar AHM Ring 17 - 70/90 (2.25) Non-Tubeless');
});

test('keeps volumes, technical variants, ambiguous applications and incomplete data intact', () => {
    for (const product of [
        { name: 'Deltalube Matic (0,8 L)' },
        { name: 'Oli Gardan AHM (120 ml)' },
        { name: 'Kampas Rem (Belakang)', description: 'Peruntukan: Honda ADV 150.' },
        { name: 'Ban IRC (Nouvo/Skywave)' },
        { name: 'Ban IRC (Nouvo/Skywave', description: 'Peruntukan: Nouvo/Skywave.' },
        { name: 'Bor Bosch (18 V)' },
    ]) assert.deepEqual(getProductLabel(product), { name: product.name, application: '' });
    assert.deepEqual(getProductLabel({}), { name: '', application: '' });
});

test('presentation preserves motor searches and original cart identity', () => {
    const raw = { id: 'tire', sku: 'IRC-16', name: 'Ban Luar IRC Ring 16 - 70/90 Non-Tubeless (Matic Ring 16 - Nouvo/Skywave)', description: 'Ban luar IRC. Peruntukan: Matic Ring 16 (Nouvo/Skywave).', price: 218000, stock: 50, is_available: true };
    const item = formatPosProduct(raw);
    const before = structuredClone(item);
    getProductLabel(item);
    assert.deepEqual(item, before);
    assert.deepEqual(fuzzyFilterProducts([item], 'skywave 70/90'), [item]);
    const cart = addToPosCart([], item);
    assert.equal(cart[0].id, raw.id);
    assert.equal(cart[0].name, raw.name);
    assert.deepEqual(getProductLabel(cart[0]), getProductLabel(item));
});
