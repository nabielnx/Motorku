import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogPageProducts } from '../../resources/js/Utils/catalogFeedState.js';

test('a 2000-product catalog remains reachable while a bounded feed retains at most one 60-item page', () => {
    const catalog = Array.from({ length: 2000 }, (_, id) => ({ id, name: `Produk ${id}`, image: `/storage/products/${id}.webp` }));
    let retained = [], peak = 0;
    const visited = new Set();
    const pages = [];
    for (let start = 0; start < catalog.length; start += 60) {
        const page = catalog.slice(start, start + 60);
        pages.push(page);
        retained = catalogPageProducts(retained, page, true, true);
        peak = Math.max(peak, retained.length);
        retained.forEach(product => visited.add(product.id));
        assert.deepEqual(retained, page);
    }
    assert.equal(peak, 60);
    assert.equal(visited.size, 2000);
    for (const page of pages.reverse()) retained = catalogPageProducts(retained, page, false, true);
    assert.deepEqual(retained, catalog.slice(0, 60));
});

test('append-mode POS keeps existing deduplication and refreshed product values', () => {
    const first = [{ id: 'a', price: 1000 }, { id: 'b', price: 2000 }];
    assert.deepEqual(catalogPageProducts(first, [{ id: 'a', price: 1500 }, { id: 'c', price: 3000 }], true, false), [
        { id: 'a', price: 1500 }, { id: 'b', price: 2000 }, { id: 'c', price: 3000 },
    ]);
    assert.deepEqual(catalogPageProducts(first, [], false, false), []);
    assert.equal(first[0].price, 1000);
});
