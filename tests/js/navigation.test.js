import test from 'node:test';
import assert from 'node:assert/strict';
import { getNavigationDestination } from '../../resources/js/Utils/navigation.js';
import { prepareProductVisit } from '../../resources/js/Utils/productPagination.js';

test('catalog loading retains the group and page size from the first request', () => {
    for (const group of ['automotive', 'electronics', 'hardware', 'bicycle']) {
        const visit = { method: 'get', url: new URL(`http://localhost:8000/products?group=${group}`) };
        prepareProductVisit(visit, 'grid', 1500);
        assert.equal(getNavigationDestination(visit, 'http://localhost:8000/dashboard'), `/products?group=${group}&per_page=20`);
        assert.equal(getNavigationDestination({ url: visit.url.href }, 'http://localhost:8000/dashboard'), `/products?group=${group}&per_page=20`);
    }
});

test('switching catalog groups updates loading even though the pathname stays the same', () => {
    const current = 'http://localhost:8000/products?group=automotive&page=2';
    assert.equal(getNavigationDestination({ url: '/products?group=electronics' }, current), '/products?group=electronics');
    assert.equal(getNavigationDestination({ url: '/products' }, current), '/products');
    assert.equal(getNavigationDestination({ url: '/products?group=bicycle' }, 'http://localhost:8000/products'), '/products?group=bicycle');
});

test('filters, pagination, mutations and background visits do not replace the whole page with a skeleton', () => {
    const current = 'http://localhost:8000/products?group=automotive';
    for (const url of ['/products?group=automotive&search=oil', '/products?group=automotive&page=2', '/products?group=automotive']) {
        assert.equal(getNavigationDestination({ url }, current), null);
    }
    assert.equal(getNavigationDestination({ async: true, url: '/products?group=automotive&per_page=20' }, 'http://localhost:8000/dashboard'), null);
    assert.equal(getNavigationDestination({ method: 'post', url: '/products?group=automotive' }, current), null);
    assert.equal(getNavigationDestination({ url: '/dashboard?period=today' }, current), '/dashboard?period=today');
});
