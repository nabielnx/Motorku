import { storefrontUrl, currentShopSlug } from '../Utils/storefrontContext.js';
import axios from 'axios';
import { entityPayload } from './entityPayload.js';

export async function createCustomerOrder(payload) {
    return entityPayload(await axios.post(storefrontUrl('/api/customer/order', currentShopSlug()), payload));
}

export async function cancelCustomerOrder(orderId, customerToken) {
    return entityPayload(await axios.post(storefrontUrl(`/api/customer/order/${orderId}/cancel`, currentShopSlug()), {
        customer_token: customerToken,
    }));
}

export async function customerOrderStatus(orderId, customerToken, signal) {
    return entityPayload(await axios.get(storefrontUrl(`/api/customer/order/${orderId}/status`, currentShopSlug()), {
        params: { customer_token: customerToken }, signal,
    }));
}

export async function customerOrderQris(orderId, customerToken, signal) {
    return entityPayload(await axios.post(storefrontUrl(`/api/customer/order/${orderId}/qris`, currentShopSlug()), {
        customer_token: customerToken,
    }, { signal }));
}
