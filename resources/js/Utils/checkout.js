export function createRequestId(cryptoApi = globalThis.crypto) {
    if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
    if (typeof cryptoApi?.getRandomValues !== 'function') {
        throw new Error('Browser tidak mendukung pembuatan ID transaksi. Gunakan browser yang diperbarui.');
    }
    // getRandomValues is also available on HTTP pages where randomUUID is unavailable.
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Keep the key after a timeout or reload so a manual retry returns the same order.
export function checkoutRequestId(storage, storageKey, payload, uuid = createRequestId) {
    const fingerprint = JSON.stringify(payload);
    let previous;
    try { previous = JSON.parse(storage.getItem(storageKey)); } catch { /* Replace invalid stored state. */ }
    if (previous?.fingerprint === fingerprint && previous?.id) return previous.id;
    const id = uuid();
    storage.setItem(storageKey, JSON.stringify({ id, fingerprint }));
    return id;
}
