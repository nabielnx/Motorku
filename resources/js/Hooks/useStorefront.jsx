import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { businessStorage, storefrontUrl } from '@/Utils/storefrontContext';

export default function useStorefront({ admin = false } = {}) {
    const { business, shop_slug, auth } = usePage().props;
    const storage = useMemo(() => businessStorage(business?.id, localStorage, admin ? auth?.user?.id : null), [business?.id, admin, auth?.user?.id]);
    return { storage, storeUrl: path => storefrontUrl(path, shop_slug) };
}
