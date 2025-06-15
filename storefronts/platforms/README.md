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
