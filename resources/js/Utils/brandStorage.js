const CURRENT_PREFIX = 'tokom_';
const LEGACY_PREFIX = 'motorku_';

export function currentStorageKey(key) {
    return key.startsWith(LEGACY_PREFIX) ? CURRENT_PREFIX + key.slice(LEGACY_PREFIX.length) : key;
}

function previousStorageKey(key) {
    return key.startsWith(CURRENT_PREFIX) ? LEGACY_PREFIX + key.slice(CURRENT_PREFIX.length) : null;
}

// During the transition old tabs still write legacy keys. Keep that alias in
// sync, and promote it on reads, so checkout retry IDs and receipts survive
// mixed-version tabs and a rollback. Every key stays inside its existing scope.
export function scopedBrandStorage(prefix, storage) {
    const scoped = key => prefix + currentStorageKey(key);
    return {
        key: scoped,
        keys: () => [...new Set(Array.from({ length: storage.length }, (_, index) => storage.key(index))
            .filter(key => key?.startsWith(prefix)).map(key => currentStorageKey(key.slice(prefix.length))))],
        matchesEventKey: key => typeof key === 'string' && key.startsWith(prefix)
            && currentStorageKey(key.slice(prefix.length)).startsWith(CURRENT_PREFIX),
        getItem(key) {
            const current = currentStorageKey(key);
            const previous = previousStorageKey(current);
            const legacy = previous === null ? null : storage.getItem(prefix + previous);
            if (legacy !== null) {
                try {
                    if (storage.getItem(prefix + current) !== legacy) storage.setItem(prefix + current, legacy);
                } catch { /* An old receipt remains readable if the new alias cannot be saved. */ }
                return legacy;
            }
            return storage.getItem(prefix + current);
        },
        setItem(key, value) {
            const current = currentStorageKey(key);
            const previous = previousStorageKey(current);
            // The legacy alias is authoritative while pre-update tabs exist.
            // Propagate write failures so callers never claim an unsaved receipt.
            if (previous !== null) storage.setItem(prefix + previous, value);
            storage.setItem(prefix + current, value);
        },
        removeItem(key) {
            const current = currentStorageKey(key);
            const previous = previousStorageKey(current);
            if (previous !== null) storage.removeItem(prefix + previous);
            storage.removeItem(prefix + current);
        },
    };
}
