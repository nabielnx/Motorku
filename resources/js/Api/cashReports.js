import axios from 'axios';
import { entityPayload } from './entityPayload.js';

export async function cashSummary(date, signal) {
    return entityPayload(await axios.get('/api/reports/cash', { params: { date }, signal }));
}

export async function closeCash(payload) {
    return entityPayload(await axios.post('/api/reports/cash/close', payload));
}
