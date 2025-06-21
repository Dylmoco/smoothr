# orders

Handles order workflows and UI widgets for the storefront.

## DOM attributes

Order lists rely on `[data-smoothr]` attributes only. Place a template card
inside a container marked `data-smoothr="order-list"` and include fields:

- `data-smoothr="order-date"`
- `data-smoothr="order-number"`
- `data-smoothr="order-name"`
- `data-smoothr="order-email"`
- `data-smoothr="order-price"`
- `data-smoothr="order-status"`

Optionally add an element with `data-smoothr="no-orders"` that is shown when
the customer has no orders.
