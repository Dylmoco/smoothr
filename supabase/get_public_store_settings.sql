create or replace function public.get_public_store_settings(p_store_id uuid)
returns public.public_store_settings
language sql
security definer
set search_path = public
as $$
  select * from public_store_settings where store_id = p_store_id;
$$;

grant execute on function public.get_public_store_settings(uuid) to anon;
grant execute on function public.get_public_store_settings(uuid) to authenticated;
