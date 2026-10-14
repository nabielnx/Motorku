# Admin visual design contract

> Historical initial refinement, superseded after user review by
> [the UI rebuild](ADMIN_UI_REBUILD.md) and its
> [verification record](ADMIN_UI_REBUILD_VERIFICATION.md).

## Purpose and scope

Refine the existing owner workspace: Dashboard, POS, Products, Motorcycles,
Reports, Staff and Settings. The audience is shop staff using a phone, tablet or
desktop throughout the working day. Preserve routes, data, permissions and
existing actions. Primary jobs are reading sales, finding stock, taking orders,
mapping parts and maintaining store data.

## Direction

Use solid white/slate surfaces, quiet separators, blue navigation and yellow
action/selection accents. A blue sales KPI is the dashboard's visual anchor;
supporting metrics remain neutral. Titles, product names, prices and metadata
have distinct weights. Prices use tabular numerals. Avoid decorative gradients,
translucent panels, excess shadows and enlarged controls.

References are the current local admin implementation and the user's phone
screenshots: product controls crowded into the header, tall missing-photo cards,
long product names and oversized forms. Source references:

- `admin-controls.css`: keep 14px controls at 36px mobile / 40px desktop.
- `Dashboard/Owner/Index.jsx`: differentiate the four equal blue KPIs.
- `POS/Index.jsx`: keep complete names; remove whole-card stock opacity and the
  80px title reservation. Keep image details separate from adding to the cart.
- `Product/Index.jsx`: reduce empty-photo space; retain readable stock and actions.
- `Motorcycle/Index.jsx`: solid expanded-row styling with a visible selection edge.
- `Report/Index.jsx`: align numeric hierarchy and use the same panel headers.
- `User/Index.jsx`, `Setting/Index.jsx`: consistent section borders and typography.
- `AuthenticatedLayout.jsx`: scope visual rules to admin, retain navigation layout.

## Responsive constraints and acceptance

Target viewports: **375x812, 768x900 and 1440x900**; also stress 320px phones.
No viewport overflow. Tables and category rails may scroll inside their containers.
Names wrap without truncation. Controls must not overlap names, counts or other
controls. Dialogs must scroll within short screens. Grid cards stretch within each
row, with price/stock grouped consistently; long names may grow the row.

Check all seven rendered pages at the target widths, plus POS grid/list, product
grid/list, expanded motorcycle parts, forms and dark mode. Inspect keyboard
focus, disabled stock, loading, empty, error, partial and success states. Keep
screenshot evidence locally and record limitations separately from passes.
