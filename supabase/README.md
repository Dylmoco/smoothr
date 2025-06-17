# Supabase Edge Functions

This folder contains Supabase edge functions for Smoothr. The only function at present is `proxy-live-rates` which serves currency exchange rates.

## Deploying

Ensure the [Supabase CLI](https://supabase.com/docs/guides/cli) is installed and you are logged in.
Deploy a function with:

```bash
supabase functions deploy proxy-live-rates
```

The CLI will upload the function to the currently linked project and make it available at `https://<project-ref>.functions.supabase.co/proxy-live-rates`.

## Configuration

Create a `.env` file in `supabase/functions` to provide environment variables to
the deployed functions. The live rates proxy requires an OpenExchangeRates API
token:

```bash
OPENEXCHANGERATES_TOKEN=your-token
```

See `.env.example` for a template. The Supabase CLI will also read `config.toml`
in this folder. To disable JWT verification for these functions add:

```toml
[functions]
verify_jwt = false
```

When invoking `proxy-live-rates` you must supply the custom authorization token:

```http
Authorization: Token eca2385f63504d80a624d130cce7e240
```

Without this header the function will respond with a 401 error.

