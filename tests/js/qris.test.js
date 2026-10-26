import assert from 'node:assert/strict';
import test from 'node:test';
import QRCode from 'qrcode';
import { decodeQrisPixels, qrisErrorMessage, qrisQuoteSchema } from '../../resources/js/Utils/qris.js';

test('the browser decoder recovers a QR payload from a generated QR with quiet zones', async () => {
    const payload = '0002010102115908TOKO UJI6304TEST';
    const { modules } = QRCode.create(payload, { errorCorrectionLevel: 'M' });
    const scale = 5;
    const size = (modules.size + 8) * scale;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let row = 0; row < modules.size; row++) for (let column = 0; column < modules.size; column++) {
        if (!modules.get(row, column)) continue;
        for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) {
            const offset = (((row + 4) * scale + y) * size + (column + 4) * scale + x) * 4;
            pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
        }
    }
    assert.equal(await decodeQrisPixels(pixels, size, size), payload);
    await assert.rejects(decodeQrisPixels(new Uint8ClampedArray(100 * 100 * 4).fill(255), 100, 100), /QRIS tidak terbaca/);
});

test('a quote requires amount, merchant and a valid confirmation token', () => {
    const quote = { payload: '0002010102125908TOKO UJI6304TEST', amount: 262000, merchant: { name: 'TOKO UJI', city: 'DEMAK' }, quote_token: 'a'.repeat(64) };
    assert.equal(qrisQuoteSchema.safeParse(quote).success, true);
    for (const invalid of [{ amount: 0 }, { amount: 10000001 }, { quote_token: '' }, { payload: 'https://example.test' }]) {
        assert.equal(qrisQuoteSchema.safeParse({ ...quote, ...invalid }).success, false);
    }
    assert.equal(qrisErrorMessage({ response: { data: { message: 'Invalid', errors: { amount: ['Harga berubah'] } } } }), 'Harga berubah');
});
