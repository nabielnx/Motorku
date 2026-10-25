import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { businessStorage, customerStorage, storefrontUrl } from '@/Utils/storefrontContext';

export default function useStorefront({ admin = false } = {}) {
    const { business, shop_slug, auth, customer } = usePage().props;
    const storage = useMemo(() => admin ? businessStorage(business?.id, localStorage, auth?.user?.id) : customerStorage(business?.id, localStorage, customer?.id), [business?.id, admin, auth?.user?.id, customer?.id]);
    return { storage, storeUrl: path => storefrontUrl(path, shop_slug) };
}
