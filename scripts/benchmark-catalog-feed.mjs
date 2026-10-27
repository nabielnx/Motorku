import { performance } from 'node:perf_hooks';
import { catalogPageProducts } from '../resources/js/Utils/catalogFeedState.js';

const rows = Array.from({ length: 2000 }, (_, id) => ({ id: String(id), name: `Produk ${id}`, price: 15000, stock: 50, image: `/storage/products/business-id/product-${id}.webp`, thumbnail: `/storage/products/business-id/product-${id}.preview.webp` }));
const variants = [];
for (const bounded of [false, true]) {
    const runs = [];
    for (let run = 0; run < 3; run++) {
        let products = [], peakRows = 0, peakSerializedBytes = 0;
        const start = performance.now();
        for (let index = 0; index < rows.length; index += 60) {
            products = catalogPageProducts(products, rows.slice(index, index + 60), true, bounded);
            peakRows = Math.max(peakRows, products.length);
            peakSerializedBytes = Math.max(peakSerializedBytes, Buffer.byteLength(JSON.stringify(products)));
        }
        runs.push({ peakRows, peakSerializedBytes, elapsedMs: Number((performance.now() - start).toFixed(3)) });
    }
    variants.push({ mode: bounded ? 'bounded page' : 'append baseline', runs });
}
const result = { dataset: '2000 synthetic product records, 60 per page, no image downloads', metric: 'retained row count and serialized record bytes, not browser heap or network latency', variants };
console.log(JSON.stringify(result, null, 2));
