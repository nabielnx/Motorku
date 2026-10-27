import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetFileSchema, sheetPreviewSchema, sheetPreviewSchemaForGroups, defaultSheetGroup, selectableSheetRows, newSheetCategories, sheetParentChoices, sheetCostPreview } from '../../resources/js/Utils/productSheet.js';

test('import accepts the current custom groups and rejects absent or deleted groups', () => {
    const input = { token: '00000000-0000-4000-8000-000000000001', mode: 'add', default_group: 'makanan',
        sheets: [{ id: 0, mapping: { name: 0, category: 1, price: 2 } }] };
    const schema = sheetPreviewSchemaForGroups({ makanan: 'Makanan', minuman: 'Minuman' });
    assert.equal(schema.safeParse(input).success, true);
    assert.equal(schema.safeParse({ ...input, default_group: 'automotive' }).success, false);
    assert.equal(schema.safeParse({ ...input, default_group: '' }).success, false);
    assert.equal(schema.safeParse({ ...input, default_group: 'toString' }).success, false);
    assert.equal(sheetPreviewSchemaForGroups({}).safeParse(input).success, false);
    assert.equal(sheetPreviewSchemaForGroups({ minuman: 'Minuman' }).safeParse(input).success, false);
});

test('initial import group follows the selected type or the first available custom type', () => {
    const groups = { makanan: 'Makanan', minuman: 'Minuman' };
    assert.equal(defaultSheetGroup(groups, 'minuman'), 'minuman');
    assert.equal(defaultSheetGroup(groups, 'automotive'), 'makanan');
    assert.equal(defaultSheetGroup(groups), 'makanan');
    assert.equal(defaultSheetGroup({}), '');
});

test('file validator rejects old Excel formats and oversized files', () => {
    assert.equal(sheetFileSchema.safeParse({ name: 'all.xlsx', size: 1000 }).success, true);
    assert.equal(sheetFileSchema.safeParse({ name: 'all.xls', size: 1000 }).success, false);
    assert.equal(sheetFileSchema.safeParse({ name: 'all.csv', size: 10 * 1024 * 1024 }).success, true);
    assert.equal(sheetFileSchema.safeParse({ name: 'all.csv', size: 10 * 1024 * 1024 + 1 }).success, false);
    assert.equal(sheetFileSchema.safeParse(null).success, false);
});

test('mapping requires core fields and unique source columns', () => {
    const input = { token: '00000000-0000-4000-8000-000000000001', mode: 'add', default_group: 'bicycle',
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

test('stock updates require an explicit boolean choice and default to preserving stock', () => {
    const input = { token: '00000000-0000-4000-8000-000000000001', mode: 'update', default_group: 'automotive',
        sheets: [{ id: 0, mapping: { name: 0, category: 1, price: 2, stock: 3 } }] };
    assert.equal(sheetPreviewSchema.parse(input).update_stock, false);
    assert.equal(sheetPreviewSchema.parse({ ...input, update_stock: true }).update_stock, true);
    assert.equal(sheetPreviewSchema.safeParse({ ...input, update_stock: 'true' }).success, false);
});

test('new category parent choices apply once per category and preserve other visible choices', () => {
    const oil = { category_key: 'a'.repeat(64), category: 'Oli Mesin (4T)', action: 'create', category_id: null, category_parent_id: '00000000-0000-4000-8000-000000000001' };
    const tire = { category_key: 'b'.repeat(64), category: 'Ban Dalam', action: 'create', category_id: null, category_parent_id: null };
    const rows = [oil, { ...oil }, tire, { ...oil, action: 'update' }, { ...tire, category_id: 'existing' }];
    assert.deepEqual(newSheetCategories(rows), [oil, tire]);
    assert.deepEqual(sheetParentChoices(rows, tire.category_key, '00000000-0000-4000-8000-000000000002'), [
        { key: oil.category_key, parent_id: oil.category_parent_id },
        { key: tire.category_key, parent_id: '00000000-0000-4000-8000-000000000002' },
    ]);
    assert.equal(sheetParentChoices(rows, oil.category_key, null)[0].parent_id, null);
});

test('preview validates category parent IDs and rejects duplicate category choices', () => {
    const input = { token: '00000000-0000-4000-8000-000000000001', mode: 'add', default_group: 'motor',
        sheets: [{ id: 0, mapping: { name: 0, category: 1, price: 2 } }] };
    const choice = { key: 'a'.repeat(64), parent_id: '00000000-0000-4000-8000-000000000002' };
    assert.equal(sheetPreviewSchema.safeParse({ ...input, category_parents: [choice] }).success, true);
    assert.equal(sheetPreviewSchema.safeParse({ ...input, category_parents: [{ ...choice, parent_id: null }] }).success, true);
    assert.equal(sheetPreviewSchema.safeParse({ ...input, category_parents: [{ ...choice, parent_id: 'other' }] }).success, false);
    assert.equal(sheetPreviewSchema.safeParse({ ...input, category_parents: [choice, choice] }).success, false);
});

test('modal preview preserves old values when no cost is imported and distinguishes zero from empty', () => {
    const row = { action: 'update', old_cost_price: '42000.00', data: { cost_price: null } };
    assert.deepEqual(sheetCostPreview(row), { before: 42000, after: 42000, state: 'kept' });
    assert.deepEqual(sheetCostPreview({ ...row, data: { cost_price: 0 } }), { before: 42000, after: 0, state: 'set' });
    assert.deepEqual(sheetCostPreview({ ...row, data: { cost_price: 30000 } }), { before: 42000, after: 30000, state: 'set' });
    assert.equal(sheetCostPreview({ ...row, data: { cost_price: 42000 } }).state, 'kept');
    assert.equal(sheetCostPreview({ action: 'create', data: { cost_price: null } }).state, 'empty');
    assert.equal(sheetCostPreview({ action: 'create', data: { cost_price: 0 } }).state, 'set');
    assert.deepEqual(sheetCostPreview({ ...row, action: 'skip', data: { cost_price: 30000 } }), { before: 42000, after: 42000, state: 'skipped' });
});
