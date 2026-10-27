import test from 'node:test';
import assert from 'node:assert/strict';
import { dataTypeSchema, referenceEntrySchema, displayReferenceValue } from '../../resources/js/Utils/dataTypes.js';

const fields = [
    { key: 'voltage', label: 'Voltase', type: 'number', required: true, options: [] },
    { key: 'connection', label: 'Koneksi', type: 'select', required: false, options: ['USB', 'AC'] },
    { key: 'portable', label: 'Portabel', type: 'boolean', required: true, options: [] },
    { key: 'released', label: 'Tanggal rilis', type: 'date', required: false, options: [] },
];

test('only reference types accept explicit customer visibility', () => {
    for (const is_public of [true, false]) {
        assert.equal(dataTypeSchema.parse({ kind: 'reference', name: 'Elektronik', fields, is_public }).is_public, is_public);
        assert.equal(dataTypeSchema.safeParse({ kind: 'product', name: 'Kebun', fields: [], is_public }).success, false);
    }
    assert.equal(dataTypeSchema.safeParse({ kind: 'reference', name: 'Elektronik', fields, is_public: 'true' }).success, false);
});

test('reference definitions reject duplicate keys, invalid choices and unsafe field identifiers', () => {
    assert.equal(dataTypeSchema.safeParse({ kind: 'reference', name: 'Elektronik', fields }).success, true);
    assert.equal(dataTypeSchema.safeParse({ kind: 'product', name: 'Kebun', fields: [] }).success, true);
    for (const invalid of [
        [...fields, fields[0]],
        [{ ...fields[0], key: 'voltage.value' }],
        [{ ...fields[0], key: 'constructor' }],
        [{ ...fields[1], options: ['USB', 'USB'] }],
        [{ ...fields[1], options: [] }],
    ]) assert.equal(dataTypeSchema.safeParse({ kind: 'reference', name: 'Elektronik', fields: invalid }).success, false);
    assert.equal(dataTypeSchema.safeParse({ kind: 'product', name: 'Kebun', fields }).success, false);
});

test('reference forms retain false and zero and validate typed values without accepting unknown fields', () => {
    const schema = referenceEntrySchema(fields);
    const input = { name: 'Adaptor', description: '', values: { voltage: '0', connection: '', portable: false, released: '' } };
    assert.deepEqual(schema.parse(input).values, { voltage: 0, connection: null, portable: false, released: null });
    for (const values of [
        { ...input.values, voltage: '' },
        { ...input.values, voltage: 'abc' },
        { ...input.values, voltage: Infinity },
        { ...input.values, connection: 'INVALID' },
        { ...input.values, portable: 'false' },
        { ...input.values, released: '2026-02-30' },
        { ...input.values, extra: 'unknown' },
    ]) assert.equal(schema.safeParse({ ...input, values }).success, false);
    assert.equal(displayReferenceValue(fields[2], false), 'Tidak');
    assert.equal(displayReferenceValue(fields[0], 0), '0');
});
