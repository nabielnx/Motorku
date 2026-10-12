import axios from 'axios';
import { entityPayload } from './entityPayload.js';

export async function createCustomerOrder(payload) {
    return entityPayload(await axios.post('/api/customer/order', payload));
}

export async function cancelCustomerOrder(orderId, customerToken) {
    return entityPayload(await axios.post(`/api/customer/order/${orderId}/cancel`, {
        customer_token: customerToken,
    }));
}

export async function customerOrderStatus(orderId, customerToken, signal) {
    return entityPayload(await axios.get(`/api/customer/order/${orderId}/status`, {
        params: { customer_token: customerToken }, signal,
    }));
}
