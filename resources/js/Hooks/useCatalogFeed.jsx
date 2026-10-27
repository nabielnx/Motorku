import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { catalogPageProducts } from '@/Utils/catalogFeedState';

export default function useCatalogFeed({ url, initialProducts, initialPagination, search = '', category = '', bounded = false }) {
    const [products, setProducts] = useState(initialProducts);
    const [pagination, setPagination] = useState(initialPagination || { next_page: null, total: initialProducts.length });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const activeRequest = useRef(null);
    const generation = useRef(0);
    const currentKey = `${url}\n${search.trim()}\n${category || ''}`;
    const keyRef = useRef(currentKey);
    keyRef.current = currentKey;

    const load = async (page, append = false) => {
        activeRequest.current?.abort();
        const controller = new AbortController();
        activeRequest.current = controller;
        const requestGeneration = ++generation.current;
        const requestKey = currentKey;
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(url, { params: { search: search.trim() || undefined, category: category || undefined, page }, signal: controller.signal });
            if (requestGeneration !== generation.current || requestKey !== keyRef.current) return;
            const data = response.data?.data;
            if (!Array.isArray(data?.products) || !data?.pagination) throw new Error('Respons katalog tidak lengkap.');
            setProducts(previous => catalogPageProducts(previous, data.products, append, bounded));
            setPagination(data.pagination);
            return true;
        } catch (failure) {
            if (requestGeneration === generation.current && requestKey === keyRef.current && !controller.signal.aborted) {
                setError(failure.response?.data?.message || 'Katalog belum dapat dimuat. Coba lagi.');
            }
        } finally {
            if (requestGeneration === generation.current && requestKey === keyRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        activeRequest.current?.abort();
        generation.current++;
        setError('');
        setLoading(false);
        if (!search.trim() && !category) {
            setProducts(initialProducts);
            setPagination(initialPagination || { next_page: null, total: initialProducts.length });
            return;
        }
        setProducts([]);
        setPagination({ next_page: null, total: 0 });
        const timer = setTimeout(() => { void load(1); }, 250);
        return () => { clearTimeout(timer); activeRequest.current?.abort(); };
    }, [currentKey, initialProducts, initialPagination]);

    useEffect(() => () => { generation.current++; activeRequest.current?.abort(); }, []);

    return { products, loading, error, total: pagination.total, hasMore: pagination.next_page !== null,
        bounded, page: pagination.page || 1, totalPages: pagination.last_page || Math.max(1, Math.ceil(pagination.total / 60)),
        goToPage: page => { if (!loading && page >= 1) return load(page); return Promise.resolve(false); },
        loadMore: () => { if (!loading && pagination.next_page) void load(pagination.next_page, true); },
        retry: () => { void load(1); },
    };
}
