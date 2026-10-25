# Catalog and navigation performance — 25 October 2026

Staging observations were anonymous, read-only, and made before these changes. No staging settings, data, or server configuration were changed.

## Staging baseline

Three samples per route over HTTPS, with gzip and the deployed Inertia asset version:

| Route | Response TTFB | JSON before compression | Wire bytes |
| --- | --- | --- | --- |
| `/s/toko-utama` | 306–332 ms | 329,644 | 27,334 |
| `/payment?shop=toko-utama` | 200–219 ms | 1,052 | 625 |
| `/motor-saya?shop=toko-utama` | 204–213 ms | 22,817 | 4,683 |

The storefront had 236 products. Motorcycle relations accounted for about 194 KB, including pivot identifiers, notes, business IDs, and timestamps unused by the customer UI. Static assets already had gzip and public one-week cache headers.

## Changes

- Hide unused fitment pivot metadata in the storefront and POS response only. Keep the existing motorcycle fields used by lists and product details. Product prices and stock remain fresh database reads.
- Evaluate product category counts and stock summaries only when requested by Inertia. POS category/settings props are lazy too. Full visits and explicit mutation refreshes still receive their requested values.
- Start loading destination JS/CSS on link pointer/focus intent and at the start of a GET visit. Actual page resolution reuses that module promise. This caches executable modules only; it does not prefetch/cache page props, customer tokens, prices, stock, or payment responses. A failed preload can retry during navigation.

## Reproducible local measurement

Requires the existing MySQL test schema and dependencies. The script rejects non-testing environments and any connection other than MySQL `sparepart_testing`. It creates 236 synthetic products, 12 motorcycles, two fitments per product, then rolls the entire fixture back. Run before/after against the same test database contents. It measures controller execution plus JSON serialization, not browser paint or staging HTTP latency. Five measured samples follow one warm-up sample per case.

```powershell
$env:APP_ENV='testing'
$env:DB_DATABASE='sparepart_testing'
$env:CACHE_STORE='array'
php scripts/benchmark-page-payload.php
```

Confirmed comparison against parent `de84c47`:

| Case | Before median | After median | Before JSON | After JSON | Queries |
| --- | --- | --- | --- | --- | --- |
| Storefront | 133.14 ms | 77.85 ms | 363,525 B | 210,125 B | 8 → 8 |
| POS | 114.52 ms | 72.40 ms | 333,469 B | 180,069 B | 6 → 6 |
| Product partial refresh | 14.97 ms | 9.99 ms | 15,850 B | 15,848 B | 8 → 4 |

The first independent comparison also improved: storefront 122.95 → 88.18 ms, POS 109.88 → 80.11 ms, partial refresh 11.95 → 9.40 ms. Payload reductions were consistent: approximately 42% storefront and 46% POS before compression; confirmed gzip payloads fell from 13,717 → 9,494 B and 13,211 → 9,161 B. Synthetic gzip sizes are not forecasts for real catalog data.

Navigation unit tests verify module requests start while fresh page data is still pending, duplicate intents share a module promise, non-GET/background/external visits are ignored, and failed warm-ups remain retryable. No numeric browser-navigation speedup is claimed before deployment.

## Correctness and rollout

135 backend tests / 1,452 assertions, 108 JavaScript tests, production build, and Pint passed. Backend regression includes stock/price freshness, cart price reconciliation, paid sales, QRIS, inventory mutation, product pagination, and business isolation. Browser navigation checks are recorded with the task artifacts.

Merge this PR to `develop`, deploy using the existing staging workflow, then repeat the anonymous baseline and compare real user navigation on the deployed version. No migration, cache TTL change, or hosting upgrade is required. Revert the optimization commit to roll back; schema and data formats consumed by the UI remain compatible.
