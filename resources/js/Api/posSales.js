import axios from 'axios';
import { entityPayload } from './entityPayload.js';

export async function createPosSale(payload) {
    return entityPayload(await axios.post('/api/orders/pos-sale', payload));
}
