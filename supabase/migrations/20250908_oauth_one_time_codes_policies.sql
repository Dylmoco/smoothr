-- 2025-09-08__oauth_one_time_codes_policies.sql

-- Ensure RLS is ON (safer)
alter table public.oauth_one_time_codes enable row level security;

-- Create a helper policy role check (service role bypass)
-- The service role carries the 'service_role' JWT claim; PostgREST maps it to 'role' = 'service_role'
-- We’ll allow full access for service role only.
drop policy if exists "otc service read" on public.oauth_one_time_codes;
drop policy if exists "otc service insert" on public.oauth_one_time_codes;
drop policy if exists "otc service update" on public.oauth_one_time_codes;

create policy "otc service read"
  on public.oauth_one_time_codes
  for select
  to public
  using (current_setting('request.jwt.claim.role', true) = 'service_role');

create policy "otc service insert"
  on public.oauth_one_time_codes
  for insert
  to public
  with check (current_setting('request.jwt.claim.role', true) = 'service_role');

create policy "otc service update"
  on public.oauth_one_time_codes
  for update
  to public
  using (current_setting('request.jwt.claim.role', true) = 'service_role')
  with check (current_setting('request.jwt.claim.role', true) = 'service_role');

-- Optional: index to speed up lookups by OTC from JSONB
-- (safe to run if not present; use IF NOT EXISTS)
create index if not exists idx_oauth_otc_on_data_otc
  on public.oauth_one_time_codes ((data->>'otc'));

-- Optional: TTL cleanup via a simple view or scheduled task (future)
