# currency

Utilities for formatting and converting prices in multiple currencies.

## API

- `setBaseCurrency(code)` – sets the store's primary currency.
- `updateRates(rates)` – merges new exchange rates where keys are ISO codes.
- `convertPrice(amount, to?, from?)` – convert `amount` from one currency to
  another. Defaults to the base currency.
- `formatPrice(amount, code?, locale?)` – format a number as a localized
  currency string.
- `fetchExchangeRates(base?, symbols?, rateSource?)` – retrieve live FX data with 24h caching.

## Global configuration

When the SDK loads it checks for `window.SMOOTHR_CONFIG` and applies the
`baseCurrency` and `rates` values if present. Live rates are fetched once per
day and will override these static values when available. Define defaults inline
before loading the bundle:

```html
<script>
  window.SMOOTHR_CONFIG = {
    baseCurrency: 'USD',
    rates: { USD: 1, EUR: 0.9 }
  };
</script>
```

## Dropdown integration

The Webflow adapter exports `setSelectedCurrency` which updates displayed prices
and persists the choice in `localStorage`. Pair it with a select element and add
`data-smoothr-price` to any elements containing raw amounts.

```html
<span data-smoothr-price="{{ price }}"></span>
<select id="currency">
  <option value="USD">USD</option>
  <option value="EUR">EUR</option>
</select>
<script type="module">
  import { setSelectedCurrency } from '../../adapters/webflow/currencyDomAdapter.js';
  document
    .getElementById('currency')
    .addEventListener('change', e => setSelectedCurrency(e.target.value));
</script>
```

Both `data-smoothr-price` and `data-smoothr-total` attributes update to the
converted amount whenever the currency changes.
