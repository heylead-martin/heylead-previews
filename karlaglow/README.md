# KarlaGlow checkout preview

Live at **https://previews.heylead.com/karlaglow/**

This is a static demo of product page + checkout using Econt **without** the WooCommerce "Deliver with Econt" plugin.

- Catalog is a snapshot of live karlaglow.com products.
- Delivery step embeds Econt's own form (`delivery.econt.com/customer_info.php`) for shop `8663702` (the public half of the pairing code).
- After the customer confirms, Econt posts destination + shipping price into the page.
- Place order is preview-only (browser storage). It does **not** write WooCommerce and does **not** create a waybill yet.

The private pairing key stays out of this public repo. Next step, when the flow looks right: `OrdersService.updateOrder` from a small backend.
