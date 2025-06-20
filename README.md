# Smoothr SaaS Monorepo

This repository contains all code for Smoothr, structured as a modular SaaS platform. Each top-level directory groups frontend storefront features, shared backend utilities, and the admin dashboard.

## Directory Overview

- **/storefronts/** – Client-facing storefront code and widgets.
  - _Note: the older `/client` folder was removed in favor of `/storefronts`. Any
    Cloudflare `_headers` configuration previously under `client/dist` is no
    longer required._
  - **/core/** – Core storefront modules such as orders, returns, reviews, analytics, discounts, currency, affiliates, customer dashboard, abandoned cart, and subscriptions.
  - **/platforms/** – Adapters for various web builder platforms.
  - **/clonables/** – Embeddable widgets and plug‑and‑play code.
- **/shared/** – Server-side logic for orders, returns, reviews, analytics, discounts, currency, affiliates, abandoned cart, subscriptions, and Supabase helpers.
- **/smoothr/** – Next.js admin dashboard application.
  - **/admin-modules/** – Admin views for orders, returns, reviews, analytics, discounts, currency, affiliates, dashboard, abandoned cart, and subscriptions.
- **/infrastructure/workers/** – Cloudflare Workers used by Smoothr.
- **.gitignore** – Ignore Node modules, logs, env files, and build output.

The auth utilities now include client-side validation, loading states and keyboard-accessible forms for a smoother user experience. Google OAuth signups display the same "Account created! Redirecting..." message as email signups when a new account is created.

This README serves as the source of truth for new developers on how the repository is organized and where modules belong.

## Workspace Setup

The repository is managed as a Node.js workspace. The root `package.json` lists
two workspaces:

- `smoothr` – the admin dashboard
- `storefronts` – the storefront SDK and widgets

Running `npm install` from the repository root installs dependencies for all
packages in one step.

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

Build the SDK for production with `npm run build` which outputs
`dist/smoothr-sdk.js`.

## Running Tests

Vitest is used for unit testing across the workspace. Run all tests from the
repository root with:

```bash
npm test
```

## Contribution Guidelines

- **Node.js**: use version 20 or later.
- **Tests**: run `npm test` from the repository root to execute tests in all
  workspaces.
- **Coding style**: follow the existing style—two space indentation, single
  quotes and trailing semicolons. Keep the code free of unused variables and
  prefer small, focused commits.

## License

This project is licensed under the [MIT License](LICENSE).
