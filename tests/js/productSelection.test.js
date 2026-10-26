import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProductSelection, isProductSelected, toggleProductSelection, selectProductPage, productSelectionCount, productDeleteSelectionSchema, productDeletePreviewSchema, productSelectionScope } from '../../resources/js/Utils/productSelection.js';

test('individual selections survive page changes and page selection never clears other pages', () => {
    let selection = toggleProductSelection(emptyProductSelection(), 'first');
    selection = selectProductPage(selection, ['second', 'third'], true);
    selection = selectProductPage(selection, ['second', 'third'], true);
    assert.equal(productSelectionCount(selection, 50), 3);
    selection = selectProductPage(selection, ['second', 'third'], false);
    assert.deepEqual(selection.ids, ['first']);
    assert.equal(isProductSelected(selection, 'second'), false);
});

test('all matching products can exclude individual items or whole pages without losing other pages', () => {
    let selection = { mode: 'filtered', excluded_ids: [] };
    assert.equal(productSelectionCount(selection, 60), 60);
    selection = toggleProductSelection(selection, 'one');
    assert.equal(productSelectionCount(selection, 60), 59);
    assert.equal(isProductSelected(selection, 'one'), false);
    selection = selectProductPage(selection, ['one', 'two', 'three'], false);
    assert.equal(productSelectionCount(selection, 60), 57);
    assert.equal(isProductSelected(selection, 'other-page'), true);
    selection = selectProductPage(selection, ['one', 'two', 'three'], true);
    assert.equal(productSelectionCount(selection, 60), 60);
});

test('deletion payloads require explicit IDs or a bounded filter selection', () => {
    assert.equal(productDeleteSelectionSchema.safeParse(emptyProductSelection()).success, false);
    assert.equal(productDeleteSelectionSchema.safeParse({ mode: 'ids', ids: ['invalid'] }).success, false);
    assert.equal(productDeleteSelectionSchema.safeParse({ mode: 'filtered', excluded_ids: [] }).success, false);
    assert.equal(productDeleteSelectionSchema.safeParse({ mode: 'filtered', excluded_ids: [], filters: { group: 'automotive', search: 'ban', stock_status: 'out', availability: 'active' } }).success, true);
    assert.equal(productDeleteSelectionSchema.safeParse({ mode: 'filtered', excluded_ids: [], filters: { stock_status: 'unknown' } }).success, false);
});

test('confirmation cannot proceed with a missing token, zero products or an excessive count', () => {
    for (const value of [{ count: 3 }, { count: 0, token: 'signed' }, { count: 5001, token: 'signed' }]) {
        assert.equal(productDeletePreviewSchema.safeParse(value).success, false);
    }
    assert.deepEqual(productDeletePreviewSchema.parse({ count: 20, token: 'signed' }), { count: 20, token: 'signed' });
});

test('selection stays tied to applied filters while pagination, sorting and harmless whitespace preserve scope', () => {
    const current = { group: 'automotive', search: 'ban', category: 'All', stock_status: 'all', availability: 'all' };
    const key = productSelectionScope(current);
    assert.equal(productSelectionScope({ ...current, page: 2, sort: 'name_asc', search: ' ban ' }), key);
    for (const change of [{ search: 'aki' }, { group: 'electronics' }, { category: 'Ban' }, { stock_status: 'out' }, { availability: 'inactive' }]) {
        assert.notEqual(productSelectionScope({ ...current, ...change }), key);
    }
});
