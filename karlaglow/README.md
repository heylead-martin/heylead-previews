# KarlaGlow checkout preview

Live at **https://previews.heylead.com/karlaglow/**

This is a static demo of product page + checkout using Econt **without** the WooCommerce "Deliver with Econt" plugin.

- Catalog is a snapshot of live karlaglow.com products.
- Checkout fields are hosted here (name, phone, city, office, address). No Econt iframe.
- Cities and offices come from the Econt nomenclatures API. COD shipping uses this shop's measured Econt rates until live `getPrice` runs on a server.
- Place order is preview-only (browser storage) until we wire Woo + `OrdersService.updateOrder`.
