import '../css/app.css';
import '../css/customer-storefront.css';
import '../css/customer-orders.css';
import '../css/admin-controls.css';
import '../css/admin-visual.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { createPagePreloader } from './Utils/navigationAssets';
import { createRoot } from 'react-dom/client';
import { prepareProductVisit } from './Utils/productPagination';

const pagePreloader = createPagePreloader(import.meta.glob('./Pages/**/*.jsx'));

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
    void pagePreloader.warmVisit(event.detail.visit, window.location.href);
});

// Warm the destination's JS/CSS on link intent, including keyboard navigation.
const warmLinkAssets = event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    void pagePreloader.warmVisit({ method: 'get', url: link.href }, window.location.href);
};
document.addEventListener('pointerover', warmLinkAssets, { passive: true });
document.addEventListener('focusin', warmLinkAssets, { passive: true });
if (import.meta.hot) import.meta.hot.dispose(() => {
    document.removeEventListener('pointerover', warmLinkAssets);
    document.removeEventListener('focusin', warmLinkAssets);
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
const businessPages = new Map();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        if (businessPages.has(name)) return businessPages.get(name);
        const module = await pagePreloader.load(name);
        const Page = module.default;
        const BusinessPage = props => <Page key={`${props.business?.id || 'platform'}:${props.auth?.user?.id || 'guest'}`} {...props} />;
        BusinessPage.layout = Page.layout;
        businessPages.set(name, BusinessPage);
        return BusinessPage;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#FFDD00', // Accent Yellow (Workshop Ledger)
    },
});
