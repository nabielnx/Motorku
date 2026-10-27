import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const directory = 'public/build/';
const manifest = JSON.parse(readFileSync(`${directory}manifest.json`, 'utf8'));

function assets(entries) {
    const visited = new Set(), css = new Set(), js = new Set();
    function visit(key) {
        if (visited.has(key)) return;
        visited.add(key);
        const chunk = manifest[key];
        assert.ok(chunk, `Missing manifest entry: ${key}`);
        if (chunk.file.endsWith('.css')) css.add(chunk.file);
        if (chunk.file.endsWith('.js')) js.add(chunk.file);
        (chunk.css || []).forEach(file => css.add(file));
        (chunk.imports || []).forEach(visit);
    }
    entries.forEach(visit);
    const describe = files => [...files].map(file => {
        const bytes = readFileSync(directory + file);
        return { file, bytes: bytes.length, gzip: gzipSync(bytes).length };
    });
    return { css: describe(css), js: describe(js) };
}

const store = assets(['resources/js/app.jsx', 'resources/js/Pages/Order/Menu.jsx']);
const admin = assets(['resources/js/app.jsx', 'resources/js/Pages/Product/Index.jsx']);
const dialogs = assets(['resources/js/Components/Customer/MenuDialogs.jsx']);
const cssText = graph => graph.css.map(asset => readFileSync(directory + asset.file, 'utf8')).join('\n');
assert.ok(!store.js.some(asset => asset.file.includes('vendor-headless')), 'Popup library must not be an initial catalog dependency.');
assert.ok(dialogs.js.some(asset => asset.file.includes('vendor-headless')), 'Deferred dialogs must retain the accessible popup library.');
assert.ok(!cssText(store).includes('.admin-workspace') && !cssText(store).includes('.admin-button'), 'Admin styles must not be initial storefront dependencies.');
assert.ok(cssText(store).includes('.app-pagination'), 'Shared pagination styling must remain available to customers.');
assert.ok(cssText(admin).includes('.admin-workspace') && cssText(admin).includes('.admin-button'), 'Admin SPA navigation must retain its layout/control styling.');
assert.ok(manifest['resources/css/admin.css']?.file.endsWith('.css'), 'Admin skeletons need an initial stylesheet entry.');

const graphs = { store, admin, dialogs };
if (process.argv.includes('--json')) {
    console.log(JSON.stringify(graphs, null, 2));
} else {
    console.table(Object.entries(graphs).map(([graph, assets]) => ({
        graph,
        cssGzipBytes: assets.css.reduce((sum, asset) => sum + asset.gzip, 0),
        jsGzipBytes: assets.js.reduce((sum, asset) => sum + asset.gzip, 0),
    })));
    console.log('Storefront/admin asset isolation checks passed. Gzip estimates, not network timings.');
}
