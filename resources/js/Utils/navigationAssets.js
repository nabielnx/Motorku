// Preload code only. Prices, stock, account data and payment state still come
// from the normal, fresh Inertia visit; no page responses are cached here.
const pages = new Map([
    ['/', 'Store/Entry'], ['/dashboard', 'Dashboard/Owner/Index'],
    ['/pos', 'POS/Index'], ['/products', 'Product/Index'],
    ['/orders', 'Order/Index'], ['/reports', 'Report/Index'],
    ['/settings', 'Setting/Index'], ['/users', 'User/Index'],
    ['/profile', 'Profile/Edit'], ['/suppliers', 'Supplier/Index'],
    ['/data-types', 'DataType/Index'], ['/motorcycles', 'Motorcycle/Index'],
    ['/motor-saya', 'Motorcycle/MotorSaya'], ['/payment', 'Payment/Index'],
    ['/order/status', 'Order/Status'], ['/order/waiting', 'Order/Waiting'],
]);

export function navigationPage(visit, currentHref) {
    if (!visit?.url || visit.async || (visit.method && visit.method.toLowerCase() !== 'get')) return null;
    try {
        const current = new URL(currentHref);
        const target = new URL(visit.url, current);
        if (target.origin !== current.origin || target.username || target.password) return null;
        const path = target.pathname.replace(/\/+$/, '') || '/';
        if (pages.has(path)) return pages.get(path);
        if (/^\/s\/[a-z0-9-]+$/.test(path)) return 'Order/Menu';
        if (/^\/motor-saya\/[a-z0-9-]+$/.test(path)) return 'Motorcycle/MotorSaya';
        if (/^\/orders\/[a-f0-9-]{36}$/i.test(path)) return 'Order/Show';
        if (/^\/references\/[a-f0-9-]{36}$/i.test(path)) return 'Reference/Index';
    } catch {}
    return null;
}

export function createPagePreloader(loaders) {
    const pending = new Map();
    const load = name => {
        if (pending.has(name)) return pending.get(name);
        const loader = loaders[`./Pages/${name}.jsx`];
        if (!loader) return Promise.reject(new Error(`Unknown page: ${name}`));
        const promise = Promise.resolve().then(loader).catch(error => {
            pending.delete(name);
            throw error;
        });
        pending.set(name, promise);
        return promise;
    };
    return {
        load,
        warmVisit(visit, currentHref) {
            const name = navigationPage(visit, currentHref);
            return name ? load(name).then(() => true, () => false) : Promise.resolve(false);
        },
    };
}
