// Motorku stays online-first. Do not cache pages or API responses because they
// can contain private customer, staff, inventory, and transaction data.
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
