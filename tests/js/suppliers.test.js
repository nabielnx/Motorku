import assert from 'node:assert/strict';
import test from 'node:test';
import { safeSupplierLinks, supplierFormValues, supplierSchema } from '../../resources/js/Utils/suppliers.js';

test('supplier forms normalize nullable fields and trim data without losing contact formatting', () => {
    assert.deepEqual(supplierFormValues({ name: 'PT Uji', phone: null }), { name: 'PT Uji', contact_person: '', phone: '', email: '', address: '', notes: '', links: [] });
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

test('supplier forms support multiple optional named links and preserve them for editing', () => {
    const links = [
        { label: 'Shopee', url: 'https://shopee.co.id/toko-uji' },
        { label: 'Tokopedia', url: 'https://www.tokopedia.com/toko-uji' },
    ];
    const values = supplierFormValues({ name: 'PT Uji', links });
    assert.deepEqual(supplierSchema.parse(values).links, links);
    assert.deepEqual(supplierSchema.parse({ ...values, links: [] }).links, []);
    assert.deepEqual(supplierFormValues({ links: null }).links, []);
    assert.deepEqual(safeSupplierLinks(links), links);
    assert.deepEqual(safeSupplierLinks(null), []);
});

test('supplier links reject unsafe schemes and render only validated HTTP or HTTPS links', () => {
    const values = { ...supplierFormValues(), name: 'PT Uji' };
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'ftp://example.test', '//shopee.co.id/shop', 'shopee.co.id/shop', 'https://example.test/'+ 'a'.repeat(2048)]) {
        const links = [{ label: 'Toko', url }];
        assert.equal(supplierSchema.safeParse({ ...values, links }).success, false);
        assert.deepEqual(safeSupplierLinks(links), []);
    }
    assert.equal(supplierSchema.safeParse({ ...values, links: [{ label: '', url: 'https://example.test' }] }).success, false);
    assert.equal(supplierSchema.safeParse({ ...values, links: Array.from({ length: 11 }, () => ({ label: 'Toko', url: 'https://example.test' })) }).success, false);
    assert.equal(supplierSchema.parse({ ...values, links: [{ label: '  Situs  ', url: '  http://example.test/shop  ' }] }).links[0].url, 'http://example.test/shop');
});
