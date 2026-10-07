export function getNavigationDestination(visit, currentHref) {
    if (visit?.async || !visit?.url) return null;

    const current = new URL(currentHref);
    const target = new URL(visit.url, current);
    const changedCatalogGroup = target.pathname === '/products'
        && target.searchParams.get('group') !== current.searchParams.get('group');

    return target.pathname !== current.pathname || changedCatalogGroup
        ? target.pathname + target.search
        : null;
}
