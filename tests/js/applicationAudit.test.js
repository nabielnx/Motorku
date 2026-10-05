import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { installCsrfRecovery, clearCsrfHeaders } from '../../resources/js/Utils/csrf.js';
import { moneyDigits, validMoneyInput } from '../../resources/js/Utils/money.js';
import { mergeOrderUpdates } from '../../resources/js/Utils/orderHistory.js';
import { storeDate, reportPeriods } from '../../resources/js/Utils/dates.js';

test('CSRF recovery refreshes once concurrently, discards stale headers and bounds retries', async () => {
    let refreshes = 0;
    let writes = 0;
    let refreshed = false;
    const client = axios.create({ adapter: async config => {
        if (config.url === '/sanctum/csrf-cookie') {
            refreshes++;
            await new Promise(resolve => setTimeout(resolve, 10));
            refreshed = true;
            return { status: 204, data: null, config };
        }
        assert.equal(config.headers.get('X-CSRF-TOKEN'), undefined);
        assert.equal(config.headers.get('X-XSRF-TOKEN'), undefined);
        if (!refreshed || config.url === '/always-expired') {
            throw new axios.AxiosError('expired', null, config, null, { status: 419 });
        }
        writes++;
        return { status: 200, data: 'saved', config };
    }});
    installCsrfRecovery(client);
    await Promise.all(['/a', '/b'].map(url => client.post(url, {}, { headers: { 'X-CSRF-TOKEN': 'old', 'X-XSRF-TOKEN': 'old-cookie' } })));
    assert.equal(refreshes, 1);
    assert.equal(writes, 2);
    await assert.rejects(client.post('/always-expired', {}));
    assert.equal(refreshes, 2);
    assert.equal(writes, 2);
    assert.deepEqual(clearCsrfHeaders({ headers: { 'x-csrf-token': 'old', Accept: 'application/json' } }).headers, { Accept: 'application/json' });
});

test('uncertain network/server failures are never replayed', async () => {
    for (const status of [undefined, 500]) {
        let calls = 0;
        const client = axios.create({ adapter: async config => {
            calls++;
            throw new axios.AxiosError('failed', null, config, null, status ? { status } : undefined);
        }});
        installCsrfRecovery(client);
        await assert.rejects(client.post('/sale', {}));
        assert.equal(calls, 1);
    }
});

test('nominal input rejects negatives, scientific notation and malformed paste', () => {
    for (const value of ['-1.-2356', '-100', '1e6', 'Rp100', '1..000', '.100']) assert.equal(validMoneyInput(value), false);
    assert.equal(validMoneyInput('1.250.000'), true);
    assert.equal(moneyDigits('1.250.000'), '1250000');
    assert.equal(moneyDigits(''), '');
});

test('polling keeps history and cannot undo a concurrent cancellation', () => {
    const history = [{ order_id: 'a', order_status: 'cancelled' }, { order_id: 'b', order_status: 'pending' }];
    const merged = mergeOrderUpdates(history, [{ order_id: 'a', order_status: 'pending' }, null]);
    assert.deepEqual(merged, history);
    assert.equal(mergeOrderUpdates(history, [{ order_id: 'b', unavailable: true }]).length, 2);
});

test('report calendar uses store timezone and preserves month/year boundaries', () => {
    const instant = new Date('2026-10-04T18:00:00Z');
    assert.equal(storeDate(instant, 'Asia/Jakarta'), '2026-10-05');
    assert.equal(storeDate(instant, 'UTC'), '2026-10-04');
    assert.deepEqual(reportPeriods('2026-01-02')[3], { label: 'Bulan Lalu', start: '2025-12-01', end: '2025-12-31' });
    assert.equal(reportPeriods('2026-01-02')[1].start, '2025-12-27');
    assert.equal(reportPeriods('2024-03-01')[3].end, '2024-02-29');
});
