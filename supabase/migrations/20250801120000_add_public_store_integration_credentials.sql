-- Create view to expose NMI tokenization key publicly
create or replace view public.public_store_integration_credentials as
select
  store_id,
  gateway,
  settings ->> 'tokenization_key' as tokenization_key
from
  public.store_integrations
where
  sandbox = false;

alter view public.public_store_integration_credentials owner to postgres;

grant select on public.public_store_integration_credentials to anon;
