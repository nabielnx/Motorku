import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetFileSchema, sheetPreviewSchema, selectableSheetRows } from '../../resources/js/Utils/productSheet.js';

test('file validator rejects old Excel formats and oversized files', () => {
    assert.equal(sheetFileSchema.safeParse({ name: 'all.xlsx', size: 1000 }).success, true);
    assert.equal(sheetFileSchema.safeParse({ name: 'all.xls', size: 1000 }).success, false);
    assert.equal(sheetFileSchema.safeParse({ name: 'all.csv', size: 10 * 1024 * 1024 }).success, true);
    assert.equal(sheetFileSchema.safeParse({ name: 'all.csv', size: 10 * 1024 * 1024 + 1 }).success, false);
    assert.equal(sheetFileSchema.safeParse(null).success, false);
});

test('mapping requires core fields and unique source columns', () => {
    const input = { token: '00000000-0000-4000-8000-000000000001', mode: 'add', default_group: 'bicycle', use_estimated_cost: false,
        sheets: [{ id: 0, mapping: { name: 0, category: 1, price: 2 } }] };
    assert.equal(sheetPreviewSchema.safeParse(input).success, true);
    assert.equal(sheetPreviewSchema.safeParse({ ...input, sheets: [{ id: 0, mapping: { name: 0, category: 1, price: 1 } }] }).success, false);
    assert.equal(sheetPreviewSchema.safeParse({ ...input, sheets: [{ id: 0, mapping: { name: 0, category: 1 } }] }).success, false);
});

test('default selection only contains valid rows with an action', () => {
    assert.deepEqual(selectableSheetRows([
        { id: '0:2', action: 'create', errors: [] }, { id: '0:3', action: 'update', errors: [] },
        { id: '0:4', action: 'skip', errors: [] }, { id: '0:5', action: 'create', errors: ['Missing price'] },
    ]), ['0:2', '0:3']);
});
