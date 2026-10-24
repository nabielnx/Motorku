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
        getItem: key => storage.getItem(prefix + key),
        setItem: (key, value) => storage.setItem(prefix + key, value),
        removeItem: key => storage.removeItem(prefix + key),
    };
}
