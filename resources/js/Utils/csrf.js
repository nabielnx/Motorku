// A rejected CSRF request has not reached the controller. Never retry network/5xx failures.
export function clearCsrfHeaders(config) {
    for (const key of Object.keys(config.headers || {})) {
        if (['x-csrf-token', 'x-xsrf-token'].includes(key.toLowerCase())) delete config.headers[key];
    }
    // Axios resolves this header from the current cookie immediately before sending.
    return config;
}

export function installCsrfRecovery(client) {
    let refresh;
    clearCsrfHeaders({ headers: client.defaults.headers.common });
    client.interceptors.request.use(clearCsrfHeaders);
    client.interceptors.response.use(response => response, async error => {
        const config = error.config;
        if (error.response?.status !== 419 || !config || config._csrfRetried || config.url === '/sanctum/csrf-cookie') throw error;
        config._csrfRetried = true;
        refresh ??= client.get('/sanctum/csrf-cookie').finally(() => { refresh = null; });
        await refresh;
        return client(clearCsrfHeaders(config));
    });
}
