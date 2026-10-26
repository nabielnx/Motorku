import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.join(root, 'public/build/skeletons');
export async function buildLoadingSkeletons() {
    const server = await createServer({
        root,
        configFile: false,
        envFile: false,
        logLevel: 'error',
        plugins: [react()],
        resolve: { alias: { '@': path.join(root, 'resources/js') } },
        server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    });

    try {
        const { default: PageSkeleton, loadingPages } = await server.ssrLoadModule('/resources/js/Loading/pageSkeletons.jsx');
        await mkdir(outputDirectory, { recursive: true });
        const manifest = { version: 1, pages: {}, skeletons: {} };
        let count = 0;
        for (const definition of loadingPages) {
            const variants = {};
            for (const view of definition.views || ['default']) {
                const filename = `${definition.key}-${view}.html`;
                const html = renderToStaticMarkup(React.createElement(PageSkeleton, { name: definition.key, view }));
                if (!html.includes('data-page-skeleton=')) throw new Error(`Empty skeleton: ${filename}`);
                await writeFile(path.join(outputDirectory, filename), html, 'utf8');
                variants[view] = filename;
                count++;
            }
            manifest.skeletons[definition.key] = { noPadding: Boolean(definition.noPadding), storageKey: definition.storageKey || null, defaultView: definition.views?.[0] || 'default', variants };
            for (const page of definition.pages) manifest.pages[page] = definition.key;
        }
        await writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest), 'utf8');
        console.log(`Generated ${count} loading skeletons from shared React components.`);
    } finally {
        await server.close();
    }

}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildLoadingSkeletons();
