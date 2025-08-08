# adapters

Adapters for Webflow, Framer, Webstudio, and other platforms.

Cart DOM helpers like `addToCart.js` and `renderCart.js` now live in `../features/cart`.

## Legacy Attribute Normalization

The Webflow adapter upgrades deprecated attributes like `data-smoothr-pay` or
`data-smoothr-add` to their modern `data-smoothr` equivalents on DOM ready. A
`MutationObserver` watches for elements inserted later and normalizes them as
well. Set `window.SMOOTHR_CONFIG.debug = true` to log each normalized element.

## Currency dropdown

`currencyDomAdapter.js` replaces any element marked with `data-smoothr-price` or
`data-smoothr="price"` with a formatted value. The function
`setSelectedCurrency` updates prices on the page and stores
the chosen currency in `localStorage`.

```html
<span data-smoothr-price="19.99"></span>
<!-- Or use data-smoothr="price" when the raw value is in the element text -->
<span data-smoothr="price">19.99</span>
<select id="currency-select">
  <option value="USD">USD</option>
  <option value="EUR">EUR</option>
</select>
<script type="module">
  import {
    setSelectedCurrency,
    initCurrencyDom
  } from '../adapters/webflow/currencyDomAdapter.js';
  initCurrencyDom();
  document
    .getElementById('currency-select')
    .addEventListener('change', e => setSelectedCurrency(e.target.value));
</script>
```

The attribute value (`data-smoothr-price` or `data-smoothr-total`) is also
updated when the currency changes so you can access the converted amount via
JavaScript.

All elements with price attributes, including `[data-product-price]`, are
formatted when `initCurrencyDom()` runs and whenever the currency changes.

### Automatic price detection

`webflow-ecom-currency.js` searches for common Webflow price classes
(`.w-commerce-commerceproductprice`, `.w-commerce-commercecartitemprice`,
`.product-price`) and automatically assigns the `data-smoothr-price` attribute
based on the text content. Elements marked with `data-smoothr="price"` are also
converted. Detected elements are formatted immediately. Enable
`window.SMOOTHR_CONFIG.debug = true` before loading the script to log matched
elements and parsed values.

## Cart template

The `renderCart` helper iterates over any container marked with
`[data-smoothr-cart]`. Inside each container place a single element with
`[data-smoothr-template]` – this is the row that gets duplicated for every cart
item. Fields inside the template can use the following bindings:

- `data-smoothr-name`
- `data-smoothr-options`
- `data-smoothr-quantity`
- `data-smoothr-price`
- `data-smoothr-subtotal`
- `data-smoothr-image`
- `data-smoothr="remove-from-cart"`
- `data-smoothr-total` (outside the template)

When `renderCart()` runs it removes previously rendered rows, clones the
template and inserts the clone after the original. Any other markup within the
`[data-smoothr-cart]` container stays intact, allowing custom wrappers and
styles.

```html
<div data-smoothr-cart>
  <div data-smoothr-template class="hidden">
    <img data-smoothr-image />
    <span data-smoothr-name></span>
    <span data-smoothr-price></span>
    <button data-smoothr="remove-from-cart">Remove</button>
  </div>
</div>
<div>Total: <span data-smoothr-total></span></div>
<script type="module">
  import { renderCart } from '../features/cart/renderCart.js';
  renderCart();
</script>
```
### Supplying product images

[data-smoothr-product] or its child elements may include `data-smoothr-image` so the URL is sent when adding to cart.

## Billing address fields

Optional billing information can be captured with `data-smoothr-bill-*` inputs. All fields are optional, but the checkout script will warn if some billing fields are filled in and the required ones (first name, last name, line1, city, postal and country) are missing. The postal code field should use `[data-smoothr-bill-postal]`.

```html
<input data-smoothr-bill-first-name placeholder="Billing first name" />
<input data-smoothr-bill-last-name placeholder="Billing last name" />
<input data-smoothr-bill-line1 placeholder="Street address" />
<input data-smoothr-bill-line2 placeholder="Apartment or suite" />
<input data-smoothr-bill-city placeholder="City" />
<input data-smoothr-bill-state placeholder="State" />
<input data-smoothr-bill-postal placeholder="Postal code" />
<input data-smoothr-bill-country placeholder="Country" />
```

If any required billing fields are missing the browser console logs:

```
[Smoothr Checkout] Incomplete billing details provided
```


## forceStripeIframeStyle helper

The checkout adapter exposes `forceStripeIframeStyle()`, which runs automatically right after `.mount()` on each Stripe card field. It fixes the notorious “1px iframe bug” that can appear in flexbox layouts by forcing the Stripe Elements iframe to remain at `100%` width.
Stripe Elements automatically inherit font and color styles from their container, so extra CSS is rarely needed.


## Webflow integration

Webflow layouts can occasionally shrink the Stripe Elements iframe to a single pixel. The checkout adapter exports a helper called `forceStripeIframeStyle()` that applies explicit width and positioning styles to the iframe container. This helper is invoked automatically after each Element mounts, preventing the 1-pixel bug without any manual calls. The fix works across all Webflow layout types.

A drop-in Webflow checkout script is available at `../adapters/webflow/initCheckoutWebflow.js`.
Include it on your page with:

```html
<script type="module" src="https://sdk.smoothr.io/adapters/webflow/initCheckoutWebflow.js?v=dev-final"></script>
```
