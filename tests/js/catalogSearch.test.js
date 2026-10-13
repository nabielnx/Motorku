import test from 'node:test';
import assert from 'node:assert/strict';
import corpus from '../fixtures/catalog-search.json' with { type: 'json' };
import { matchItem, fuzzyFilterProducts } from '../../resources/js/Utils/fuzzySearch.js';

for (const fixture of corpus) {
    test(`catalogue meaning and identifiers: ${fixture.item.name || fixture.item.model}`, () => {
        for (const query of fixture.yes) assert.equal(matchItem(fixture.item, query).match, true, query);
        for (const query of fixture.no) assert.equal(matchItem(fixture.item, query).match, false, query);
    });
}

test('exact names outrank synonyms, descriptions and typos with stable ties', () => {
    const exact = { name: 'Kampas Rem' };
    const synonym = { name: 'Brake Pad' };
    const description = { name: 'Premium Item', description: 'kampas rem' };
    const typo = { name: 'Kampass Rem' };
    assert.deepEqual(fuzzyFilterProducts([typo, description, synonym, exact], 'kampas rem'), [exact, synonym, typo, description]);
    const twin = { ...synonym };
    assert.deepEqual(fuzzyFilterProducts([twin, synonym], 'kampas rem'), [twin, synonym]);
});

test('category filters, blank queries, updates and query bounds', () => {
    const item = { name: 'Honda Brake Pad', group: 'motor' };
    const other = { name: 'Brake Pad', group: 'sepeda' };
    assert.deepEqual(fuzzyFilterProducts([other, item], 'kampas rem', { filterPredicate: p => p.group === 'motor' }), [item]);
    assert.deepEqual(fuzzyFilterProducts([other, item], '  '), [other, item]);
    assert.equal(matchItem(item, 'kampas rem').match, true);
    item.name = 'Engine Oil';
    assert.equal(matchItem(item, 'kampas rem').match, false);
    assert.equal(matchItem(item, 'oli mesin').match, true);
    assert.equal(matchItem(item, 'x'.repeat(161)).match, false);
    assert.equal(matchItem(item, 'cari dong tolong').match, false);
});
