create or replace function public.get_public_gateway_credentials(store_id uuid, gateway text)
returns table(publishable_key text, tokenization_key text)
language sql
security definer
set search_path = public
as $$
  select
    settings->>'publishable_key' as publishable_key,
    settings->>'tokenization_key' as tokenization_key
  from store_integrations
  where store_id = get_public_gateway_credentials.store_id
    and sandbox = false
    and coalesce(gateway, settings->>'gateway') = get_public_gateway_credentials.gateway
  limit 1;
$$;

grant execute on function public.get_public_gateway_credentials(uuid, text) to anon;
