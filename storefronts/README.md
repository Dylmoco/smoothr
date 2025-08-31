# storefronts

Client-facing storefront code and widgets.

This package contains the storefront modules located in `./features`.

All build scripts use ECMAScript Module (ESM) syntax and require **Node.js 20 or later**. Update any local builds or Cloudflare/Vercel deployment commands to use Node 20+ if they specify an older version.

The bundled SDK is designed for zero‑config installation on platforms like
Webflow. Broker resolution order is:
1. `broker_origin` from `/api/config`
2. `<script data-config-url>` origin
3. script origin (ignored if `sdk.smoothr.io`)
4. `https://smoothr.vercel.app`

The loader caches the chosen broker at `SMOOTHR_CONFIG.__brokerBase` and
exposes a config gate:

```js
await ensureConfigLoaded();
const base = getCachedBrokerBase();
```

The SDK never treats `https://sdk.smoothr.io` as a broker; it falls back to
`https://smoothr.vercel.app` instead.

Cloudflare Pages caches `smoothr-sdk.js` at the edge for about five minutes.
Use **Purge Cache** in Cloudflare for immediate invalidation after critical
deploys.

```html
<!-- Modern (recommended) -->
<script
  id="smoothr-sdk"
  type="module"
  src="https://sdk.smoothr.io/smoothr-sdk.js"
  data-store-id="…"
  platform="webflow"
  data-config-url="https://YOUR-BROKER-DOMAIN/api/config">
</script>

<!-- Legacy (still supported) -->
<!-- If you host the SDK on your broker domain, config-url is optional -->
<script
  id="smoothr-sdk"
  type="module"
  src="https://YOUR-BROKER-DOMAIN/smoothr-sdk.js"
  data-store-id="…"
  platform="webflow">
</script>
```

Authentication will initialize automatically. The SDK is available as
`window.Smoothr` or the lowercase `window.smoothr`.

Password reset requests always `POST` to the broker and use
`credentials:'omit'`.

Create a `.env` file in this directory and provide your Supabase project details.
These variables are injected at build time so the final SDK has no
`process.env` references:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL=your-redirect-url
```

An `.env.example` file is included for reference.

When the SDK loads it fetches your store settings from Supabase by invoking the
`get_public_store_settings` edge function. Any `api_base` value returned is
automatically mapped to the camel case `apiBase` property on
`window.SMOOTHR_CONFIG`.

```js
const { data } = await supabase.functions.invoke('get_public_store_settings', {
  body: { store_id: '<store-id>' }
});
// => { api_base: 'https://example.com' }

// after loadConfig runs
window.SMOOTHR_CONFIG.apiBase; // => 'https://example.com'
```

### Auth Redirects & Recovery

- After login: set **Sign-in Success Redirect URL** to redirect via CORS-less form POST; leave blank to stay on page.
- Recovery redirect origin resolution (allowlist): `live_domain` → `store_domain` → origin of `sign_in_redirect_url`. In development only, `orig=localhost` / `127.0.0.1` is accepted if no domains are configured.
- The final `/reset-password` URL **does not include** `store_id` (the SDK/loader provides store context).
- Optional: set `SMOOTHR_CONFIG.auth.silentPost = true` to use a hidden-iframe form POST for the “stay on page” path (silences dev CORS noise).

### Reset UX polish
To avoid URL-hash flicker on the reset page, the SDK adds/removes `smoothr-reset-loading` on `<html>` during token processing. In Webflow/Framer, add:

```css
html.smoothr-reset-loading body { visibility: hidden; }
```

The class is removed once the URL is cleaned (no trailing hash) and the session is set.

**Stale reset code on other pages**  
If a recovery code (`#access_token=…`) appears on any page that isn’t your reset page, the SDK now **removes it silently** so your site works normally (auth popup opens, links work). The code is only used on `/reset-password`, where it’s consumed and then cleared.

#### Password reset (success)
On successful password change, the SDK performs a **top-level form POST** to `/api/auth/session-sync` so the broker issues a **303** to the store’s **Sign-in Success Redirect URL**, or `/` if not configured. This guarantees landing on the client homepage.  
If passwords don’t match, the SDK shows an inline error **and throws** (`Error('password_mismatch')`) for programmatic flows.

**Reset emails are now sent by the broker**  
The SDK calls `POST /api/auth/send-reset` with `{ email, store_id, redirectTo }`. The broker generates a Supabase recovery link and emails a branded template (logo + CTA). The `redirectTo` points to the broker’s `/auth/recovery-bridge` so the token lands on your reset page and stays in the hash.

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
import * as auth from './features/auth/index.js';
import { discounts } from './features/checkout/checkout-core.js';

