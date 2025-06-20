# orders

Handles order workflows and UI widgets for the storefront.

## Webflow customer dashboard

`fetchOrders` retrieves the logged-in customer's orders from Supabase filtered by `SMOOTHR_CONFIG.storeId`.
`renderOrders` clones a template inside `[data-smoothr="order-list"]` and populates fields for each order.
