import assert from 'node:assert/strict';
import test from 'node:test';
import { salesChartTicks } from '../../resources/js/Pages/Dashboard/Owner/salesChartTicks.js';

test('sales chart labels stay evenly spaced and include both ends of the range', () => {
    for (const length of [7, 12, 15, 30, 31, 90, 366]) {
        for (const maxTicks of [4, 8]) {
            const ticks = [...salesChartTicks(length, maxTicks)];
            assert.equal(ticks.length, Math.min(length, maxTicks));
            assert.equal(ticks[0], 0);
            assert.equal(ticks.at(-1), length - 1);
            const gaps = ticks.slice(1).map((index, position) => index - ticks[position]);
            assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 1);
        }
    }
    assert.deepEqual([...salesChartTicks(7, 8)], [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual([...salesChartTicks(0, 8)], []);
    assert.deepEqual([...salesChartTicks(1, 8)], [0]);
});
