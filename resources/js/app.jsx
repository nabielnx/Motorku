import '../css/app.css';
import '../css/admin-controls.css';
import '../css/admin-visual.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { prepareProductVisit } from './Utils/productPagination';

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((error) => {
            console.error('Motorku service worker registration failed:', error);
        });
    }, { once: true });
}

router.on('before', (event) => {
    let viewMode = 'list';
    try { viewMode = localStorage.getItem('product_view_mode_v2') || 'list'; } catch {}
    prepareProductVisit(event.detail.visit, viewMode, window.innerWidth);
});

router.on('invalid', (event) => {
    if (event.detail.response.status === 419) {
        event.preventDefault();
        if (confirm(
            'Sesi Anda telah berakhir. ' +
            'Halaman akan di-refresh untuk melanjutkan.'
        )) {
            router.reload({ preserveState: false });
        }
    }
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#2563eb', // blue-600
    },
});
