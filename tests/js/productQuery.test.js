import assert from 'node:assert/strict';
import test from 'node:test';
import { productQuery } from '../../resources/js/Utils/productQuery.js';

const filters = {
    perPage: 18, selectedGroup: 'bicycle', selectedCategoryFilter: 'tire',
    searchQuery: 'swallow', selectedStockFilter: 'low', statusFilter: 'active', selectedSort: 'price_desc',
};

test('changing a catalog filter resets pagination and preserves every other selection', () => {
    const current = productQuery(filters, { page: 3 });
    for (const [field, value] of Object.entries({ category: 'oil', stock_status: 'out', availability: 'inactive', sort: 'name_asc', search: 'irc' })) {
        const next = productQuery(filters, { [field]: value });
        assert.equal(next.page, 1);
        assert.equal(next[field], value);
        for (const key of Object.keys(current).filter(key => !['page', field].includes(key))) assert.equal(next[key], current[key]);
    }
    assert.equal(current.page, 3);
    assert.equal(current.group, 'bicycle');
    assert.equal(current.per_page, 18);
});

test('all/default filters remain absent while clearing a single filter keeps search and group', () => {
    assert.deepEqual(productQuery({ perPage: 16, selectedCategoryFilter: 'All', selectedStockFilter: 'all', statusFilter: 'all', selectedSort: 'latest' }), {
        per_page: 16, group: undefined, page: 1, category: undefined, search: undefined,
        stock_status: undefined, availability: undefined, sort: undefined,
    });
    const cleared = productQuery(filters, { category: undefined });
    assert.equal(cleared.category, undefined);
    assert.equal(cleared.search, 'swallow');
    assert.equal(cleared.group, 'bicycle');
});
