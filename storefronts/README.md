# storefronts

Client-facing storefront code and widgets.

This package contains the core storefront modules located in `./core`.

All build scripts use ECMAScript Module (ESM) syntax and require **Node.js 20 or later**. Update any local builds or Cloudflare/Vercel deployment commands to use Node 20+ if they specify an older version.

The bundled SDK is designed for zero‑config installation on platforms like
Webflow. Simply include

```html
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.js"></script>
```

and authentication will initialize automatically. The SDK is available as
`window.Smoothr` or the lowercase `window.smoothr`.

Create a `.env` file in this directory and provide your Supabase project details.
These variables are injected at build time so the final SDK has no
`process.env` references:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL=your-redirect-url
```

An `.env.example` file is included for reference.

## Core modules

- abandoned-cart
- affiliates
- analytics
- currency
- dashboard
- discounts
- orders
- returns
- reviews
- subscriptions

### Usage

```javascript

import * as core from './core/index.js';

core.discounts; // example access
```

### Orders

Display a logged in customer's order history:

```javascript
smoothr.orders.renderOrders();
```

## Currency Conversion

Define a global `SMOOTHR_CONFIG` before loading the SDK to set the base
currency, provide custom exchange rates, or override the live rates endpoint.
These options are applied at runtime when the script initializes.

```html
<script>
  window.SMOOTHR_CONFIG = {
    baseCurrency: 'USD',
    rates: { USD: 1, EUR: 0.9, GBP: 0.8 },
    rateSource: 'https://<your-project-id>.functions.supabase.co/proxy-live-rates'
  };
</script>
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.js"></script>
```

To allow shoppers to pick a currency, pair the `setSelectedCurrency` helper with
a dropdown and mark prices using `data-smoothr-price`:

```html
<span data-smoothr-price="{{ price }}"></span>
<select id="currency-picker">
  <option value="USD">USD</option>
  <option value="EUR">EUR</option>
  <option value="GBP">GBP</option>
</select>
<script type="module">
  import { setSelectedCurrency } from './platforms/webflow-dom.js';
  document
    .getElementById('currency-picker')
    .addEventListener('change', e => setSelectedCurrency(e.target.value));
</script>
```

Prices update automatically when the currency changes and the selection is
persisted in `localStorage`.


## CI/CD

The SDK is built and deployed automatically whenever code is pushed to the
`main` branch. The GitHub Actions workflow installs dependencies with `npm ci`,
runs the test suite, builds the bundle, copies the checkout script into
`dist`, performs the postbuild check and then deploys `dist` to Cloudflare Pages.
The deployed commit and timestamp are recorded in the repository's `DEPLOY_LOG.md`
file.

Configure the workflow secrets under **Settings → Secrets and variables →
Actions** in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`

Deployment status can be monitored in the GitHub Actions tab.

## Running tests

Vitest runs the unit tests for this package. After installing dependencies run:

```bash
npm test
```

The `pretest` script ensures dependencies are installed before tests execute.

## Supabase Proxy Live Rates Function

The SDK retrieves exchange rates from a Supabase Edge Function available at `proxy-live-rates`. Supply `base` and `symbols` query parameters to override the defaults if needed. Results are cached for 24 hours.

Example request:

```
https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP
```

Example response:

```json
{ "rates": { "USD": 1.27, "EUR": 1.18, "GBP": 1 } }
```

If an error occurs the function responds with status `500` and includes details:

```json
{
  "code": 500,
  "message": "Fetch failed",
  "detail": "Status 403: Forbidden"
}
```

## Deployment

The workflow automatically publishes `storefronts/dist` to Cloudflare Pages.
The latest deployed commit can be found in `DEPLOY_LOG.md`. When embedding the
SDK on your site, perform a hard refresh after each deploy so browsers load the
new bundle.
