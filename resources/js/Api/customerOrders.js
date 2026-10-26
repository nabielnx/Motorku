import { storefrontUrl, currentShopSlug } from '../Utils/storefrontContext.js';
import axios from 'axios';
import { entityPayload } from './entityPayload.js';

export async function createCustomerOrder(payload) {
    return entityPayload(await axios.post(storefrontUrl('/customer/checkout', currentShopSlug()), payload));
}

export async function cancelCustomerOrder(orderId, customerToken) {
    return entityPayload(await axios.post(storefrontUrl(`/api/customer/order/${orderId}/cancel`, currentShopSlug()), {
        customer_token: customerToken,
    }));
}

export async function customerOrderStatus(orderId, customerToken, signal) {
    return entityPayload(await axios.get(storefrontUrl(`/api/customer/order/${orderId}/status`, currentShopSlug()), {
        headers: { 'X-Customer-Token': customerToken }, signal,
    }));
}

export async function reportCustomerPayment(orderId, customerToken, reference) {
    return entityPayload(await axios.post(storefrontUrl(`/api/customer/order/${orderId}/payment-review`, currentShopSlug()), {
        customer_token: customerToken, reference: reference || null,
    }));
}

export async function customerOrderQris(orderId, customerToken, signal) {
    return entityPayload(await axios.post(storefrontUrl(`/api/customer/order/${orderId}/qris`, currentShopSlug()), {
        customer_token: customerToken,
    }, { signal }));
}
