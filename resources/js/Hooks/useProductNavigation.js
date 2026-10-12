import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { productQuery } from '@/Utils/productQuery';

export default function useProductNavigation(filters, totalPages) {
    const latestFilters = useRef(filters);
    useEffect(() => { latestFilters.current = filters; });
    const firstSearch = useRef(true);

    const visit = (overrides = {}) => router.get('/products', productQuery(latestFilters.current, overrides), {
        preserveState: true,
        preserveScroll: true,
    });

    useEffect(() => {
        if (firstSearch.current) {
            firstSearch.current = false;
            return;
        }
        const timer = setTimeout(() => visit(), 400);
        return () => clearTimeout(timer);
    }, [filters.searchQuery]);

    return {
        visitProducts: visit,
        changeProductPage(page) {
            if (page < 1 || page > totalPages) return;
            visit({ page });
        },
    };
}
