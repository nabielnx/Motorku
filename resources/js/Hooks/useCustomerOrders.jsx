import { useCallback, useEffect, useRef, useState } from 'react';
import { customerOrderStatus } from '@/Api/customerOrders';
import { readCustomerOrders, saveCustomerOrder, archivedOrderIds, archiveCustomerOrders, cleanLegacyCustomerOrders, restoreArchivedCustomerOrders } from '@/Utils/customerOrderStore';
import { isActiveOrder } from '@/Utils/customerOrderState';

export default function useCustomerOrders(storage) {
    const [orders, setOrders] = useState(() => readCustomerOrders(storage));
    const [syncing, setSyncing] = useState(false);
    const [storageError, setStorageError] = useState(false);
    const [archivedCount, setArchivedCount] = useState(() => archivedOrderIds(storage).length);
    const meta = useRef({});
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const timerTick = useRef(0);
    const apply = useCallback(() => {
        if (mounted.current) {
            setOrders(readCustomerOrders(storage).map(row => ({ ...row, ...meta.current[row.order_id] })));
            setArchivedCount(archivedOrderIds(storage).length);
        }
    }, [storage]);
    const refresh = useCallback(async (all = true) => {
        if (inFlight.current) return;
        inFlight.current = true;
        setSyncing(true);
        const rows = readCustomerOrders(storage);
        await Promise.all(rows.filter(row => all || isActiveOrder(row)).map(async row => {
            try {
                if (!row.customer_token) {
                    meta.current[row.order_id] = { connection: 'unavailable' };
                    return;
                }
                const latest = await customerOrderStatus(row.order_id, row.customer_token);
                if (!mounted.current) return;
                if (latest?.id !== row.order_id) throw new Error('Respons status tidak lengkap.');
                if (!saveCustomerOrder(storage, { ...latest, order_id: row.order_id, customer_token: row.customer_token }).persisted) setStorageError(true);
                meta.current[row.order_id] = { connection: 'fresh', lastSynced: Date.now() };
            } catch (error) {
                if (!mounted.current) return;
                meta.current[row.order_id] = {
                    ...meta.current[row.order_id],
                    connection: [401, 404].includes(error.response?.status) ? 'unavailable' : 'stale',
                };
            }
        }));
        if (mounted.current && all && rows.every(row => ['fresh', 'unavailable'].includes(meta.current[row.order_id]?.connection))) {
            try { cleanLegacyCustomerOrders(storage, rows.filter(row => meta.current[row.order_id]?.connection === 'unavailable').map(row => row.order_id)); }
            catch { setStorageError(true); }
        }
        inFlight.current = false;
        if (mounted.current) { setSyncing(false); apply(); }
    }, [storage, apply]);
    useEffect(() => {
        mounted.current = true;
        meta.current = {};
        apply(); refresh();
        const interval = setInterval(() => { timerTick.current++; refresh(timerTick.current % 8 === 0); }, 8000);
        const storageChanged = event => {
            if (!event.key || event.key.startsWith(storage.key('motorku_'))) { apply(); refresh(); }
        };
        const focus = () => refresh();
        window.addEventListener('storage', storageChanged);
        window.addEventListener('focus', focus);
        return () => { mounted.current = false; clearInterval(interval); window.removeEventListener('storage', storageChanged); window.removeEventListener('focus', focus); };
    }, [storage, apply, refresh]);
    const update = row => {
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
    return { orders, syncing, refresh, update, storageError, archivedCount, cleanArchived, restoreArchived };
}
