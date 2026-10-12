import { useState, useEffect, useRef, useCallback } from 'react';

export default function useMotorcycleParts() {
    const [partsData, setPartsData] = useState({}); // { [motorId]: { data, current_page, last_page, total, ... } }
    const [partsFilter, setPartsFilter] = useState({}); // { [motorId]: { search, category, group, is_recommended, page, per_page } }
    const [loadingParts, setLoadingParts] = useState({}); // { [motorId]: boolean }

    // Refs for race-condition prevention & search debouncing
    const searchTimersRef = useRef({});
    const fetchSeqRef = useRef({});
    const partsFilterRef = useRef(partsFilter);
    useEffect(() => { partsFilterRef.current = partsFilter; }, [partsFilter]);

    // Clean up debounced timers on unmount
    useEffect(() => {
        return () => {
            Object.values(searchTimersRef.current).forEach(t => clearTimeout(t));
        };
    }, []);

    // Helper to fetch parts for a motorcycle with sequence race-condition guard
    const fetchParts = useCallback(async (motorId, overrideParams = {}) => {
        setLoadingParts(prev => ({ ...prev, [motorId]: true }));

        // Track request sequence to prevent out-of-order race conditions
        const seq = (fetchSeqRef.current[motorId] || 0) + 1;
        fetchSeqRef.current[motorId] = seq;

        try {
            const currentFilter = partsFilterRef.current[motorId] || {
                search: '',
                category: 'semua',
                group: 'semua',
                is_recommended: false,
                page: 1,
                per_page: 5
            };

            const query = {
                page: overrideParams.page !== undefined ? overrideParams.page : currentFilter.page,
                per_page: overrideParams.per_page !== undefined ? overrideParams.per_page : currentFilter.per_page,
                search: overrideParams.search !== undefined ? overrideParams.search : currentFilter.search,
                part_category: overrideParams.category !== undefined ? overrideParams.category : currentFilter.category,
                group: overrideParams.group !== undefined ? overrideParams.group : currentFilter.group,
                is_recommended: overrideParams.is_recommended !== undefined ? (overrideParams.is_recommended ? 1 : '') : (currentFilter.is_recommended ? 1 : ''),
            };

            // Clean up 'semua' values
            if (query.part_category === 'semua') delete query.part_category;
            if (query.group === 'semua') delete query.group;
            if (!query.search) delete query.search;
            if (!query.is_recommended) delete query.is_recommended;

            const res = await window.axios.get(`/motorcycles/${motorId}/parts`, { params: query });

            // Discard response if a newer request was made while this was in flight
            if (fetchSeqRef.current[motorId] !== seq) return;

            setPartsData(prev => ({ ...prev, [motorId]: res.data }));
            setPartsFilter(prev => {
                const prevM = prev[motorId] || {};
                return {
                    ...prev,
                    [motorId]: {
                        ...prevM,
                        ...(overrideParams.category !== undefined && { category: overrideParams.category }),
                        ...(overrideParams.group !== undefined && { group: overrideParams.group }),
                        ...(overrideParams.is_recommended !== undefined && { is_recommended: overrideParams.is_recommended }),
                        page: res.data.current_page || 1,
                        per_page: res.data.per_page || 5,
                    }
                };
            });
        } catch (err) {
            if (fetchSeqRef.current[motorId] === seq) {
                console.error("Gagal memuat sparepart motor", err);
            }
        } finally {
            if (fetchSeqRef.current[motorId] === seq) {
                setLoadingParts(prev => ({ ...prev, [motorId]: false }));
            }
        }
    }, []);

    // Debounced search handler for motorcycle spareparts
    const handleSearchParts = useCallback((motorId, val) => {
        setPartsFilter(prev => ({
            ...prev,
            [motorId]: {
                ...(prev[motorId] || { category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 }),
                search: val,
                page: 1,
            }
        }));

        if (searchTimersRef.current[motorId]) {
            clearTimeout(searchTimersRef.current[motorId]);
        }

        searchTimersRef.current[motorId] = setTimeout(() => {
            fetchParts(motorId, { search: val, page: 1 });
        }, 300);
    }, [fetchParts]);

    // Instant clear search handler
    const handleClearSearch = useCallback((motorId) => {
        if (searchTimersRef.current[motorId]) {
            clearTimeout(searchTimersRef.current[motorId]);
        }
        setPartsFilter(prev => ({
            ...prev,
            [motorId]: {
                ...(prev[motorId] || { category: 'semua', group: 'semua', is_recommended: false, page: 1, per_page: 5 }),
                search: '',
                page: 1,
            }
        }));
        fetchParts(motorId, { search: '', page: 1 });
    }, [fetchParts]);

    return { partsData, partsFilter, setPartsFilter, loadingParts, fetchParts, handleSearchParts, handleClearSearch };
}
