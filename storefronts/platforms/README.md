# platforms

Adapters for Webflow, Framer, Webstudio, and other platforms.

## Currency dropdown

`webflow-dom.js` replaces any element with `data-smoothr-price` with a formatted
value. The function `setSelectedCurrency` updates prices on the page and stores
the chosen currency in `localStorage`.

```html
<span data-smoothr-price="19.99"></span>
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
based on the text content. Detected elements are formatted immediately. Enable
`window.SMOOTHR_CONFIG.debug = true` before loading the script to log matched
elements and parsed values.
