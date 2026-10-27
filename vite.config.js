import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import loadingSkeletonsPlugin from './scripts/loading-skeletons-plugin.mjs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
    server: {
        host: env.VITE_DEV_HOST || '127.0.0.1',
        cors: { origin: [...new Set([env.APP_URL || 'http://localhost:8000', 'http://localhost:8000', 'http://127.0.0.1:8000', ...(env.VITE_DEV_ORIGINS || '').split(',').filter(Boolean)])] },
        hmr: {
            host: env.VITE_HOST || 'localhost',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-inertia': ['react', 'react-dom', '@inertiajs/react', 'clsx'],
                    'vendor-headless': ['@headlessui/react'],
                },
            },
        },
    },
    plugins: [
        loadingSkeletonsPlugin(),
        laravel({
            input: ['resources/js/app.jsx', 'resources/css/admin.css'],
            refresh: true,
        }),
        react(),
    ],
    };
});
