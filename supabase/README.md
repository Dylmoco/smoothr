# Supabase Development Guide

This directory contains the Supabase database schema and edge functions for Smoothr.

## Creating migrations

1. Start from the template at `supabase/templates/migration.sql`.
2. Copy it into `supabase/migrations/<timestamp>_<description>.sql`.
3. Fill in the `Author`, `Date`, and `Reason` fields and place your SQL in the
   appropriate sections (`REVOKE`, `CREATE/ALTER`, `RLS POLICIES`, `GRANTS`).
4. Check the file into version control – *never* run loose SQL outside of a
   migration file.

## Local testing

Apply migrations to your local database before opening a pull request:

```bash
supabase db push
```

Run the edge function tests from the repository root:

```bash
npm test
```

## CI flow

- **Pull request → staging** – when a PR is opened, its migrations are applied to
  the staging project.
- **`main` → production** – merging to `main` deploys to production after manual
  approval.
- Use `supabase-promote` to re-deploy the latest production release if needed.

## Never do

- Do not commit or run loose SQL outside migration files.
- Do not return secrets, service role keys, or other sensitive data in any
  response or log.
- Do not use `GET` requests for actions that involve sensitive data or mutate
  state – prefer `POST` or other methods with proper authentication.
