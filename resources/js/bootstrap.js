import axios from 'axios';
// Pages currently poll for updates; initialize Echo only when a page subscribes to a channel.
import { installCsrfRecovery } from './Utils/csrf';

window.axios = axios;

window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;
window.axios.defaults.timeout = 30000;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

installCsrfRecovery(window.axios);
window.axios.interceptors.response.use(response => {
    if (!response._apiUnwrapped && response.data && typeof response.data === 'object' && response.data.success === true && 'data' in response.data) {
        response._apiUnwrapped = true;
        const original = response.data;
        response.data = original.data;
        if (response.data && typeof response.data === 'object') {
            response.data.message = original.message;
            response.data.success = original.success;
        }
    }
    return response;
});
