CREATE UNIQUE INDEX orders_store_id_order_number_key ON public.orders USING btree (store_id, order_number);

alter table "public"."orders" add constraint "orders_store_id_order_number_key" UNIQUE using index "orders_store_id_order_number_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.next_order_number(store_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  new_seq int;
  prefix text;
begin
  update stores
  set order_sequence = order_sequence + 1
  where id = store_id
  returning order_sequence, stores.prefix into new_seq, prefix;

  return prefix || '-' || lpad(new_seq::text, 4, '0');
end;
$function$
;

grant delete on table "public"."abandoned_carts" to "service_role";

grant insert on table "public"."abandoned_carts" to "service_role";

grant references on table "public"."abandoned_carts" to "service_role";

grant select on table "public"."abandoned_carts" to "service_role";

grant trigger on table "public"."abandoned_carts" to "service_role";

grant truncate on table "public"."abandoned_carts" to "service_role";

grant update on table "public"."abandoned_carts" to "service_role";

grant delete on table "public"."affiliate_usages" to "service_role";

grant insert on table "public"."affiliate_usages" to "service_role";

grant references on table "public"."affiliate_usages" to "service_role";

grant select on table "public"."affiliate_usages" to "service_role";

grant trigger on table "public"."affiliate_usages" to "service_role";

grant truncate on table "public"."affiliate_usages" to "service_role";

grant update on table "public"."affiliate_usages" to "service_role";

grant delete on table "public"."affiliates" to "service_role";

grant insert on table "public"."affiliates" to "service_role";

grant references on table "public"."affiliates" to "service_role";

grant select on table "public"."affiliates" to "service_role";

grant trigger on table "public"."affiliates" to "service_role";

grant truncate on table "public"."affiliates" to "service_role";

grant update on table "public"."affiliates" to "service_role";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."customer_payment_profiles" to "service_role";

grant insert on table "public"."customer_payment_profiles" to "service_role";

grant references on table "public"."customer_payment_profiles" to "service_role";

grant select on table "public"."customer_payment_profiles" to "service_role";

grant trigger on table "public"."customer_payment_profiles" to "service_role";

grant truncate on table "public"."customer_payment_profiles" to "service_role";

grant update on table "public"."customer_payment_profiles" to "service_role";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."discount_usages" to "service_role";

grant insert on table "public"."discount_usages" to "service_role";

grant references on table "public"."discount_usages" to "service_role";

grant select on table "public"."discount_usages" to "service_role";

grant trigger on table "public"."discount_usages" to "service_role";

grant truncate on table "public"."discount_usages" to "service_role";

grant update on table "public"."discount_usages" to "service_role";

grant delete on table "public"."discounts" to "service_role";

grant insert on table "public"."discounts" to "service_role";

grant references on table "public"."discounts" to "service_role";

grant select on table "public"."discounts" to "service_role";

grant trigger on table "public"."discounts" to "service_role";

grant truncate on table "public"."discounts" to "service_role";

grant update on table "public"."discounts" to "service_role";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."public_store_settings" to "service_role";

grant insert on table "public"."public_store_settings" to "service_role";

grant references on table "public"."public_store_settings" to "service_role";

grant select on table "public"."public_store_settings" to "service_role";

grant trigger on table "public"."public_store_settings" to "service_role";

grant truncate on table "public"."public_store_settings" to "service_role";

grant update on table "public"."public_store_settings" to "service_role";

grant delete on table "public"."referrals" to "service_role";

grant insert on table "public"."referrals" to "service_role";

grant references on table "public"."referrals" to "service_role";

grant select on table "public"."referrals" to "service_role";

grant trigger on table "public"."referrals" to "service_role";

grant truncate on table "public"."referrals" to "service_role";

grant update on table "public"."referrals" to "service_role";

grant delete on table "public"."returns" to "service_role";

grant insert on table "public"."returns" to "service_role";

grant references on table "public"."returns" to "service_role";

grant select on table "public"."returns" to "service_role";

grant trigger on table "public"."returns" to "service_role";

grant truncate on table "public"."returns" to "service_role";

grant update on table "public"."returns" to "service_role";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."store_integrations" to "service_role";

grant insert on table "public"."store_integrations" to "service_role";

grant references on table "public"."store_integrations" to "service_role";

grant select on table "public"."store_integrations" to "service_role";

grant trigger on table "public"."store_integrations" to "service_role";

grant truncate on table "public"."store_integrations" to "service_role";

grant update on table "public"."store_integrations" to "service_role";

grant delete on table "public"."store_settings" to "service_role";

grant insert on table "public"."store_settings" to "service_role";

grant references on table "public"."store_settings" to "service_role";

grant select on table "public"."store_settings" to "service_role";

grant trigger on table "public"."store_settings" to "service_role";

grant truncate on table "public"."store_settings" to "service_role";

grant update on table "public"."store_settings" to "service_role";

grant delete on table "public"."stores" to "service_role";

grant insert on table "public"."stores" to "service_role";

grant references on table "public"."stores" to "service_role";

grant select on table "public"."stores" to "service_role";

grant trigger on table "public"."stores" to "service_role";

grant truncate on table "public"."stores" to "service_role";

grant update on table "public"."stores" to "service_role";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."user_stores" to "service_role";

grant insert on table "public"."user_stores" to "service_role";

grant references on table "public"."user_stores" to "service_role";

grant select on table "public"."user_stores" to "service_role";

grant trigger on table "public"."user_stores" to "service_role";

grant truncate on table "public"."user_stores" to "service_role";

grant update on table "public"."user_stores" to "service_role";

grant delete on table "public"."webflow_connections" to "service_role";

grant insert on table "public"."webflow_connections" to "service_role";

grant references on table "public"."webflow_connections" to "service_role";

grant select on table "public"."webflow_connections" to "service_role";

grant trigger on table "public"."webflow_connections" to "service_role";

grant truncate on table "public"."webflow_connections" to "service_role";

grant update on table "public"."webflow_connections" to "service_role";

create policy "Allow service role read access"
on "public"."customer_payment_profiles"
as permissive
for select
to service_role
using (true);


create policy "Allow service role read access"
on "public"."customers"
as permissive
for select
to service_role
using (true);


create policy "Allow service role read access"
on "public"."discount_usages"
as permissive
for select
to service_role
using (true);


create policy "Allow service role read access"
on "public"."discounts"
as permissive
for select
to service_role
using (true);


create policy "Allow service role read access"
on "public"."order_items"
as permissive
for select
to service_role
using (true);


create policy "Allow service role read access"
on "public"."orders"
as permissive
for select
to service_role
using (true);


create policy "Allow service role read access"
on "public"."stores"
as permissive
for select
to service_role
using (true);



