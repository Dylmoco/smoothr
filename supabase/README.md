# Supabase Edge Functions

This folder contains Supabase edge functions for Smoothr. It currently includes
`proxy-live-rates` for currency exchange rates and `webflow-order-handler` for
processing orders sent from Webflow.

## Deploying

Ensure the [Supabase CLI](https://supabase.com/docs/guides/cli) is installed and you are logged in.
Deploy a function with:

```bash
supabase functions deploy proxy-live-rates
supabase functions deploy webflow-order-handler
```

The CLI will upload each function to the currently linked project and make them
available at `https://<project-ref>.functions.supabase.co/<function-name>`.

## Configuration

Create a `.env` file in `supabase/functions` to provide environment variables to
the deployed functions. The live rates proxy requires the following OpenExchangeRates API
token:

```bash
OPENEXCHANGERATES_TOKEN=YOUR_TOKEN_HERE
```

See `.env.example` for a template. The Supabase CLI will also read `config.toml`
in this folder. To disable JWT verification for these functions add:

```toml
[functions]
verify_jwt = false
```

When invoking `proxy-live-rates` you must supply the custom authorization token:

```http
Authorization: Token YOUR_TOKEN_HERE
```

Without this header the function will respond with a 401 error.

## webflow-order-handler

This function accepts Webflow `order_created` webhooks and records the order
details in the `orders` table. Headers and payloads are logged to the Supabase
function logs for troubleshooting.

### Deploy

```bash
supabase functions deploy webflow-order-handler
```

### Environment variables

Add the following to `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### CORS configuration

All responses from `proxy-live-rates` include the following headers to allow cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type, Authorization, User-Agent
Access-Control-Allow-Methods: GET, OPTIONS
```

These headers are also returned for `OPTIONS` preflight requests.

### Query parameters

`proxy-live-rates` accepts optional `base` and `symbols` parameters:

- `base` – currency to convert other rates against. Defaults to `GBP`.
- `symbols` – comma separated list of currencies to include in the response. Defaults to `USD,EUR,GBP`.

For example to request rates relative to USD only for CAD:

```http
GET https://<project-ref>.functions.supabase.co/proxy-live-rates?base=USD&symbols=CAD
Authorization: Token YOUR_TOKEN_HERE
```


## Running tests

Run the Supabase tests using the workspace script from the repository root:

```bash
npm test
```

These tests are executed with `vitest` and rely on the `OPENEXCHANGERATES_TOKEN` environment variable. Network requests are made during the tests, so failures may occur in environments that block outbound traffic.

## Database migrations

Run Supabase migrations to keep your local database in sync. To add the
`cart_meta_hash` column to the `orders` table execute:

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_meta_hash text;
```

This statement is saved in
`supabase/migrations/20250708000000_add-cart-meta-hash.sql` so it can be applied
with the Supabase CLI or any PostgreSQL client.
