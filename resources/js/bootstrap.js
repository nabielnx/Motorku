import axios from 'axios';
import { router } from '@inertiajs/react';
import './echo';

window.axios = axios;

window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Dynamically set latest X-CSRF-TOKEN / X-XSRF-TOKEN before every request
window.axios.interceptors.request.use((config) => {
    const xsrfCookie = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (xsrfCookie) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfCookie[1]);
    }
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (metaToken) {
        config.headers['X-CSRF-TOKEN'] = metaToken;
    }
    return config;
});

let isRefreshingCsrf = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

window.axios.interceptors.response.use(
    response => {
        // Automatically unwrap standardized API responses
        if (response.data && typeof response.data === 'object' && 'success' in response.data) {
            const originalData = response.data;
            if ('data' in originalData) {
                // Replace response.data with the inner data payload
                response.data = originalData.data;

                // If the inner data is an object (or array), attach the message back
                // so that frontend code expecting `res.data.message` still works
                if (response.data !== null && typeof response.data === 'object') {
                    response.data.message = originalData.message;
                    response.data.success = originalData.success;
                }
            }
        }
        return response;
    },
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 419 && !originalRequest._retry) {
            if (isRefreshingCsrf) {
                // Request ini diantrekan selama refresh berjalan; tandai agar
                // tidak retry-meny-retry saat refresh selesai.
                originalRequest._retry = true;
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => window.axios(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshingCsrf = true;

            try {
                // Refresh session & CSRF cookie transparently from Sanctum/web route
                await window.axios.get('/sanctum/csrf-cookie');

                const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                if (match) {
                    const token = decodeURIComponent(match[1]);
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', token);
                    if (originalRequest.headers) {
                        originalRequest.headers['X-XSRF-TOKEN'] = token;
                        originalRequest.headers['X-CSRF-TOKEN'] = token;
                    }
                }

                processQueue(null);
                return window.axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                return Promise.reject(refreshError);
            } finally {
                isRefreshingCsrf = false;
            }
        }

        // Sudah retry CSRF sekali tapi masih 419 → sesi/token benar-benar basi
        // (mis. setelah deploy atau sesi di-clear server). Reload halaman agar
        // sesi & token dibangun ulang — setara refresh manual, tanpa melakukannya
        // untuk request GET (polling background) agar tidak reload mengganggu.
        if (error.response?.status === 419
            && originalRequest._retry
            && originalRequest.method?.toLowerCase() !== 'get') {
            window.location.reload();
        }

        return Promise.reject(error);
    }
);
