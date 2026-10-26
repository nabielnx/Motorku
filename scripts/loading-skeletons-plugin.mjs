import { buildLoadingSkeletons } from './build-loading-skeletons.mjs';

export default function loadingSkeletonsPlugin() {
    return {
        name: 'tokom-loading-skeletons',
        apply: 'serve',
        async configureServer(server) {
            await buildLoadingSkeletons();
            let timer;
            let pending = Promise.resolve();
            const onChange = filename => {
                const normalized = filename.replaceAll('\\', '/');
                if (!normalized.includes('/Components/Skeletons/') && !normalized.endsWith('/Loading/pageSkeletons.jsx') && !normalized.endsWith('/Components/Skeleton.jsx') && !normalized.endsWith('/Components/Pagination.jsx')) return;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    pending = pending.then(() => buildLoadingSkeletons()).catch(error => server.config.logger.error(`Loading skeleton generation failed: ${error.message}`));
                }, 200);
            };
            server.watcher.on('change', onChange);
            server.httpServer?.once('close', () => {
                clearTimeout(timer);
                server.watcher.off('change', onChange);
            });
        },
    };
}
