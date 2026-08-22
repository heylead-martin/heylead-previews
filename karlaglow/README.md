# KarlaGlow checkout preview

Live at **https://previews.heylead.com/karlaglow/**

This is a static demo of product page + checkout using Econt **without** the WooCommerce "Deliver with Econt" plugin.

- Catalog is a snapshot of live karlaglow.com products.
- Office / locker picking uses Econt's map (`officelocator.econt.com`) inline on checkout, not a popup and not the Woo plugin.
- Address delivery is a short form on the same page.
- Place order is preview-only (browser storage). It does **not** write WooCommerce and does **not** create a waybill yet.

The private pairing key stays out of this public repo. Next step, when the flow looks right: `OrdersService.updateOrder` from a small backend.
