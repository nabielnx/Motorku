import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisibleCategoryIds } from '../../resources/js/Utils/posCategoryFilter.js';

const categories = [
    { id: 'oli', parent_id: null },
    { id: 'mesin', parent_id: 'oli' },
    { id: 'gardan', parent_id: 'oli' },
    { id: 'ban', parent_id: null },
];

test('kategori induk mencakup produk sendiri dan semua subkategori', () => {
    assert.equal(getVisibleCategoryIds(categories, null, null), null);
    assert.deepEqual([...getVisibleCategoryIds(categories, 'oli', null)], ['oli', 'mesin', 'gardan']);
    assert.deepEqual([...getVisibleCategoryIds(categories, 'oli', 'mesin')], ['mesin']);
});
