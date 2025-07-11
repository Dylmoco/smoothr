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
- cart
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

## Cart UI helpers

Helpers for rendering the cart and binding `[data-smoothr-add]` buttons live in
`./core/cart`. Import them as needed:

```javascript
import { renderCart } from './core/cart/renderCart.js';
import { initCartBindings } from './core/cart/addToCart.js';
```

Call `renderCart()` after page load to display items and totals. Use
`initCartBindings()` to attach click handlers for adding products.

## Checkout

`initCheckout` now mounts Stripe card fields automatically. Provide elements
with the attributes `data-smoothr-card-number`, `data-smoothr-card-expiry` and
`data-smoothr-card-cvc` where the fields should render. If any target is missing
the script retries mounting every 200ms for up to five attempts. Attach
`data-smoothr-checkout` to the checkout button only—placing this attribute on a
wrapping container causes clicks anywhere in the container to trigger checkout.

The script posts the cart to `/api/checkout/[provider]` where `[provider]` is the
active payment gateway. This single endpoint handles all providers. `initCheckout` chooses the gateway by first checking
`window.SMOOTHR_CONFIG.active_payment_gateway`. If not set it queries
`store_settings.settings.active_payment_gateway` in Supabase using the provided
`storeId`. The default provider is `stripe`.

To integrate Authorize.net create a record in the `store_integrations` table
with `provider` set to `authorizeNet` and save your credentials in the
`settings` JSON column:

```json
{
  "api_login_id": "<API_LOGIN_ID>",
  "transaction_key": "<TRANSACTION_KEY>",
  "client_key": "<CLIENT_KEY>"
}
```

Activate the gateway via `store_settings.settings.active_payment_gateway`.
Requests to `/api/checkout/[provider]` must use `authorizeNet` for the
`[provider]` segment in order to succeed. Alternatively you can override the
setting on the client by defining the following snippet before loading the SDK:

```html
<script>
  window.SMOOTHR_CONFIG = {
    active_payment_gateway: 'authorizeNet'
  };
</script>
```

A Network Merchants (NMI) integration is also supported. Create a new record in
`store_integrations` with `provider` set to `nmi` and place your credentials in
the `settings` JSON column:

```json
{
  "api_key": "<API_KEY>",
  "tokenization_key": "<TOKENIZATION_KEY>"
}
```

Enable the gateway via `store_settings.settings.active_payment_gateway` or set
`window.SMOOTHR_CONFIG.active_payment_gateway = 'nmi'` on the client. Include
NMI's Collect.js library on checkout pages and call `mountNMIFields()` to mount
the credit card fields before submitting the cart. The SDK automatically injects
the `data-tokenization-key` attribute on these inputs.

A Webflow‑specific adapter lives at `./platforms/webflow/checkout.js`. It merely
sets `SMOOTHR_CONFIG.platform` and delegates all logic to the shared
`checkout/checkout.js` module. Embed it with:

```html
<script type="module" src="https://sdk.smoothr.io/platforms/webflow/checkout.js?v=dev-final"></script>
```

The adapter simply sets `SMOOTHR_CONFIG.platform = 'webflow'` and loads the
shared checkout module. `initCheckout` runs automatically once the DOM is ready,
so no polling logic is required.


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
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The workflow exports these secrets so the build step and Webflow checkout
bundler can read the Supabase configuration at runtime.

Deployment status can be monitored in the GitHub Actions tab.

## Running tests

Vitest runs the unit tests for this package. Run `npm install` in this
directory first so that Vitest and other dev dependencies from the local
`package.json` are installed, then execute:

```bash
npm test
```


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
