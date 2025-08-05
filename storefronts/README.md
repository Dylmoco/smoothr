# storefronts

Client-facing storefront code and widgets.

This package contains the storefront modules located in `./features`.

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

When the SDK loads it fetches your store settings from Supabase. Any
`api_base` value returned is automatically mapped to the camel case
`apiBase` property on `window.SMOOTHR_CONFIG`.

```js
// public_store_settings row
{ "api_base": "https://example.com" }

// after loadConfig runs
window.SMOOTHR_CONFIG.apiBase; // => 'https://example.com'
```

## Features

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

import * as features from './features/index.js';

features.discounts; // example access
```

### Orders

Display a logged in customer's order history:

```javascript
smoothr.orders.renderOrders();
```

## Currency Conversion

Define a global `SMOOTHR_CONFIG` before loading the SDK to set the base
currency, provide custom exchange rates, or override the live rates endpoint.
When the SDK initializes it merges settings from your store's
`public_store_settings` table into the object, so values you define beforehand
remain in place.

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
  import { setSelectedCurrency } from './adapters/webflow/currencyDomAdapter.js';
  document
    .getElementById('currency-picker')
    .addEventListener('change', e => setSelectedCurrency(e.target.value));
</script>
```

Prices update automatically when the currency changes and the selection is
persisted in `localStorage`.

## Cart UI helpers

Helpers for rendering the cart and binding `[data-smoothr-add]` buttons live in
`./features/cart`. Import them as needed:

```javascript
import { renderCart } from './features/cart/renderCart.js';
import { initCartBindings } from './features/cart/addToCart.js';
```

Call `renderCart()` after page load to display items and totals. Use
`initCartBindings()` to attach click handlers for adding products.

## Checkout

`initCheckout` now mounts Stripe card fields automatically. Provide elements
with the attributes `data-smoothr-card-number`, `data-smoothr-card-expiry` and
`data-smoothr-card-cvc` where the fields should render. If any target is missing
the script only attempts to mount once and logs a warning if it fails. Attach
`data-smoothr-pay` to the form or button that submits payment.
If `data-smoothr-pay` is placed on a `<form>`
the SDK listens for the `submit` event so clicks on child elements won't start
checkout. Avoid adding the attribute to generic containers to prevent unwanted
triggers.

The `[data-smoothr-pay]` element must exist in the DOM before `initCheckout`
runs. If the trigger is inserted asynchronously, delay calling `initCheckout`
or ensure the element is present. When no checkout trigger is found the SDK
logs a warning and re-attempts initialization after a short delay.

The script posts the cart to `/api/checkout/[provider]` where `[provider]` is the
active payment gateway. This single endpoint handles all providers. `initCheckout` chooses the gateway by reading
`window.SMOOTHR_CONFIG.active_payment_gateway`. When the property isn't defined,
the SDK fetches `public_store_settings.active_payment_gateway` from Supabase
using the provided `storeId` and writes the value back to `SMOOTHR_CONFIG`.
The default provider is `stripe`.

Gateway detection relies on `core/utils/resolveGateway()`. It will **throw an
error** when `active_payment_gateway` is missing or set to an unsupported
provider. Always configure a valid gateway on `SMOOTHR_CONFIG` or in the store
settings before initializing checkout.

```js
import resolveGateway from '../core/utils/resolveGateway.js';

resolveGateway({ active_payment_gateway: 'nmi' });
// => 'nmi'

resolveGateway({});
// throws 'active_payment_gateway not configured'
```

To integrate Authorize.net create a record in the `store_integrations` table
with `gateway` set to `authorizeNet` and save your credentials in the
`settings` JSON column:

```json
{
  "api_login_id": "<API_LOGIN_ID>",
  "transaction_key": "<TRANSACTION_KEY>",
  "client_key": "<CLIENT_KEY>"
}
```

Activate the gateway via `public_store_settings.active_payment_gateway`.
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
`store_integrations` with either `gateway` or `settings.gateway` set to `nmi`
and place your credentials in the `settings` JSON column. The
`public_store_integration_credentials` view coalesces the `gateway` column with
`settings.gateway` so either approach works:

```json
{
  "api_key": "<API_KEY>",
  "tokenization_key": "<TOKENIZATION_KEY>"
}
```
The tokenization key can be fetched anonymously from the
`public_store_integration_credentials` view:

```js
const { data } = await supabase
  .from('public_store_integration_credentials')
  .select('tokenization_key')
  .eq('store_id', '<store-id>')
  .eq('gateway', 'nmi')
  .maybeSingle();
const key = data?.tokenization_key;
```

Enable the gateway via `public_store_settings.active_payment_gateway` or set
`window.SMOOTHR_CONFIG.active_payment_gateway = 'nmi'` on the client. Include
NMI's Collect.js library on checkout pages. After the Smoothr checkout script
loads, call `window.Smoothr.mountNMIFields()` to mount the credit card fields.
The helper automatically injects a `data-tokenization-key` attribute on each
field container.

```html
<script src="https://secure.networkmerchants.com/token/Collect.js"></script>
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.js"></script>
<script>
  Smoothr.mountNMIFields({
    number: '#card-number',
    expiry: '#card-expiry',
    cvc: '#card-cvc'
  });
</script>
```

A Webflow‑specific adapter lives at `./adapters/webflow/initCheckoutWebflow.js`. It merely
sets `SMOOTHR_CONFIG.platform` and delegates all logic to the shared
`features/checkout/checkout-core.js` module. Embed it with:

```html
<script type="module" src="https://sdk.smoothr.io/adapters/webflow/initCheckoutWebflow.js?v=dev-final"></script>
```

The adapter simply sets `SMOOTHR_CONFIG.platform = 'webflow'` and loads the
shared checkout module. `initCheckout` runs automatically once the DOM is ready,
so no polling logic is required.

For pages that only need authentication and user management, include the
lightweight `features/auth/sdk-auth-entry.js` bundle:

```html
<script
  type="module"
  src="https://sdk.smoothr.io/features/auth/sdk-auth-entry.js?v=dev-final"
></script>
```

## Development

Run `npm run build` after modifying files in `features/checkout/gateways`. The build
copies updated sources into `dist/gateways` so the published SDK includes the
latest gateway logic. Commit both the source and corresponding `dist` files in
the same change.

### Local build

Ensure **Node.js 20 or later** is installed. Before running the build delete
any existing bundle and provide your Supabase credentials so the environment is
clean:

```bash
rm -rf dist
NEXT_PUBLIC_SUPABASE_URL=<project-url> \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
npm run build
```


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

## Testing

Create a `.env.test` file in this directory with your Supabase project
credentials. The test runner automatically loads this file so unit tests can
access the configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
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
