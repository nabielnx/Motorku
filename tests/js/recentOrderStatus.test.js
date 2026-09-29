import assert from 'node:assert/strict';
import test from 'node:test';
import { recentOrderStatus } from '../../resources/js/Pages/Dashboard/Owner/recentOrderStatus.js';

test('dashboard prioritizes cancellation over payment status', () => {
    assert.equal(recentOrderStatus({ order_status: 'cancelled', payment_status: 'unpaid' }).label, 'Dibatalkan');
    assert.equal(recentOrderStatus({ order_status: 'cancelled', payment_status: 'paid' }).label, 'Dibatalkan');
    assert.equal(recentOrderStatus({ order_status: 'completed', payment_status: 'paid' }).label, 'Lunas');
    assert.equal(recentOrderStatus({ order_status: 'completed', payment_status: 'refunded' }).label, 'Dikembalikan');
    assert.equal(recentOrderStatus({ order_status: 'pending', payment_status: 'unpaid' }).label, 'Belum lunas');
});
