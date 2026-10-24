import { useEffect, useState } from 'react';
import axios from 'axios';
import { requestQrisQuote } from '../Api/qris.js';
import { qrisErrorMessage, renderQrisImage } from './qris';

export default function useQrisPayment({ open, active, items, amount }) {
    const [config, setConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [configError, setConfigError] = useState('');
    const [result, setResult] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const itemsKey = JSON.stringify(items.map(item => ({ product_id: item.product_id, quantity: item.quantity })));
    const key = JSON.stringify([itemsKey, amount, config?.image_revision, attempt]);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setConfigLoading(true);
        setConfigError('');
        axios.get('/api/settings/qris-image', { signal: controller.signal })
            .then(({ data }) => { if (!controller.signal.aborted) setConfig(data); })
            .catch(error => {
                if (!controller.signal.aborted) { setConfig(null); setConfigError(qrisErrorMessage(error)); }
            })
            .finally(() => { if (!controller.signal.aborted) setConfigLoading(false); });
        return () => controller.abort();
    }, [open, attempt]);

    useEffect(() => {
        setResult(null);
        if (!open || !active || configLoading || !config?.dynamic_available) return;
        const controller = new AbortController();
        requestQrisQuote({ items: JSON.parse(itemsKey), expected_amount: amount }, { signal: controller.signal })
            .then(async quote => {
                const imageUrl = await renderQrisImage(quote.payload);
                if (!controller.signal.aborted) setResult({ key, quote, imageUrl });
            })
            .catch(error => { if (!controller.signal.aborted) setResult({ key, error: qrisErrorMessage(error) }); });
        return () => controller.abort();
    }, [open, active, configLoading, config?.dynamic_available, itemsKey, amount, key]);

    const current = open && active && result?.key === key ? result : null;
    const dynamic = Boolean(config?.dynamic_available);
    const loading = configLoading || (open && active && dynamic && !current);
    const error = configError || current?.error || '';
    return {
        imageUrl: !open || loading || error ? null : (dynamic ? current?.imageUrl : config?.url),
        loading, error, dynamic,
        available: Boolean(config?.url),
        quote: current?.quote,
        merchant: current?.quote?.merchant || config?.merchant,
        retry: () => setAttempt(value => value + 1),
    };
}
