import assert from 'node:assert/strict';
import test from 'node:test';
import { deletionsAllowed } from '../../resources/js/Utils/deletion.js';

test('admin deletion is enabled for existing installations and follows the shared boolean setting', () => {
    assert.equal(deletionsAllowed(), true);
    assert.equal(deletionsAllowed({}), true);
    assert.equal(deletionsAllowed({ deletion_enabled: true }), true);
    assert.equal(deletionsAllowed({ deletion_enabled: false }), false);
});
