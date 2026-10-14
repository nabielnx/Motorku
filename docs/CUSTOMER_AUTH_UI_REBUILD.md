# Customer and authentication visual rebuild

## Contract before implementation

Continue the admin's charcoal, yellow and warm neutral visual language across
login, invitations, verification and confirmation; public catalog, Motor Saya,
product/cart dialogs, checkout, waiting and order history. Preserve all existing
authentication, fitment, cart storage, totals, polling and order actions.

The existing login has a 192px logo, blue controls and oversized split image.
The storefront has a blue wave header with expanding search that hides actions,
tiny three-column mobile products and separate narrow checkout/status styling.
Use a bounded login identity/form, stable header search and visible actions,
two-column mobile catalog, readable motor names and a shared transaction frame.
No added dependencies, gradients, decorative transparency or marketing hero.
Preserve configured logos/banners/images and their original colors. Catalog
photos fill their frames; detail photos retain contain. Status/error colors
continue to distinguish outcomes; selections/actions use charcoal/yellow.

Target viewports: 375x812, 768x900, 1440x900; stress 320px. Login inputs remain
16px to avoid mobile input zoom. Touch targets at least 40px, key actions 44px.
Long product names wrap, category tracks scroll within the viewport; header
actions remain reachable with focused search. Dialog scrolling stays contained.

States to inspect: loading via supported skeleton previews, empty catalog/history,
failed search/login/checkout validation, missing photos, filled cart and successful
local read-only order status fixture, ordering disabled/invalid invitation. Never
submit a real order or send verification mail. Local isolated browser storage and
owned testing fixtures only. Check focus/keyboard/Escape, reduced motion, build,
JavaScript regressions and preserved existing event handlers. Save rendered
evidence locally and report untested physical-device or external-delivery limits.
