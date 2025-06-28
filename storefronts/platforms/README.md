# platforms

Adapters for Webflow, Framer, Webstudio, and other platforms.

## Currency dropdown

`webflow-dom.js` replaces any element marked with `data-smoothr-price` or
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
  import { setSelectedCurrency } from './webflow-dom.js';
  document
    .getElementById('currency-select')
    .addEventListener('change', e => setSelectedCurrency(e.target.value));
</script>
```

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
- `data-smoothr-remove`
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
    <button data-smoothr-remove>Remove</button>
  </div>
</div>
<div>Total: <span data-smoothr-total></span></div>
<script type="module">
  import { renderCart } from './webflow/renderCart.js';
  renderCart();
</script>
```
