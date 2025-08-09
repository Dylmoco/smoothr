# Supabase Functions

This document describes available Edge Functions, their inputs, outputs, CORS rules, and sample requests.

## get_public_store_settings
- **Method:** POST
- **Input:** JSON body `{ "store_id": "<uuid>" }`
- **Output:** Public store settings object with null values removed.
- **CORS:** configurable via `FUNCTION_ALLOWED_ORIGINS`; defaults to `*` outside production and `https://smoothr-cms.webflow.io` in production
- **Sample:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    https://<project>.functions.supabase.co/get_public_store_settings \
    -d '{"store_id":"00000000-0000-0000-0000-000000000000"}'
  ```

## get_gateway_credentials
- **Method:** POST
- **Input:** JSON body `{ "store_id": "<uuid>", "gateway": "<gateway>" }`
- **Output:** `{ publishable_key, tokenization_key, gateway, store_id }`
- **CORS:** configurable via `FUNCTION_ALLOWED_ORIGINS`; defaults to `*` outside production and `https://smoothr-cms.webflow.io` in production
- **Sample:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    https://<project>.functions.supabase.co/get_gateway_credentials \
    -d '{"store_id":"00000000-0000-0000-0000-000000000000","gateway":"stripe"}'
  ```

## proxy-live-rates
- **Method:** GET
- **Input:** Query parameter `base` (optional, default `GBP`)
- **Output:** `{ base, rates, date }`
- **CORS:** `Access-Control-Allow-Origin: *`
- **Sample:**
  ```bash
  curl "https://<project>.functions.supabase.co/proxy-live-rates?base=USD"
  ```

## webflow-order-handler
- **Method:** POST
- **Input:** JSON body containing `orderId`, `customerInfo`, `lineItems`, `total`, `siteId`, `createdOn`
- **Output:** `{ success: true }`
- **CORS:** none (uses default browser behavior)
- **Sample:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    https://<project>.functions.supabase.co/webflow-order-handler \
    -d '{"orderId":"123","customerInfo":{"email":"x@y.com"},"lineItems":[],"total":100,"siteId":"site","createdOn":"2023-01-01"}'
  ```
