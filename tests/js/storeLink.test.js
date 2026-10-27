import assert from 'node:assert/strict';
import test from 'node:test';
import png from 'pngjs';
import jsQR from 'jsqr';
import { renderStoreQr } from '../../resources/js/Utils/storeLink.js';

test('downloadable store QR decodes to the exact owner store URL', async () => {
    const url = 'https://tokopojok.shop/s/toko-mas-man';
    const image = await renderStoreQr(url);
    assert.match(image, /^data:image\/png;base64,/);
    const { data, width, height } = png.PNG.sync.read(Buffer.from(image.split(',')[1], 'base64'));
    assert.equal(jsQR(new Uint8ClampedArray(data), width, height)?.data, url);
});

test('QR links also work locally and reject executable URLs or embedded credentials', async () => {
    assert.match(await renderStoreQr('http://localhost:8000/s/toko-saya'), /^data:image\/png;base64,/);
    for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'https://secret@example.com/s/toko']) {
        await assert.rejects(renderStoreQr(url));
    }
});
