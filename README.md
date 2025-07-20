# Smoothr SaaS Monorepo

This repository contains all code for Smoothr, structured as a modular SaaS platform. Each top-level directory groups frontend storefront features, shared backend utilities, and the admin dashboard.

## Directory Overview

- **/storefronts/** – Client-facing storefront code and widgets.
  - **/core/** – Core storefront modules such as orders, returns, reviews, analytics, discounts, currency, affiliates, cart, customer dashboard, abandoned cart, and subscriptions.
  - **/platforms/** – Adapters for various web builder platforms.
  - **/clonables/** – Embeddable widgets and plug‑and‑play code.
- **/client/** – Legacy platform scripts like the Webflow checkout adapter kept for compatibility.
- **/shared/** – Server-side logic for orders, returns, reviews, analytics, discounts, currency, affiliates, cart, abandoned cart, subscriptions, and Supabase helpers.
- **/smoothr/** – Next.js admin dashboard application.
  - **/admin-modules/** – Admin views for orders, returns, reviews, analytics, discounts, currency, affiliates, cart, dashboard, abandoned cart, and subscriptions.
- **.gitignore** – Ignore Node modules, logs, env files, and build output.

The auth utilities now include client-side validation, loading states and keyboard-accessible forms for a smoother user experience.

This README serves as the source of truth for new developers on how the repository is organized and where modules belong.

## Workspace Setup

The repository is managed as a Node.js workspace. The root `package.json` lists
two workspaces:

- `smoothr` – the admin dashboard
- `storefronts` – the storefront SDK and widgets

Running `npm install` from the repository root installs dependencies for all
packages in one step.

Afterwards run `npm install` (or `npm ci`) inside each workspace so dev
dependencies like **vitest** are available in `storefronts` and `smoothr`:

```bash
npm install        # or npm ci
(cd storefronts && npm install)
(cd smoothr && npm install)
```

All scripts in the repository are written using ECMAScript Module (ESM)
syntax and require **Node.js 20 or later**. Update any local builds or
Cloudflare/Vercel deploy commands that specify a Node version to ensure they
use Node 20+.

## Running the Admin Dashboard

The admin dashboard lives in `/smoothr`. After installing dependencies you can
build it with:

```bash
cd smoothr
npm install
npm run build
```

This will output any compiled assets. A development server can be added later
via `npm run dev` when the project grows.

## Running the Storefront SDK

The storefront package provides a Vite based development server. Start it with:

```bash
cd storefronts
npm install
npm run dev
```

The storefront SDK is automatically built and deployed by GitHub Actions so no
manual build step is required.

Use `npm run bundle:webflow-checkout` from the repository root to rebuild only
the Webflow checkout script.

## Checkout API

The admin dashboard exposes two endpoints for initiating a checkout:
Store integrations use a `gateway` column to specify the active payment provider. Any prior references to a `provider` column are obsolete.

1. `/api/checkout/[provider]` – processes a posted cart using the configured payment gateway. This single route handles checkouts for all providers (e.g. `stripe` or `authorizeNet`). The `[provider]` segment must match the gateway configured for the store. For NMI this segment is `nmi`, so `/api/checkout/nmi` maps to the same `[provider].ts` handler. The request body must include the following fields:

- `payment_method` – the ID of the payment method to charge
- `email` – customer email for receipts
- `first_name` – customer's first name
- `last_name` – customer's last name
- `shipping` – shipping address object
- `cart` – array of cart items
- `total` – numeric order total
- `currency` – ISO currency code
- `description` *(optional)* – order description

   On success the endpoint responds with the created order ID. The
   `payment_intent_id` field contains the Stripe PaymentIntent ID or, when using
   Authorize.Net, the Accept.js `opaqueData.dataValue` used for the charge.

2. `/api/create-checkout-session` – generates a Stripe Checkout Session.
   This endpoint sets `success_url` to `<origin>/checkout-success` and
   responds with the Checkout Session URL.

The SDK determines the active payment gateway by first checking
`window.SMOOTHR_CONFIG.active_payment_gateway`. If absent, it loads the value
from the store's `public_store_settings` table in Supabase using the configured
`storeId`. The `[provider]` segment in the route should match this value and
defaults to `stripe` when no configuration is found.

Payment gateway resolution is handled by `core/utils/resolveGateway()`. This
function **throws an error** when no gateway is configured or when an
unsupported value is supplied. Ensure `active_payment_gateway` is set on either
`SMOOTHR_CONFIG` or in the store settings.

```js
import resolveGateway from './core/utils/resolveGateway.js';

resolveGateway({ active_payment_gateway: 'stripe' });
// => 'stripe'

resolveGateway();
// throws 'active_payment_gateway not configured'

resolveGateway({ active_payment_gateway: 'bogus' });
// throws 'Unknown payment gateway: bogus'
```

To enable Authorize.net create a row in the `store_integrations` table with
`gateway` set to `authorizeNet` and store your API credentials under the
`settings` column:

```json
{
  "api_login_id": "<API_LOGIN_ID>",
  "transaction_key": "<TRANSACTION_KEY>",
  "client_key": "<CLIENT_KEY>"
}
```

Select Authorize.net by setting
`store_settings.settings.active_payment_gateway` to `authorizeNet` (or override
it on the client with `window.SMOOTHR_CONFIG.active_payment_gateway`). Requests
to `/api/checkout/[provider]` must use `authorizeNet` for the `[provider]`
segment in order to succeed.

```html
<script>
  window.SMOOTHR_CONFIG = { active_payment_gateway: 'authorizeNet' };
</script>
```

Include the Authorize.Net **Accept.js** script on pages that render the checkout form. The integration uses plain Accept.js with custom input fields (not AcceptUI), so ensure your page contains elements for the card number, expiry and CVC:

```html
<script type="text/javascript" src="https://jstest.authorize.net/v1/Accept.js"></script>
```

The checkout payload for Authorize.Net uses the same `total` field as the Stripe
integration to specify the charge amount. All other attributes remain the same,
so existing checkout code can submit the identical payload for either gateway.

The `/api/checkout/[provider]` route imports `shared/init` so a global
`generateOrderNumber` hook is registered before handling requests. The default
implementation reads the store prefix and order sequence from Supabase. You can
override this global to customize how order numbers are produced.

### NMI Integration

To enable NMI create a row in the `store_integrations` table with `gateway`
set to `nmi` and store both the API key and tokenization key under the
`settings` column:

```json
{
  "api_key": "<API_KEY>",
  "tokenization_key": "<TOKENIZATION_KEY>"
}
```

Activate the gateway by setting
`store_settings.settings.active_payment_gateway` to `nmi` (or override it on the
client via `window.SMOOTHR_CONFIG.active_payment_gateway`). Include NMI's
`Collect.js` script on checkout pages. After the Smoothr checkout script loads,
call `window.Smoothr.mountNMIFields()` to mount the card fields. The helper
injects a `[data-tokenization-key]` attribute on each field container
automatically.

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

Checkout requests post the `{ payment_token }` returned by Collect.js in place of
a Stripe `payment_method`.

### PayPal Integration

To enable PayPal create a row in the `store_integrations` table with `gateway`
set to `paypal` and store your REST credentials under the `settings` column:

```json
{
  "client_id": "<PAYPAL_CLIENT_ID>",
  "secret": "<PAYPAL_SECRET>"
}
```

`settings.client_id` is exposed to the storefront to load the PayPal JS SDK.
The server reads both `client_id` and `secret` – falling back to `api_key` for
the client ID – when creating and capturing orders.


Activate the gateway by setting
`store_settings.settings.active_payment_gateway` to `paypal` (or override it on
the client via `window.SMOOTHR_CONFIG.active_payment_gateway`).

### DEDUPE_WINDOW_MS

The Checkout API suppresses duplicate orders by comparing incoming carts and
rejecting identical submissions created within a time window. Configure the
window with the `DEDUPE_WINDOW_MS` environment variable. It defaults to 30
seconds. Setting a lower value or `0` disables server-side duplicate
suppression.

## Checkout flow

All gateways now delegate post-success behavior to `handleSuccessRedirect()` in utils.


### Deployment Log

The [DEPLOY_LOG.md](DEPLOY_LOG.md) file is updated automatically after each
successful deployment with the commit hash and UTC timestamp.

## CI/CD with GitHub Actions

All pushes to the `main` branch trigger the workflow defined at
`.github/workflows/build-and-deploy.yml`. The workflow uses Node.js 20,
installs dependencies, runs tests, builds the storefront SDK, performs the
postbuild check, and deploys `storefronts/dist` to Cloudflare Pages.

To configure deployment secrets go to **Settings → Secrets and variables →
Actions** in GitHub and add:

- `CLOUDFLARE_API_TOKEN` – a Pages API token
- `CLOUDFLARE_ACCOUNT_ID` – your Cloudflare account ID
- `CLOUDFLARE_PROJECT_NAME` – the Pages project name
- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anon key

These values are exported as environment variables so `npm run build` and the
Webflow checkout bundler can access them during the workflow.

Deployment logs and status can be monitored in the GitHub Actions tab.

## Running Tests

Vitest is used for unit testing across the workspace. Run all tests from the
repository root with:

```bash
npm test
```

### Install workspace dependencies first

The root `postinstall` script checks whether `storefronts/node_modules` and
`smoothr/node_modules` exist and runs `npm --workspace <name> install` if they
do not. This happens automatically when installing dependencies at the root or
before running `npm test`. You can still run the installs manually if needed:

```bash
cd storefronts && npm install
cd smoothr && npm install
```

The test command depends on `vitest` and other development packages. Missing
workspace dependencies will result in `vitest: command not found` errors, so the
postinstall script ensures everything is installed for you.

All tests rely on a shared setup file that polyfills browser globals like
`window`, `document` and `localStorage` for Node environments. The setup is
configured in `storefronts/vitest.config.js` and runs automatically.

## Debug logging

Set `SMOOTHR_DEBUG=true` to enable verbose logging in API routes, edge
functions and build scripts. Browser logs are controlled via
`window.SMOOTHR_CONFIG.debug`.

## Contribution Guidelines

- **Node.js**: use version 20 or later with ECMAScript Modules enabled.
- **Tests**: installing from the repository root triggers a `postinstall` script
  that installs workspace dependencies when missing. Run `npm test` from the
  root after `npm install`.
- **Coding style**: follow the existing style—two space indentation, single
  quotes and trailing semicolons. Keep the code free of unused variables and
  prefer small, focused commits.
- **Checkout modules**: after modifying any files under `storefronts/checkout/**`
  run `npm run bundle:webflow-checkout` before committing so
  `storefronts/dist/platforms/webflow/checkout.js` stays in sync.

## License

This project is licensed under the [MIT License](LICENSE).
