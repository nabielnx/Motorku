# Admin UI conventions

Use `Components/Admin/Button` for primary, secondary and destructive actions. Primary actions use the existing yellow brand color with dark blue text; cancellation is neutral; destructive actions are red. Keep blue for navigation and selection. Buttons default to `type="button"`; form submission must explicitly use `type="submit"`.

Shared styles live in `resources/css/admin-controls.css`, imported after the main stylesheet. Apply them explicitly to admin controls; do not apply them globally to the storefront or printed reports.

- `admin-control`: 44 px minimum height and 16 px text on phones, 40 px and 14 px from the small breakpoint. Preserve padding needed for search icons and select arrows. Keep checkbox, radio, file and toggle styling separate.
- `admin-icon-button`: 44 by 44 px minimum touch area on phones; 36 by 36 px on larger screens. Supply an accessible label and retain action color.
- `admin-product-name`: 14 px, wrapped, with no line clamp. Product identification takes priority over uniform row heights.
- `admin-help`: 12 px with readable secondary text color in both themes.
- `admin-page-title` and `admin-dialog-title`: shared heading hierarchy.

Use `Components/Admin/Dialog` for catalog, motorcycle, staff, settings confirmation and spreadsheet dialogs. It provides the backdrop, focus trap, Escape dismissal, focus restoration and viewport bounds through Headless UI. The caller owns form state, submission and close callbacks. Set `closeable={false}` during an in-flight save and disable dismissal buttons too. Use the exported `DialogTitle` for the accessible name. Keep scrollable form content inside the panel and keep actions reachable on short screens.

Check long product names, both themes, phone/tablet/desktop widths, Tab cycling, Escape/focus restoration, and form submission whenever these shared controls change. POS payment and customer checkout retain their dedicated presentation and keyboard handling.
