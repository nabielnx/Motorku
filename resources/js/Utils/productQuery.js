// Build one catalog query so every filter keeps the other selections.
export function productQuery(filters, overrides = {}) {
    return {
        per_page: filters.perPage,
        group: filters.selectedGroup || undefined,
        page: 1,
        category: filters.selectedCategoryFilter === 'All' ? undefined : filters.selectedCategoryFilter,
        search: filters.searchQuery || undefined,
        stock_status: filters.selectedStockFilter === 'all' ? undefined : filters.selectedStockFilter,
        availability: filters.statusFilter === 'all' ? undefined : filters.statusFilter,
        sort: filters.selectedSort === 'latest' ? undefined : filters.selectedSort,
        ...overrides,
    };
}
