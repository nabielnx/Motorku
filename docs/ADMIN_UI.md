# Admin UI conventions

Use `Components/Admin/Button` for primary, secondary and destructive actions. Primary actions use the existing yellow brand color with dark text; cancellation is neutral; destructive actions are red. Use yellow for sidebar/dock selection and ink for filters; blue remains an informational accent. Buttons default to `type="button"`; form submission must explicitly use `type="submit"`.

Shared styles live in `resources/css/admin-controls.css`, imported after the main stylesheet. Apply them explicitly to admin controls; do not apply them globally to the storefront or printed reports.

- `admin-control`: 36 px minimum height and 14 px text on phones, 40 px and 14 px from the small breakpoint. Preserve padding needed for search icons and select arrows. Keep checkbox, radio, file and toggle styling separate.
- `admin-icon-button`: 36 by 36 px minimum touch area. Supply an accessible label and retain action color.
- `admin-product-name`: 14 px, wrapped, with no line clamp. Product identification takes priority over uniform row heights.
- `admin-help`: 12 px with readable secondary text color in both themes.
- `admin-page-title` and `admin-dialog-title`: shared heading hierarchy.

Use `Components/Admin/Dialog` for catalog, motorcycle, staff, settings confirmation and spreadsheet dialogs. It provides the backdrop, focus trap, Escape dismissal, focus restoration and viewport bounds through Headless UI. The caller owns form state, submission and close callbacks. Set `closeable={false}` during an in-flight save and disable dismissal buttons too. Use the exported `DialogTitle` for the accessible name. Keep scrollable form content inside the panel and keep actions reachable on short screens.

Check long product names, both themes, phone/tablet/desktop widths, Tab cycling, Escape/focus restoration, and form submission whenever these shared controls change. POS payment and customer checkout retain their dedicated presentation and keyboard handling.

## Visual system

`admin-visual.css` defines the workshop-ledger workspace with charcoal navigation,
yellow selection/action accents and solid neutral work surfaces. Its scope is
`admin-workspace` plus `admin-dialog` only inside the mounted admin body marker.
Public storefront and receipt styles retain their own presentation.

Use `admin-surface`, `admin-section-header` and `admin-number` for panels, headings
and tabular values. Dashboard metrics use a joined `admin-dashboard-summary`;
the sales metric comes first. Catalog photos fill square frames with `cover`,
while the detail viewer displays the complete image with `contain`. Product
names remain fully wrapped and prices/stocks align at the foot of a grid row.

The phone/tablet navigation dock is a separate flex row beneath `main`, including
safe-area padding. Never absolutely position it over pagination or cart actions.
Its links derive from the existing role-filtered navigation entries. Closed
mobile sidebar content is hidden from keyboard navigation.

See [the rebuild contract](ADMIN_UI_REBUILD.md) and
[its verification](ADMIN_UI_REBUILD_VERIFICATION.md).
