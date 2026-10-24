import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { requestQrisQuote } from '../../resources/js/Api/qris.js';

test('QRIS quote parsing works with the application response interceptor', async t => {
    const quote = {
        payload: '0002010102125908TOKO UJI6304TEST',
        amount: 262000,
        merchant: { name: 'TOKO UJI', city: 'DEMAK' },
        quote_token: 'a'.repeat(64),
    };
    const payload = { items: [{ product_id: 'product', quantity: 1 }], expected_amount: quote.amount };
    const previousAdapter = axios.defaults.adapter;
    const previousWindow = globalThis.window;
    const responseHandlers = axios.interceptors.response.handlers.length;
    const requestHandlers = axios.interceptors.request.handlers.length;
    const controller = new AbortController();
    axios.defaults.adapter = async config => {
        assert.equal(config.url, '/api/payments/qris/quote');
        assert.equal(config.method, 'post');
        assert.deepEqual(JSON.parse(config.data), payload);
        assert.equal(config.signal, controller.signal);
        return { config, status: 200, headers: {}, data: { success: true, message: 'Ready', data: { ...quote } } };
    };
    try {
        await t.test('accepts the server envelope before bootstrap is installed', async () => {
            assert.deepEqual(await requestQrisQuote(payload, { signal: controller.signal }), quote);
        });

        globalThis.window = {};
        await import('../../resources/js/bootstrap.js');

        await t.test('accepts the quote after the real bootstrap interceptor unwraps it', async () => {
            assert.deepEqual(await requestQrisQuote(payload, { signal: controller.signal }), quote);
        });

        await t.test('rejects incomplete successful responses', async () => {
            axios.defaults.adapter = async config => ({ config, status: 200, headers: {}, data: { success: true, data: { amount: 262000 } } });
            await assert.rejects(requestQrisQuote(payload), /Respons QRIS tidak lengkap/);
        });

        await t.test('preserves server validation failures', async () => {
            const error = new axios.AxiosError('Invalid', 'ERR_BAD_REQUEST', {}, null, { status: 422, data: { message: 'Harga berubah' } });
            axios.defaults.adapter = async () => { throw error; };
            await assert.rejects(requestQrisQuote(payload), actual => actual === error);
        });
    } finally {
        axios.defaults.adapter = previousAdapter;
        for (let i = responseHandlers; i < axios.interceptors.response.handlers.length; i++) axios.interceptors.response.eject(i);
        for (let i = requestHandlers; i < axios.interceptors.request.handlers.length; i++) axios.interceptors.request.eject(i);
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
    }
});
