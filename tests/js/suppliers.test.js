import assert from 'node:assert/strict';
import test from 'node:test';
import { supplierFormValues, supplierSchema } from '../../resources/js/Utils/suppliers.js';

test('supplier forms normalize nullable fields and trim data without losing contact formatting', () => {
    assert.deepEqual(supplierFormValues({ name: 'PT Uji', phone: null }), { name: 'PT Uji', contact_person: '', phone: '', email: '', address: '', notes: '' });
    const parsed = supplierSchema.parse({ ...supplierFormValues(), name: '  PT Uji  ', phone: '+62 812-3456-7890', address: 'Jalan 1\nDemak', notes: '  Kirim pagi.  ' });
    assert.equal(parsed.name, 'PT Uji');
    assert.equal(parsed.phone, '+62 812-3456-7890');
    assert.equal(parsed.address, 'Jalan 1\nDemak');
    assert.equal(parsed.notes, 'Kirim pagi.');
});

test('supplier validation rejects blank names, unsafe phone links, invalid emails and oversized data', () => {
    const data = { ...supplierFormValues(), name: 'PT Uji' };
    for (const invalid of [{ name: ' ' }, { name: 'a'.repeat(151) }, { contact_person: 'a'.repeat(151) }, { phone: 'javascript:alert(1)' }, { email: 'bukan-email' }, { address: 'a'.repeat(1001) }, { notes: 'a'.repeat(2001) }]) {
        assert.equal(supplierSchema.safeParse({ ...data, ...invalid }).success, false);
    }
    assert.equal(supplierSchema.safeParse(data).success, true);
});
