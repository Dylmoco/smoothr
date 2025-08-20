# Smoothr Master Outline

## Data Sourcess

- **Client-side configuration** uses the `v_public_store` view to expose public store metadata needed by the storefront SDK.
- **Server-side configuration** is stored in the `integrations` and `store_settings` tables and accessed with `shared/supabase/client.ts`.
- **Gateway credentials** are resolved by `shared/checkout/getActiveGatewayCreds.ts`, which looks up the active integration and retrieves secrets.

## Workflow Summary

1. The storefront loads public configuration from `v_public_store` using the store ID.
2. Server helpers check `store_settings` to determine the active gateway and fetch credentials with `getActiveGatewayCreds.ts`.
3. Integrations are defined in the `integrations` table with associated secrets stored in the vault..
