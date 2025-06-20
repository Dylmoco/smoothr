# storefronts

Client-facing storefront code and widgets.

This package contains the core storefront modules located in `./core`.

The bundled SDK is designed for zero‑config installation on platforms like
Webflow. Simply include

```html
<script type="module" src="https://sdk.smoothr.io/smoothr-sdk.js"></script>
```

and authentication will initialize automatically.

Create a `.env` file in this directory and provide your Supabase project details.
These variables are injected at build time by Vite (see `vite.config.js`) so the
final SDK has no `process.env` references:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Warning**: if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
are omitted the SDK will fall back to the placeholder values
`https://your-project.supabase.co` and `your-anon-key` from
`../supabase/client.js`. Login requests sent to these defaults will fail.

An `.env.example` file is included for reference.

Authentication flows and OAuth callback behaviour are documented in `/supabase/README.md`.

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
<span data-smoothr-price="10"></span>
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

## Building the SDK

Generate the production bundle with:

```bash
vite build
```

The compiled file will be written to `dist/smoothr-sdk.js`.

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

## Authentication

To wire up login in your Webflow or Framer site, paste this HTML snippet where you want the login form:

```html
<!-- Login Form Clonable for Smoothr SDK -->
<form data-smoothr="login-form">
  <input type="email" data-smoothr-input="email" placeholder="Email" required />
  <input type="password" data-smoothr-input="password" placeholder="Password" required />
  <div data-smoothr="login">Log In</div>
  <div data-smoothr="login-google">Log In with Google</div>
</form>
<!-- Include the Smoothr SDK once per page -->
<script src="https://sdk.smoothr.io/smoothr-sdk.js" defer></script>
```

The Smoothr SDK will automatically bind:

- `data-smoothr="login-form"` → your `<form>` element
- `data-smoothr-input="email"` → your email `<input>`
- `data-smoothr-input="password"` → your password `<input>`
- `data-smoothr="login"` → your login trigger `<div>` or `<button>` (a warning is logged if none are found)
- `data-smoothr="login-google"` → your Google login `<div>` or `<button>`
- `data-smoothr="logout"` → your logout trigger `<div>` or `<button>`

To add a logout button elsewhere on the page:

```html
<div data-smoothr="logout">Log Out</div>
```

Clicking this element logs the user out, dispatches a `smoothr:logout` event,
and then redirects using the configured logout URL when available.

Make sure you include the SDK script exactly once via:

```html
<script src="https://sdk.smoothr.io/smoothr-sdk.js" defer></script>
```

After a successful login the SDK dispatches a `smoothr:login` event on
`document` and redirects to the URL configured for the current store. The
redirect location is read from the `login_redirect_url` column of the `stores`
table using the page hostname. If no entry exists, the user is sent to `/`.

