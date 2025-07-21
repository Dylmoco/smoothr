drop function if exists "public"."get_public_tokenization_key"(store_id uuid, gateway text);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_public_tokenization_key(input_store_id uuid, input_gateway text)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    settings ->> 'tokenization_key'
  from store_integrations
  where store_id = input_store_id
    and gateway = input_gateway
    and sandbox = false
  limit 1;
$function$
;

grant select on table "public"."public_store_settings" to "anon";

grant select on table "public"."public_store_settings" to "authenticated";


