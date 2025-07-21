-- Function to expose tokenization keys publicly
create or replace function public.get_public_tokenization_key(
  store_id uuid,
  gateway text
)
returns text
language sql
security definer
as $$
  select settings ->> 'tokenization_key'
  from public.store_integrations
  where store_id = get_public_tokenization_key.store_id
    and sandbox = false
    and (
      gateway = get_public_tokenization_key.gateway or
      settings ->> 'gateway' = get_public_tokenization_key.gateway
    )
  limit 1
$$;

grant execute on function public.get_public_tokenization_key(uuid, text) to anon;
