import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareProductVisit, productPageSize } from '../../resources/js/Utils/productPagination.js';

test('all catalog destinations request the correct grid size before loading', () => {
    for (const group of ['', 'automotive', 'electronics', 'hardware', 'bicycle']) {
        for (const [width, size] of [[600, 16], [800, 18], [1100, 16], [1500, 20], [1920, 18]]) {
            const visit = { method: 'get', url: new URL(`http://localhost/products?group=${group}&search=oil`) };
            prepareProductVisit(visit, 'grid', width);
            assert.equal(visit.url.searchParams.get('per_page'), String(size));
            assert.equal(visit.url.searchParams.get('group'), group);
            assert.equal(visit.url.searchParams.get('search'), 'oil');
            assert.equal(productPageSize('list', width), 16);
        }
    }
});

test('pagination and filters keep an explicit size; other routes and mutations are untouched', () => {
    for (const [method, path] of [
        ['get', '/products?per_page=20&page=2&category=Ban'],
        ['get', '/pos'], ['post', '/products'],
    ]) {
        const visit = { method, url: new URL(`http://localhost${path}`) };
        const original = visit.url.href;
        prepareProductVisit(visit, 'grid', 1920);
        assert.equal(visit.url.href, original);
    }
});
