import { currentStorageKey, scopedBrandStorage } from './brandStorage.js';

export const LEGACY_BUSINESS_ID = '00000000-0000-4000-8000-000000000001';

export function storefrontUrl(path, slug) {
    if (!slug) return path;
    const url = new URL(path, 'https://tokom.invalid');
    if (url.origin !== 'https://tokom.invalid') return path;
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
    return scopedBrandStorage(prefix, storage);
}

// Keep the shopping cart across login, while receipts and checkout retry data
// remain private to the current customer on a shared browser.
export function customerStorage(businessId, storage, customerId) {
    const guest = businessStorage(businessId, storage);
    if (!customerId) return guest;
    const account = businessStorage(businessId, storage, `customer:${customerId}`);
    const accountKey = key => {
        const current = currentStorageKey(key);
        return current.startsWith('tokom_order') || ['tokom_current_order', 'tokom_archived_order_ids', 'tokom_legacy_history_cleaned_v1', 'tokom_checkout_attempt', 'tokom_checkout_draft'].includes(current);
    };
    const target = key => accountKey(key) ? account : guest;
    return {
        key: key => target(key).key(key),
        keys: () => [...guest.keys().filter(key => !accountKey(key)), ...account.keys().filter(accountKey)],
        matchesEventKey: key => (guest.matchesEventKey(key) && !accountKey(key.slice(guest.key('').length)))
            || (account.matchesEventKey(key) && accountKey(key.slice(account.key('').length))),
        getItem: key => target(key).getItem(key),
        setItem: (key, value) => target(key).setItem(key, value),
        removeItem: key => target(key).removeItem(key),
    };
}
