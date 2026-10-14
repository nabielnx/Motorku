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
