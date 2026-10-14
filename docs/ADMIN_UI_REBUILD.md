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

Primary actions remain the existing yellow action buttons; selection uses ink
or yellow rather than faint opacity. Photo thumbnails use cover and fill square
catalog frames; the existing full-resolution detail viewer remains available.
Names wrap completely. Shared controls stay 14px / 36px mobile and 40px desktop.

Render all seven pages at 375x812, 768x900 and 1440x900; stress 320x480 dialogs.
Verify contained tables/category scrolling, grid/list, long names, image filling,
dark mode, keyboard focus/Escape, empty/loading/partial/error/success/protected
states. Save new rendered evidence. Preserve existing UI event handlers and
verify build, JavaScript tests and CI before returning the updated PR.