await auth.init();
discounts; // example access
```

### Orders

Display a logged in customer's order history:

```javascript
smoothr.orders.renderOrders();
```

## Currency Conversion

Define a global `SMOOTHR_CONFIG` before loading the SDK to set the base
currency, provide custom exchange rates, or override the live rates endpoint.
When the SDK initializes it merges settings fetched via
`get_public_store_settings` (backed by the `store_settings` table) into the
object, so values you define beforehand remain in place.

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

Helpers for rendering the cart and binding `[data-smoothr="add-to-cart"]` buttons live in
`./features/cart`. Import them as needed:

```javascript
import { renderCart } from './features/cart/renderCart.js';
import { bindAddToCartButtons } from './features/cart/addToCart.js';
```

Call `renderCart()` after page load to display items and totals. Use
`bindAddToCartButtons()` to attach click handlers for adding products.

## Checkout

`init` now mounts Stripe card fields automatically. Provide elements
with the attributes `data-smoothr-card-number`, `data-smoothr-card-expiry` and
`data-smoothr-card-cvc` where the fields should render. If any target is missing
the script only attempts to mount once and logs a warning if it fails. Attach
`data-smoothr-pay` to the form or button that submits payment.
If `data-smoothr-pay` is placed on a `<form>`
the SDK listens for the `submit` event so clicks on child elements won't start
checkout. Avoid adding the attribute to generic containers to prevent unwanted
triggers.

The `[data-smoothr-pay]` element must exist in the DOM before `init`
runs. If the trigger is inserted asynchronously, delay calling `init`
or ensure the element is present. When no checkout trigger is found the SDK
logs a warning and re-attempts initialization after a short delay.

The script posts the cart to `/api/checkout/[provider]` where `[provider]` is the
active payment gateway. This single endpoint handles all providers. `init` chooses the gateway by reading
`window.SMOOTHR_CONFIG.active_payment_gateway`. When the property isn't defined,
the SDK invokes `get_public_store_settings` to read
`store_settings.active_payment_gateway` using the provided `storeId` and writes
the value back to `SMOOTHR_CONFIG`.
The default provider is `stripe`.

Gateway detection relies on `features/checkout/utils/resolveGateway.js`. It will **throw an
error** when `active_payment_gateway` is missing or set to an unsupported
provider. Always configure a valid gateway on `SMOOTHR_CONFIG` or in the store
settings before initializing checkout.

```js
import resolveGateway from './features/checkout/utils/resolveGateway.js';

resolveGateway({ active_payment_gateway: 'nmi' });
// => 'nmi'

resolveGateway({});
// throws 'active_payment_gateway not configured'
```

To integrate Authorize.net create a record in the `integrations` table with
`provider_key` set to `authorizeNet` and your `publishable_key`. Store the
transaction key securely in Vault as `authorizeNet_secret_key_<store_id>`:

```js
await supabase
  .from('integrations')
  .insert({
    store_id: '<store-id>',
    provider_key: 'authorizeNet',
    publishable_key: '<CLIENT_KEY>'
  });

const { data } = await supabase.functions.invoke('get_gateway_credentials', {
  body: { store_id: '<store-id>', provider_key: 'authorizeNet' }
});
```

Activate the gateway via `store_settings.active_payment_gateway` or override it
on the client by defining the following snippet before loading the SDK:

```html
<script>
  window.SMOOTHR_CONFIG = {
    active_payment_gateway: 'authorizeNet'
  };
</script>
```

A Network Merchants (NMI) integration is also supported. Create a new record in
`integrations` with `provider_key` set to `nmi` and your `publishable_key`.
Store the secret API key in Vault as `nmi_secret_key_<store_id>`.

```js
await supabase.from('integrations').insert({
  store_id: '<store-id>',
  provider_key: 'nmi',
  publishable_key: '<TOKENIZATION_KEY>'
});

const { data } = await supabase.functions.invoke('get_gateway_credentials', {
  body: { store_id: '<store-id>', provider_key: 'nmi' }
});
```

Enable the gateway via `store_settings.active_payment_gateway` or set
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
shared checkout module. `init` runs automatically once the DOM is ready,
so no polling logic is required.

For pages that only need authentication and user management, include the
lightweight `smoothr-sdk.js` bundle:

```html
<script
  type="module"
  src="https://sdk.smoothr.io/smoothr-sdk.js?v=dev-final"
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
`dist`, and deploys `dist` to Cloudflare Pages.
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
