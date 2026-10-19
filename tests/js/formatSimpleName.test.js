import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSimpleName } from '../../resources/js/Utils/productBookFormatter.js';

test('formatSimpleName simplifies bulky product names into clear readable notes', () => {
    // 1. Bulky tire names with application brackets at the end
    assert.equal(
        formatSimpleName('Ban Luar IRC Ring 8 - 3.50 Non-Tubeless (Scooter / Vespa)'),
        'Ban Luar IRC R8 - 3.50 Non-TL'
    );
    assert.equal(
        formatSimpleName('Ban Luar IRC Ring 14 - 70/90 Non-Tubeless (Matic Ring 14)'),
        'Ban Luar IRC R14 - 70/90 Non-TL'
    );
    assert.equal(
        formatSimpleName('Ban Depan Federal AHM FT235 80/90-14 Tubeless'),
        'Ban Depan Federal AHM FT235 80/90-14 TL'
    );
    assert.equal(
        formatSimpleName('Ban Depan IRC NR73 70/90-14 Tubetype (Non-Tubeless)'),
        'Ban Depan IRC NR73 70/90-14 Non-TL'
    );

    // 2. Sparepart names with secondary words stripped when long
    assert.equal(
        formatSimpleName('Kampas Rem Depan Honda Beat FI ESP K25'),
        'Kampas Rem Depan Honda Beat FI ESP K25'
    );
    assert.equal(
        formatSimpleName('Koj Set'),
        'Koj Set'
    );

    // 3. Fallback and empty
    assert.equal(formatSimpleName(''), '');
    assert.equal(formatSimpleName(null), '');
});
