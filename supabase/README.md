# Supabase

This folder contains Supabase edge functions and authentication helpers for Smoothr. The only edge function at present is `proxy-live-rates` which serves currency exchange rates.

## Deploying

Ensure the [Supabase CLI](https://supabase.com/docs/guides/cli) is installed and you are logged in.
Deploy a function with:

```bash
supabase functions deploy proxy-live-rates
```

The CLI will upload the function to the currently linked project and make it available at `https://<project-ref>.functions.supabase.co/proxy-live-rates`.

## Configuration

Create a `.env` file in `supabase/functions` to provide environment variables to
the deployed functions. The live rates proxy requires your OpenExchangeRates API
token:

```bash
OPENEXCHANGERATES_TOKEN=<your-openexchangerates-token>
```

See `.env.example` for a template. The Supabase CLI will also read `config.toml`
in this folder. To disable JWT verification for these functions add:

```toml
[functions]
verify_jwt = false
```

When invoking `proxy-live-rates` you must supply the custom authorization token:

```http
Authorization: Token <your-authorization-token>
```

Without this header the function will respond with a 401 error.

When building the storefront SDK, provide this token via the
`PROXY_LIVE_RATES_TOKEN` environment variable so requests include the
correct header.

### Query parameters

`proxy-live-rates` accepts optional `base` and `symbols` parameters:

- `base` – currency to convert other rates against. Defaults to `GBP`.
- `symbols` – comma separated list of currencies to include in the response. Defaults to `USD,EUR,GBP`.

For example to request rates relative to USD only for CAD:

```http
GET https://<project-ref>.functions.supabase.co/proxy-live-rates?base=USD&symbols=CAD
Authorization: Token <your-authorization-token>
```

## Authentication flows

Smoothr supports traditional email/password sign&nbsp;in alongside Google OAuth.
The utilities in `auth.js` expose `signInWithPassword()` and `signInWithOAuth()`
helpers for these flows.

1. **Email/password** – form inputs collect the credentials and pass them to
   `signInWithPassword()`.
2. **Google OAuth** – `signInWithOAuth()` redirects users to Google. Supabase
   sends them back to `/oauth-callback` after authentication.

### `/oauth-callback`

This page receives the OAuth response from Supabase. It attempts to call
`supabase.auth.setSession()` using the access and refresh tokens provided in the
URL fragment. If this fails (for example when running on a different subdomain)
the page redirects to the original `redirect_uri` with the tokens appended as
`smoothr_token` and `refresh_token` query parameters.

Add `https://www.smoothr.io/oauth-callback` to your Supabase project's
**Additional Redirect URLs** so Google OAuth can return to this page.

### Restoring sessions

Application pages should call `initAuth()` on load. This helper checks for
`smoothr_token` and `refresh_token` parameters in the URL. When present it calls
`supabase.auth.setSession()` to establish the session and then cleans the query
string. It falls back to `supabase.auth.getSession()` to restore any existing
cookie‑based session.

