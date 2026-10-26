import axios from 'axios';
import { entityPayload } from './entityPayload.js';
import { qrisQuoteSchema } from '../Utils/qris.js';

export async function requestQrisQuote(payload, { signal } = {}) {
    const response = await axios.post('/api/payments/qris/quote', payload, { signal });
    const parsed = qrisQuoteSchema.safeParse(entityPayload(response));
    if (!parsed.success) throw new Error('Respons QRIS tidak lengkap. Coba lagi.');
    return parsed.data;
}
