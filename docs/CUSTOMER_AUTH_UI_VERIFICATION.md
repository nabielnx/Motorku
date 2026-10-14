# Customer and account visual verification

## Scope and implementation

GuestLayout now provides a bounded account form, a local logo/symbol fallback,
charcoal desktop identity panel and configured login photo. The catalog has a
stable search row with visible history/cart actions, warm neutral category rail,
readable cards and 2/3/4-column category grids. Motor Saya uses wrapped model and
product names, bounded filters and separate price/availability rows. Checkout,
waiting and history use one responsive transaction frame. Account activation,
verification and confirmation inherit the same palette, including legacy primary
buttons. Expanded order rows expose the full product name.

Configured image colors are unchanged. Catalog photos use cover; customer detail
photos now explicitly use contain. Detail panels scroll within the viewport with
a sticky quantity/add footer. Shared ProductPhoto retains cover as its default,
so admin catalog thumbnails retain their existing behavior. No backend, database,
API, auth route, cart storage, polling, pricing/discount or order mutation changed.

## Rendered checks

Local evidence: `storage/app/private/customer-auth-visual-20261014/report.json`
and the screenshots named there. The ECC evidence checker passed. Artifacts stay
private/ignored; the report labels actual routes versus presentation fixtures.

| Check | Observation |
| --- | --- |
| Main screens | Login, catalog, Motor Saya, checkout, waiting and history inspected at 375x812, 768x900 and 1440x900 |
| Narrow stress | 320x640 verification wrapping, header/search/action geometry and document width checked |
| Catalog grid | Actual filtered columns: 2 at 375px, 3 at 768px, 4 at 1440px |
| Focused search | Width stays 251px / 629px / 405px at sampled phone/tablet/desktop widths; cart/history retain their space |
| Detail | Phone panel at x12/y12, 351x788; scrolling contained, sticky footer77px; loaded portrait object-fit:contain |
| Keyboard | Enter opens product detail; Tab stays in dialog; Escape closes and restores product trigger |
| Controls | Close/quantity40px, detail add44px; verification44px and logout40px at320px |
| Long content | Motor/card names wrap; expanded order product identity remains complete; filters scroll inside their track |
| Contrast | Ink on yellow11.98:1; muted text on white6.18:1 and selected surface5.33:1 |
| Content states | Supported skeleton, actual unmatched search/fresh empty history/expired login/invalid invitation, missing photos/zero stock; static empty/disabled catalog and auth fixtures |

The account success/valid-invitation/confirmation screenshots use temporary HTML
fixtures generated from the local app shell. Waiting/history use explicitly fake
browser storage data. Those verify presentation, not server responses or real
order completion. The fake history status request returned422; no JavaScript
exception was observed. A cart product was added locally and checkout totals/name
field inspected without submitting an order. The reduced-motion rule disables
animation/transition; actual OS preference switching was not exercised.

## Code and safety checks

- Production build passed; 63 existing JavaScript regressions passed.
- AST comparison preserved92 existing UI handlers across18 React files; the only
  three additions are two guest image fallbacks and keyboard card activation.
- Binding and whitespace checks passed. No dependencies were added.
- Owned testing photo fixture restored and its temporary SVG removed. Temporary
  public HTML fixtures removed before commit. Audit browser contexts/server closed.

Automatic approval rejected the empty-name checkout click and a proposed deletion
of the fake history token. Neither ran; presentation checks continued with safe
alternatives, and no real browser/account/order data was changed. Auth credential
submission, email delivery, activation, payment/cancellation, full role matrix,
physical devices/camera and a full screen-reader audit remain untested. Verify the
integrated appearance on staging after merge/deploy.
