import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        cors: true,
        hmr: {
            host: process.env.VITE_HOST || 'localhost',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-inertia': ['react', 'react-dom', '@inertiajs/react'],
                    'vendor-headless': ['@headlessui/react'],
                },
            },
        },
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
