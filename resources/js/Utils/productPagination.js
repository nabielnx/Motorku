export function productPageSize(viewMode, width) {
    const columns = width >= 1700 ? 6 : width >= 1280 ? 5 : width >= 1024 ? 4 : width >= 640 ? 3 : 2;
    return viewMode === 'grid' ? Math.ceil(16 / columns) * columns : 16;
}

// Choose the page size before Inertia sends the first catalog request.
export function prepareProductVisit(visit, viewMode, width) {
    if (visit.method !== 'get' || visit.url.pathname !== '/products' || visit.url.searchParams.has('per_page')) return;
    visit.url.searchParams.set('per_page', String(productPageSize(viewMode, width)));
}
