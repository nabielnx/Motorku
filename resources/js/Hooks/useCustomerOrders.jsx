import { useCallback, useEffect, useRef, useState } from 'react';
import { customerOrderStatus } from '@/Api/customerOrders';
import { readCustomerOrders, saveCustomerOrder, archivedOrderIds, archiveCustomerOrders, cleanLegacyCustomerOrders, restoreArchivedCustomerOrders } from '@/Utils/customerOrderStore';
import { isActiveOrder } from '@/Utils/customerOrderState';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { storefrontUrl } from '@/Utils/storefrontContext';

export default function useCustomerOrders(storage, filter = 'all') {
    const { customer, shop_slug } = usePage().props;
    const [orders, setOrders] = useState(() => customer ? [] : readCustomerOrders(storage));
    const [syncing, setSyncing] = useState(false);
    const [storageError, setStorageError] = useState(false);
    const [archivedCount, setArchivedCount] = useState(() => archivedOrderIds(storage).length);
    const [historyPage, setHistoryPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [counts, setCounts] = useState(null);
    const [accountError, setAccountError] = useState('');
    const detailId = new URLSearchParams(window.location.search).get('order');
    const meta = useRef({});
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const timerTick = useRef(0);
    const generation = useRef(0);
    const apply = useCallback(() => {
        if (mounted.current) {
            setOrders(readCustomerOrders(storage).map(row => ({ ...row, ...meta.current[row.order_id] })));
            setArchivedCount(archivedOrderIds(storage).length);
        }
    }, [storage]);
    const refresh = useCallback(async (all = true) => {
        if (inFlight.current) return;
        inFlight.current = true;
        const requestGeneration = generation.current;
        const current = () => mounted.current && generation.current === requestGeneration;
        setSyncing(true);
        if (customer) {
            try {
                const { data } = await axios.get(storefrontUrl(detailId ? `/customer/orders/${encodeURIComponent(detailId)}` : `/customer/orders?page=${historyPage}&filter=${filter}`, shop_slug));
                if (!current()) return;
                const rows = detailId ? [data.data] : data.data;
                if (!Array.isArray(rows)) throw new Error('Riwayat pesanan belum tersedia.');
                setOrders(rows.map(row => ({ ...row, order_id: row.id, connection: 'fresh', lastSynced: Date.now() })));
                setLastPage(data.last_page || 1);
                setCounts(data.counts || null);
                setAccountError('');
            } catch (error) {
                if (current()) {
                    setAccountError(error.response?.status === 401 ? 'Sesi pelanggan berakhir. Masuk kembali untuk melihat pesanan.' : 'Riwayat pesanan belum dapat dimuat. Coba perbarui.');
                    setOrders(previous => previous.map(row => ({ ...row, connection: 'stale' })));
                }
            } finally {
                if (current()) { inFlight.current = false; setSyncing(false); }
            }
            return;
        }
        const rows = readCustomerOrders(storage);
        await Promise.all(rows.filter(row => all || isActiveOrder(row)).map(async row => {
            try {
                if (!row.customer_token) {
                    meta.current[row.order_id] = { connection: 'unavailable' };
                    return;
                }
                const latest = await customerOrderStatus(row.order_id, row.customer_token);
                if (!current()) return;
                if (latest?.id !== row.order_id) throw new Error('Respons status tidak lengkap.');
                if (!saveCustomerOrder(storage, { ...latest, order_id: row.order_id, customer_token: row.customer_token }).persisted) setStorageError(true);
                meta.current[row.order_id] = { connection: 'fresh', lastSynced: Date.now() };
            } catch (error) {
                if (!current()) return;
                meta.current[row.order_id] = {
                    ...meta.current[row.order_id],
                    connection: [401, 404].includes(error.response?.status) ? 'unavailable' : 'stale',
                };
            }
        }));
        if (current() && all && rows.every(row => ['fresh', 'unavailable'].includes(meta.current[row.order_id]?.connection))) {
            try { cleanLegacyCustomerOrders(storage, rows.filter(row => meta.current[row.order_id]?.connection === 'unavailable').map(row => row.order_id)); }
            catch { setStorageError(true); }
        }
        if (current()) { inFlight.current = false; setSyncing(false); apply(); }
    }, [storage, apply, customer?.id, shop_slug, historyPage, detailId, filter]);
    useEffect(() => {
        mounted.current = true;
        inFlight.current = false;
        meta.current = {};
        if (!customer) apply();
        else setOrders([]);
        refresh();
        const interval = setInterval(() => { timerTick.current++; refresh(timerTick.current % 8 === 0); }, 8000);
        const storageChanged = event => {
            if (!event.key || event.key.startsWith(storage.key('motorku_'))) { if (!customer) apply(); refresh(); }
        };
        const focus = () => refresh();
        window.addEventListener('storage', storageChanged);
        window.addEventListener('focus', focus);
        return () => { mounted.current = false; generation.current++; clearInterval(interval); window.removeEventListener('storage', storageChanged); window.removeEventListener('focus', focus); };
    }, [storage, apply, refresh]);
    const update = row => {
        if (customer) { setOrders(previous => previous.map(order => order.order_id === (row.order_id || row.id) ? { ...order, ...row, connection: 'fresh' } : order)); return; }
        if (!saveCustomerOrder(storage, row).persisted) setStorageError(true);
        meta.current[row.order_id || row.id] = { connection: 'fresh', lastSynced: Date.now() };
        apply();
    };
    const cleanArchived = () => {
        try { archiveCustomerOrders(storage, orders.filter(order => order.connection === 'unavailable')); apply(); }
        catch { setStorageError(true); }
    };
    const restoreArchived = () => {
        try { restoreArchivedCustomerOrders(storage); apply(); refresh(); }
        catch { setStorageError(true); }
    };
    return { orders, syncing, refresh, update, storageError, archivedCount: customer ? 0 : archivedCount, cleanArchived, restoreArchived, historyPage, lastPage, setHistoryPage, accountError, counts };
}
