# Smoothr SaaS Monorepo

This repository contains all code for Smoothr, structured as a modular SaaS platform. Each top-level directory groups frontend storefront features, shared backend utilities, and the admin dashboard.

## Directory Overview

- **/storefronts/** – Client-facing storefront code and widgets.
  - _Note: the older `/client` folder was removed in favor of `/storefronts`. Any
    Cloudflare `_headers` configuration previously under `client/dist` is no
    longer required._
  - **/core/** – Core storefront modules such as orders, returns, reviews, analytics, discounts, currency, affiliates, cart, customer dashboard, abandoned cart, and subscriptions.
  - **/platforms/** – Adapters for various web builder platforms.
  - **/clonables/** – Embeddable widgets and plug‑and‑play code.
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

1. `/api/checkout/[provider]` – processes a posted cart using the configured payment gateway. The `[provider]` segment must match the gateway configured for the store. The request body must include the following fields:

- `payment_method` – the ID of the payment method to charge
- `email` – customer email for receipts
- `first_name` – customer's first name
- `last_name` – customer's last name
- `shipping` – shipping address object
- `cart` – array of cart items
- `total` – numeric order total
- `currency` – ISO currency code
- `description` *(optional)* – order description

   On success the endpoint responds with the created order ID and any payment
   intent ID returned by the gateway.

2. `/api/create-checkout-session` – generates a Stripe Checkout Session.
   This endpoint sets `success_url` to `<origin>/checkout-success` and
   responds with the Checkout Session URL.

The SDK determines the active payment gateway by first checking
`window.SMOOTHR_CONFIG.active_payment_gateway`. If absent, it loads the value
from the store's `store_settings` table in Supabase using the configured
`storeId`. The `[provider]` segment in the route should match this value and
defaults to `stripe` when no configuration is found.

To enable Authorize.net create a row in the `store_integrations` table with
`integration_id` set to `authorizeNet` and store your API credentials under the
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
it on the client with `window.SMOOTHR_CONFIG.active_payment_gateway`).

```html
<script>
  window.SMOOTHR_CONFIG = { active_payment_gateway: 'authorizeNet' };
</script>
```

Include the Authorize.Net Accept.js script on pages that render the checkout form:

```html
<script type="text/javascript" src="https://jstest.authorize.net/v1/Accept.js"></script>
```

The checkout payload for Authorize.Net uses the same `total` field as the Stripe
integration to specify the charge amount. All other attributes remain the same,
so existing checkout code can submit the identical payload for either gateway.


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

Deployment logs and status can be monitored in the GitHub Actions tab.

## Running Tests

Vitest is used for unit testing across the workspace. Run all tests from the
repository root with:

```bash
npm test
```

The test command depends on `vitest` and other development packages. Vitest is
declared in each workspace’s `package.json`, so **run `npm install` inside the
`storefronts` directory (and in `smoothr` if it contains tests)** before
executing `npm test`.

All tests rely on a shared setup file that polyfills browser globals like
`window`, `document` and `localStorage` for Node environments. The setup is
configured in `storefronts/vitest.config.js` and runs automatically.

## Debug logging

Set `SMOOTHR_DEBUG=true` to enable verbose logging in API routes, edge
functions and build scripts. Browser logs are controlled via
`window.SMOOTHR_CONFIG.debug`.

## Contribution Guidelines

- **Node.js**: use version 20 or later with ECMAScript Modules enabled.
- **Tests**: run `npm install` (or `npm ci`) in both `storefronts` and `smoothr`
  before running `npm test` from the repository root.
- **Coding style**: follow the existing style—two space indentation, single
  quotes and trailing semicolons. Keep the code free of unused variables and
  prefer small, focused commits.

## License

This project is licensed under the [MIT License](LICENSE).
