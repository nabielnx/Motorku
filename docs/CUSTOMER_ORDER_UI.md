# Customer checkout and order interface

The customer needs to check what they bought, know whether payment was received, and see the next pickup action. Reuse Workshop Ledger colors and fonts, with solid white surfaces, warm canvas, ink text and yellow reserved for the main action.

- Checkout: product list, editable customer name, payment choice and complete total. Two columns on desktop, one on mobile. Preserve the exact request and cart after ambiguous responses.
- History: a flat list with one status per order, product summary, date and total. The whole row opens its detail. No nested cards or expandable detail inside the list.
- Detail: one receipt column. Show the order number and status once, then products and total. Payment breakdown is collapsed. Open QRIS in a dialog only when requested. Pickup and refund information use dividers, without extra cards or a stepper.
- Viewports: 390x844 and 1440x900. No horizontal scrolling. Controls are at least 44 px, with visible keyboard focus, labels and accessible dialogs.
- Loading: quiet progress and a shell matching the final page. Empty: useful shop action. Error: retry while retaining cached information. Partial: mark stale records and disable payment actions. Success: authoritative status and next action. Permission: distinguish an inaccessible active order from an archived local receipt; do not imply that an old completed transaction failed.

Reference: the local storefront and payment-flow audit. No external design service or customer data upload. This direction incorporates the user's request to simplify the first revision.

Legacy cleanup: after the first successful refresh cycle, inaccessible closed receipts are moved out of the main list. Original receipts stay in browser storage, scoped to the shop. The history footer offers Restore. Active orders and records that refresh successfully are retained.
