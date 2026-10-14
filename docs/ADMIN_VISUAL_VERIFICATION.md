# Admin visual refinement verification

> Historical initial refinement, superseded after user review by
> [the UI rebuild](ADMIN_UI_REBUILD.md) and its
> [verification record](ADMIN_UI_REBUILD_VERIFICATION.md).

Date: 2026-10-14. Base: `develop` after PR #93.

## Scope and result

Rendered Dashboard, POS, Products, Data Motor, Reports, Staff and Settings in
Chromium at **375x812, 768x900 and 1440x900**, with the owned `sparepart_testing`
fixtures. The sampled document widths stayed equal to the viewports, and visible
headings did not overflow. Inspected the rendered layouts as well as geometry.
Tables and category rails intentionally scroll inside their containers.

- Dashboard: neutral support metrics, one blue sales anchor, solid section
  headers. Verified visible Rp 27.000.000 at 320px without overlap.
- POS: grid/list, zero stock, mixed name lengths, aligned grid prices, cart
  selection and a portrait image fully contained in its thumbnail.
- Products: compact grid/list and the loading skeleton preview; complete names
  wrap, and actions/pagination stay separate.
- Motorcycles: expanded motor uses a solid selected surface and inset edge;
  its parts controls remain contained.
- Reports: two-column phone summary, full-width amounts below labels, compact
  cash inputs and contained analysis tables.
- Staff: table from 768px, stacked phone rows, readable emails and role badges.
- Settings: consistent section hierarchy, solid borders and compact image actions.

Also inspected dark Dashboard/POS and 320x480 detail, product and bulk-mapping
dialogs. Their content scrolls and close/footer actions remain reachable.

## Interaction and state checks

- Product detail: Tab stayed inside the dialog with a visible focus outline;
  Escape closed it and restored focus to the image button.
- Stock=0: details remain accessible and adding to the cart remains disabled.
- An enabled product added to the local cart, with count/total and selection
  edge updated. No checkout or payment was submitted.
- Unmatched search: no-results feedback remains visible with controls intact.
- Missing-photo/partial data: readable placeholders in both themes.
- Empty required staff field: native validation was displayed using
  `reportValidity()` without submitting. Invitation submission was rejected by
  automatic approval review, so no invitation or custom/server error was tested.
- Owner self-delete remained disabled with its existing explanatory tooltip.
- The loaded reduced-motion media rule was temporarily activated for a CSS
  check: root/child transitions became 0s and animations none; then restored.

## Gates and limits

- Production build passed; 63 JavaScript regression tests passed.
- Frontend binding check passed; 190 existing UI event handlers were preserved
  across the changed React files.
- `git diff --check` passed.
- Local screenshot/geometry evidence is kept under
  `storage/app/private/admin-visual-20261014/`; ECC's evidence checker passed.

This is browser viewport/touch emulation, not physical-device, screen-reader,
camera or iOS keyboard/zoom verification. There is no pixel baseline, so pixel
regression remains inconclusive. No backend/schema/dependency changes or business
form submissions were required. Staging verification follows merging the PR.
