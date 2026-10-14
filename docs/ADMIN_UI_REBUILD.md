# Admin UI rebuild contract

The user rejected PR #94's initial refinement: the composition looked largely
unchanged and contain-fit photos left visible empty bands. Rebuild the visual
presentation of Dashboard, POS, Products, Data Motor, Reports, Staff and Settings.
Retain their data, routes, permissions, controls and business actions.

## Direction: workshop ledger

An operations workspace for a multi-category shop, used repeatedly by staff.
Use a charcoal navigation rail, yellow selection/action accents, warm neutral
canvas and clear white work surfaces. Avoid washed-out blue cards and decorative
gradients. The memorable detail is a dark navigation rail paired with yellow
selection markers and plain numeric, ledger-like tables.

- Navigation/header: inset navigation links, compact brand block, quieter header
  title and clearly grouped account controls. Same menu entries and permissions.
  Phone/tablet get a quick navigation dock for Dashboard, POS, Products and Menu;
  it occupies its own layout row so pagination/cart controls cannot be covered.
- Dashboard: featured sales summary first, supporting metrics as one joined
  strip, cleaner operating panels and plain numbered lists.
- POS: separate the catalog toolbar, product rows/grid and checkout workspace.
  Keep full names, bottom-aligned grid prices and accessible image detail actions.
- Products: square, edge-filling photos, neutral missing-photo state, stronger
  name/price hierarchy and a clearer action footer. Preserve grid/list choices.
- Motorcycles: grouped motor rows and distinct expanded compatibility workspace.
- Reports: ledger-like numeric summaries, cash form and analysis tables.
- Staff: clear identity/role/status/action columns and bounded phone rows.
- Settings: stronger section labels and compact form groups.

The supplied product screenshot is the local reference for eliminating blue
letterboxing and the unchanged card appearance. Existing page source and local
fixtures provide references for all other content and interaction states.

## Checkable constraints

### Catalog navigation grouping

Group Semua Produk, Motor, Elektronik, Alat and Sepeda under a single Produk
disclosure in the existing sidebar. Keep their existing URLs and role access.
The button opens/closes the group; Semua Produk remains an explicit destination.
Direct catalog/category navigation opens the group, and the current child has
aria-current. Closing it hides child links from keyboard focus. Mobile child
navigation closes the drawer; the existing bottom Produk shortcut remains direct.
Verify desktop, tablet and phone open/closed states, category navigation, active
markers and keyboard Enter/Space before publishing to the same open PR.
Sidebar icons use yellow on the dark rail and ink on yellow active rows, without
icon backing boxes. Disclosure arrows retain readable contrast.

Catalog pagination must follow the actual 2/3/4/5 column breakpoints with
16/18/16/20 items, so complete pages fill all columns. The final page can be
partial when there are fewer remaining products. Verify against rendered columns,
including responsive resizing and URLs carrying the previous page size.

### Product detail palette completion

Product photo/detail dialogs in Products and the shared POS/Data Motor detail
must use the admin palette, including Headless UI portals outside the layout.
Category/secondary text is muted; price/title uses ink in light/dark themes.
Image-stage backgrounds and missing-photo feedback are solid neutral surfaces.
Full-size images retain contain fit. Keep content and close handlers; inspect
phone/tablet/desktop, dark mode and Escape/focus on the existing portal dialog.

### Consistency correction after screenshot feedback

The supplied header and POS view-switch screenshots show residual blue styling,
a boxed account cluster and mismatched inactive controls. Keep notification/theme
buttons separate from a bounded profile trigger; use one neutral segmented style
for list/grid controls, including hover and keyboard focus. Complete the admin
palette across profile forms, cart badges, notification portals, settings toggles,
filter controls and charts. Retain semantic danger/success colors and user images.
Admin select wrappers must show one arrow. Check light/dark, open/closed profile
and notification panels, filtered/empty results and narrow toolbars at 375x812,
768x900 and 1440x900; include a 320px stress check. No business submission needed.

Primary actions remain the existing yellow action buttons; selection uses ink
or yellow rather than faint opacity. Photo thumbnails use cover and fill square
catalog frames; the existing full-resolution detail viewer remains available.
Names wrap completely. Shared controls stay 14px / 36px mobile and 40px desktop.

Render all seven pages at 375x812, 768x900 and 1440x900; stress 320x480 dialogs.
Verify contained tables/category scrolling, grid/list, long names, image filling,
dark mode, keyboard focus/Escape, empty/loading/partial/error/success/protected
states. Save new rendered evidence. Preserve existing UI event handlers and
verify build, JavaScript tests and CI before returning the updated PR.
