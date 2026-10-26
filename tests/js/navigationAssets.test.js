import test from 'node:test';
import assert from 'node:assert/strict';
import { createPagePreloader, navigationPage } from '../../resources/js/Utils/navigationAssets.js';

const origin = 'https://example.test/dashboard';

test('navigation code mapping supports catalog, checkout, admin lists and details', () => {
    const examples = [
        ['/', 'Store/Entry'],
        ['/s/toko-utama?openCart=1', 'Order/Menu'], ['/payment?shop=toko-utama', 'Payment/Index'],
        ['/products?group=automotive', 'Product/Index'], ['/pos/', 'POS/Index'],
        ['/orders/00000000-0000-4000-8000-000000000001', 'Order/Show'],
        ['/references/00000000-0000-4000-8000-000000000001', 'Reference/Index'],
        ['/motor-saya/honda-beat?shop=toko-utama', 'Motorcycle/MotorSaya'],
        ['/settings', 'Setting/Index'], ['/profile', 'Profile/Edit'],
    ];
    for (const [url, page] of examples) assert.equal(navigationPage({ method: 'get', url }, origin), page);
});

test('mutations, background reloads, external destinations and unknown routes do not warm code', () => {
    for (const visit of [
        { method: 'post', url: '/products' }, { method: 'delete', url: '/orders' },
        { async: true, url: '/products' }, { url: 'https://other.test/pos' },
        { url: 'https://secret@example.test/pos' }, { url: 'javascript:alert(1)' },
        { url: '/api/customer/order' }, { url: '/orders/export' }, {}, null,
    ]) assert.equal(navigationPage(visit, origin), null);
});

test('intent, visit start and final page resolution reuse one module promise without sharing props', async () => {
    let loads = 0;
    const module = { default: () => null };
    const preloader = createPagePreloader({ './Pages/POS/Index.jsx': async () => { loads++; return module; } });
    const results = await Promise.all([
        preloader.warmVisit({ url: '/pos' }, origin),
        preloader.warmVisit({ method: 'get', url: new URL('/pos', origin) }, origin),
        preloader.load('POS/Index'),
    ]);
    assert.deepEqual(results, [true, true, module]);
    assert.equal(loads, 1);
    assert.equal(await preloader.load('POS/Index'), module);
});

test('destination code can finish while the fresh page data request is still pending', async () => {
    const events = [];
    let respond;
    const response = new Promise(resolve => { respond = resolve; });
    const preloader = createPagePreloader({ './Pages/Product/Index.jsx': async () => { events.push('code'); return { default: null }; } });
    const warm = preloader.warmVisit({ method: 'get', url: '/products' }, origin);
    response.then(() => events.push('fresh-data'));
    await warm;
    assert.deepEqual(events, ['code']);
    respond();
    await response;
    assert.deepEqual(events, ['code', 'fresh-data']);
});

test('a failed warm is recoverable by the real visit and does not leave a rejected module cached', async () => {
    let loads = 0;
    const module = { default: null };
    const preloader = createPagePreloader({ './Pages/POS/Index.jsx': async () => {
        if (++loads === 1) throw new Error('Temporary asset failure');
        return module;
    } });
    assert.equal(await preloader.warmVisit({ url: '/pos' }, origin), false);
    assert.equal(await preloader.load('POS/Index'), module);
    assert.equal(loads, 2);
    assert.equal(await preloader.warmVisit({ url: '/unknown' }, origin), false);
});
