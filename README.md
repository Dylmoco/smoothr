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

## Stripe Checkout API

The admin dashboard exposes a minimal endpoint at
`/api/checkout/stripe` for creating Stripe PaymentIntents. The request
body should include a numeric `amount` and optional `email`. When an
email is provided it will be used for Stripe receipts, otherwise the
intent is created without a receipt email.


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

All tests rely on a shared setup file that polyfills browser globals like
`window`, `document` and `localStorage` for Node environments. The setup is
configured in `storefronts/vitest.config.js` and runs automatically.

## Contribution Guidelines

- **Node.js**: use version 20 or later with ECMAScript Modules enabled.
- **Tests**: run `npm test` from the repository root to execute tests in all
  workspaces.
- **Coding style**: follow the existing style—two space indentation, single
  quotes and trailing semicolons. Keep the code free of unused variables and
  prefer small, focused commits.

## License

This project is licensed under the [MIT License](LICENSE).
