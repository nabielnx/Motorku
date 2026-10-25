export const LEGACY_BUSINESS_ID = '00000000-0000-4000-8000-000000000001';

export function storefrontUrl(path, slug) {
    if (!slug) return path;
    const url = new URL(path, 'https://motorku.invalid');
    if (url.origin !== 'https://motorku.invalid') return path;
    url.searchParams.set('shop', slug);
    if (url.pathname === '/') {
        url.pathname = `/s/${encodeURIComponent(slug)}`;
        url.searchParams.delete('shop');
    }
    return `${url.pathname}${url.search}${url.hash}`;
}

export function currentShopSlug(location = globalThis.location) {
    if (!location) return null;
    return new URLSearchParams(location.search).get('shop') || location.pathname.match(/^\/s\/([a-z0-9-]+)\/?$/)?.[1] || null;
}

export function businessStorage(businessId, storage, userId = null) {
    const prefix = userId ? `business:${businessId}:user:${userId}:` : businessId && businessId !== LEGACY_BUSINESS_ID ? `business:${businessId}:` : '';
    return {
        key: key => prefix + key,
        keys: () => Array.from({ length: storage.length }, (_, index) => storage.key(index))
            .filter(key => key?.startsWith(prefix)).map(key => key.slice(prefix.length)),
        getItem: key => storage.getItem(prefix + key),
        setItem: (key, value) => storage.setItem(prefix + key, value),
        removeItem: key => storage.removeItem(prefix + key),
    };
}

// Keep the shopping cart across login, while receipts and checkout retry data
// remain private to the current customer on a shared browser.
export function customerStorage(businessId, storage, customerId) {
    const guest = businessStorage(businessId, storage);
    if (!customerId) return guest;
    const account = businessStorage(businessId, storage, `customer:${customerId}`);
    const accountKey = key => key.startsWith('motorku_order') || ['motorku_current_order', 'motorku_archived_order_ids', 'motorku_legacy_history_cleaned_v1', 'motorku_checkout_attempt', 'motorku_checkout_draft'].includes(key);
    const target = key => accountKey(key) ? account : guest;
    return {
        key: key => target(key).key(key),
        keys: () => [...guest.keys().filter(key => !accountKey(key)), ...account.keys().filter(accountKey)],
        getItem: key => target(key).getItem(key),
        setItem: (key, value) => target(key).setItem(key, value),
        removeItem: key => target(key).removeItem(key),
    };
}
