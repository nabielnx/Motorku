import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { createCustomerOrder, cancelCustomerOrder, customerOrderStatus } from '../../resources/js/Api/customerOrders.js';
import { cashSummary, closeCash } from '../../resources/js/Api/cashReports.js';
import { createPosSale } from '../../resources/js/Api/posSales.js';

test('entity adapters preserve payloads, authentication tokens and abort signals with either envelope shape', async () => {
    const previous = axios.defaults.adapter;
    const signal = new AbortController().signal;
    const calls = [];
    let wrapped = true;
    axios.defaults.adapter = async config => {
        calls.push(config);
        const entity = config.url === '/api/orders/pos-sale'
            ? { order: { id: 'order-1' }, payment: { invoice_number: 'INV-1' } }
            : { id: 'order-1', customer_token: 'token', order_status: 'pending' };
        return { status: 200, statusText: 'OK', headers: {}, config, data: wrapped ? { data: entity } : entity };
    };
    try {
        for (const shape of [true, false]) {
            wrapped = shape;
            const order = await createCustomerOrder({ request_id: 'retry-1' });
            assert.equal(order.id, 'order-1');
            assert.equal(order.customer_token, 'token');
            const status = await customerOrderStatus('order-1', 'secret-token', signal);
            assert.equal(status.order_status, 'pending');
            assert.equal(calls.at(-1).params.customer_token, 'secret-token');
            assert.equal(calls.at(-1).signal, signal);
            await cancelCustomerOrder('order-1', 'secret-token');
            assert.equal(JSON.parse(calls.at(-1).data).customer_token, 'secret-token');
            const cash = await cashSummary('2026-10-12', signal);
            assert.equal(cash.id, 'order-1');
            assert.equal(calls.at(-1).params.date, '2026-10-12');
            await closeCash({ actual_cash: 120000 });
            assert.equal(JSON.parse(calls.at(-1).data).actual_cash, 120000);
            const sale = await createPosSale({ request_id: 'pos-retry-1' });
            assert.equal(sale.order.id, 'order-1');
            assert.equal(sale.payment.invoice_number, 'INV-1');
        }
        axios.defaults.adapter = async config => { throw new axios.AxiosError('denied', null, config, null, { status: 422, data: { message: 'same error' } }); };
        await assert.rejects(createPosSale({}), error => error.response.status === 422 && error.response.data.message === 'same error');
    } finally {
        axios.defaults.adapter = previous;
    }
});
