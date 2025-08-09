# Supabase GitOps Workflow

## PR to Staging to Production

Changes to migrations and functions flow through Git:

1. Opening a pull request triggers a GitHub Action that automatically applies the changes to the staging project.
2. After review and approval, a follow-up workflow promotes the same migrations and functions to production.

## Required GitHub Actions Secrets

The deployment workflows require the following secrets:

- `SUPABASE_ACCESS_TOKEN_STAGING`
- `SUPABASE_PROJECT_REF_STAGING`
- `SUPABASE_ACCESS_TOKEN_PROD`
- `SUPABASE_PROJECT_REF_PROD`
- `FUNCTION_ALLOWED_ORIGINS` (optional, overrides default CORS origins for functions)

## Fixing Migration Drift

If your local migrations drift from the database state:

1. Run `supabase migration repair` to mark existing migrations as applied.
2. Run `supabase db pull` to refresh the schema snapshot.

## Rollback Strategy

Do not edit old migrations. To roll back a change, create a new migration that reverts the previous one.

## Function Testing Contract

Supabase functions must accept a `POST` request containing a JSON body with `store_id`.
Validate the `Origin` header against the allowed origins (`FUNCTION_ALLOWED_ORIGINS`) to enforce CORS.
