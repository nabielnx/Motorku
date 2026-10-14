# UI rebuild verification

2026-10-14, following the user's rejection of PR #94's initial visual refinement.
Contract: [ADMIN_UI_REBUILD.md](ADMIN_UI_REBUILD.md).

## Rendered checks

Inspected Dashboard, POS, Products, Data Motor, Reports, Staff and Settings at
375x812, 768x900 and 1440x900 using owned `sparepart_testing` fixtures. The sampled
document widths matched their viewports and visible headings did not overflow.
Tables/category rails intentionally scroll inside their own containers.

- Charcoal inset sidebar, compact header, yellow selection and neutral canvas.
- Joined sales-first dashboard summary and ledger rows/rank markers.
- Square **cover** catalog photos; the full-image detail viewer retains **contain**.
- Consistent grid price/stock positions and labelled desktop product actions.
- Distinct catalog/cart layout and readable dark cart counter.
- Ledger reports, grouped motor rows/circular thumbnails and clear staff columns.
- Asymmetric desktop settings; stacked phone/tablet sections and themed forms.
- Role-filtered quick dock on phone/tablet. At 320px, main bottom and dock top
  matched exactly: the dock reserves its own row rather than covering content.
- Visible Rp 27.000.000 fit the tablet sales cell; photo frames were square.

Inspected 320x480 menu, product, staff and bulk dialogs. Content scrolls while
close/footer controls remain reachable. Closed drawer content becomes hidden
from keyboard navigation. Product detail Tab/Escape/focus restoration passed.

## Content and action states

The existing square-grid skeleton preview was inspected. Unmatched search showed
no-result feedback. Missing photos, mixed name lengths and zero stock remained
readable; stock=0 add actions stayed disabled. An enabled add action updated the
owned local cart from one to two items. Owner self-delete stayed disabled with
its explanatory tooltip. Native required-name validation was displayed without
submitting an invitation. No payment or business form was submitted.

The reduced-motion CSS rule was temporarily activated for inspection, produced
0s root/child transitions and no animations, and was restored. Dark cart text
contrast was fixed after rendered inspection and checked again.

## Gates and limits

Production build and 63 JavaScript tests passed. Binding checks passed. An AST
comparison preserved 181 existing event handlers across the changed React files;
one menu shortcut handler was added. Whitespace checks passed. Local screenshots
and geometry under `storage/app/private/admin-rebuild-20261014/` passed the ECC
evidence completeness checker.

These are viewport/touch emulation checks, not physical devices, iOS keyboard
zoom, native camera or screen-reader verification. There is no pixel baseline,
so pixel regression is inconclusive. CI is tracked on the updated PR #94;
integrated staging verification follows merge.

## Consistency follow-up, 2026-10-14

User screenshots identified a boxed profile cluster, legacy blue cart badge and
inconsistent inactive view controls. The follow-up completes scoped admin tokens
for primary/blue utilities, neutral surfaces/borders, hover/focus, checkboxes,
charts, skeletons and notification/confirmation portals. Customer branding and
uploaded media retain their original colors. Red/amber/green feedback stays distinct.

- Header actions are separate. Photo/initial avatar is 32px; desktop identity is
  bounded. Name/email wrap fully in the 288px dropdown. Escape closes and restores
  trigger focus. At 320px the menu occupied x22..310 and the photo loaded.
- POS and Product view switches share one frame and pressed-state semantics.
  List/Grid switching and the stock filter were exercised; four matching products
  and one active filter were displayed.
- Product, motor and compatibility filter triggers share styling. Select wrappers
  with custom arrows suppress native backgrounds. Standalone selects use one
  non-repeating 16px arrow. Phone fields stay 36px; desktop fields 40px.
- Profile upload/forms, notification panels and cart count follow the palette.
  Enabled settings toggles are yellow/dark, have accessible names and visible
  keyboard focus. Yellow primary action text stays dark in dark mode.
- Profile/Products were rendered at 375x812, 768x900 and 1440x900. POS was checked
  at 320x480, 768x900 and 1440x900. Phone dashboard/reports/staff and tablet motor
  rows were inspected. Computed palette checks also covered dashboard, orders,
  motor rows, reports, staff and settings on desktop. Targeted checks found no
  former saturated blue in admin controls; media is excluded from this check.
- An owned dummy photo/long-name fixture was prepared and restored. Light/dark
  profile and notifications, dark POS and expanded dark tablet compatibility
  were checked. No sampled document overflow or heading clipping was observed.
- Loading preview, unmatched search, missing media/zero stock, successful filter
  and view changes, required profile-name feedback and protected self-delete
  were checked. Native validation used reportValidity without submitting.
  No invitation, checkout or business form was submitted.
- Reduced-motion rules temporarily yielded 0s transition and animation none,
  then were restored. Binding checks, 173 preserved React handlers, production
  build, 63 JavaScript tests and whitespace checks passed.

Evidence remains local in `storage/app/private/admin-consistency-20261014/`.
Physical devices, native camera and screen reader testing remain unverified.
Pixel regression is inconclusive without a baseline. The final extra dark-profile
screenshot capture timed out; its DOM/CSS palette check succeeded, and earlier
dark profile and notification captures remain available.
