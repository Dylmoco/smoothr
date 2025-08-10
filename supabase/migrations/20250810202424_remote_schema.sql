drop policy "anon can select store config" on "public"."public_store_settings";

drop policy "public read" on "public"."public_store_settings";

drop policy "public select" on "public"."public_store_settings";

drop policy "abandoned_carts_admin_select" on "public"."abandoned_carts";

drop policy "abandoned_carts_admin_write" on "public"."abandoned_carts";

drop policy "affiliate_usages_admin_select" on "public"."affiliate_usages";

drop policy "affiliate_usages_admin_write" on "public"."affiliate_usages";

drop policy "affiliates_admin_select" on "public"."affiliates";

drop policy "affiliates_admin_write" on "public"."affiliates";

drop policy "audit_logs_admin_select" on "public"."audit_logs";

drop policy "audit_logs_admin_write" on "public"."audit_logs";

drop policy "customer_payment_profiles_admin" on "public"."customer_payment_profiles";

drop policy "customers_store_admin_select" on "public"."customers";

drop policy "discount_usages_admin_select" on "public"."discount_usages";

drop policy "discount_usages_admin_write" on "public"."discount_usages";

drop policy "discounts_admin_select" on "public"."discounts";

drop policy "discounts_admin_write" on "public"."discounts";

drop policy "notifications_admin_select" on "public"."notifications";

drop policy "notifications_admin_write" on "public"."notifications";

drop policy "order_items_customer_select" on "public"."order_items";

drop policy "orders_admin_service_delete" on "public"."orders";

drop policy "orders_admin_service_update" on "public"."orders";

drop policy "referrals_admin_select" on "public"."referrals";

drop policy "referrals_admin_write" on "public"."referrals";

drop policy "returns_admin_select" on "public"."returns";

drop policy "returns_admin_write" on "public"."returns";

drop policy "reviews_admin_select" on "public"."reviews";

drop policy "reviews_admin_write" on "public"."reviews";

drop policy "store_integrations_service_role_admin_select" on "public"."store_integrations";

drop policy "store_settings_admin_all" on "public"."store_settings";

drop policy "subscriptions_admin_select" on "public"."subscriptions";

drop policy "subscriptions_admin_write" on "public"."subscriptions";

drop policy "webflow_connections_admin_select" on "public"."webflow_connections";

drop policy "webflow_connections_admin_write" on "public"."webflow_connections";

revoke select on table "public"."abandoned_carts" from "anon";

revoke select on table "public"."affiliate_usages" from "anon";

revoke select on table "public"."affiliates" from "anon";

revoke select on table "public"."audit_logs" from "anon";

revoke select on table "public"."customer_payment_profiles" from "anon";

revoke select on table "public"."customers" from "anon";

revoke select on table "public"."discount_usages" from "anon";

revoke select on table "public"."discounts" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke select on table "public"."order_items" from "anon";

revoke select on table "public"."orders" from "anon";

revoke select on table "public"."public_store_settings" from "anon";

revoke select on table "public"."public_store_settings" from "authenticated";

revoke select on table "public"."referrals" from "anon";

revoke select on table "public"."returns" from "anon";

revoke select on table "public"."reviews" from "anon";

revoke select on table "public"."store_integrations" from "anon";

revoke select on table "public"."store_settings" from "anon";

revoke select on table "public"."store_settings" from "authenticated";

revoke select on table "public"."stores" from "anon";

revoke select on table "public"."subscriptions" from "anon";

revoke select on table "public"."user_stores" from "anon";

revoke select on table "public"."webflow_connections" from "anon";

alter table "public"."abandoned_carts" drop constraint "abandoned_carts_customer_id_fkey";

alter table "public"."abandoned_carts" drop constraint "abandoned_carts_store_id_fkey";

alter table "public"."affiliate_usages" drop constraint "affiliate_usages_affiliate_id_fkey";

alter table "public"."affiliate_usages" drop constraint "affiliate_usages_order_id_fkey";

alter table "public"."affiliates" drop constraint "affiliates_store_id_fkey";

alter table "public"."customer_payment_profiles" drop constraint "customer_payment_profiles_customer_id_fkey";

alter table "public"."customers" drop constraint "customers_store_id_fkey";

alter table "public"."discount_usages" drop constraint "discount_usages_customer_id_fkey";

alter table "public"."discount_usages" drop constraint "discount_usages_discount_id_fkey";

alter table "public"."discount_usages" drop constraint "discount_usages_order_id_fkey";

alter table "public"."discounts" drop constraint "discounts_store_id_fkey";

alter table "public"."notifications" drop constraint "notifications_customer_id_fkey";

alter table "public"."notifications" drop constraint "notifications_store_id_fkey";

alter table "public"."order_items" drop constraint "order_items_order_id_fkey";

alter table "public"."orders" drop constraint "orders_customer_id_fkey";

alter table "public"."orders" drop constraint "orders_store_id_fkey";

alter table "public"."public_store_settings" drop constraint "public_store_settings_store_id_fkey";

alter table "public"."referrals" drop constraint "referrals_referrer_id_fkey";

alter table "public"."returns" drop constraint "returns_customer_id_fkey";

alter table "public"."returns" drop constraint "returns_order_id_fkey";

alter table "public"."reviews" drop constraint "reviews_customer_id_fkey";

alter table "public"."reviews" drop constraint "reviews_order_id_fkey";

alter table "public"."store_integrations" drop constraint "store_integrations_store_id_fkey";

alter table "public"."store_settings" drop constraint "store_settings_store_id_fkey";

alter table "public"."stores" drop constraint "stores_owner_customer_id_fkey";

alter table "public"."subscriptions" drop constraint "subscriptions_customer_id_fkey";

alter table "public"."user_stores" drop constraint "user_stores_customer_id_fkey";

alter table "public"."user_stores" drop constraint "user_stores_store_id_fkey";

alter table "public"."webflow_connections" drop constraint "webflow_connections_customer_id_fkey";

alter table "public"."public_store_settings" add column "account_deleted_redirect_url" text;

alter table "public"."public_store_settings" add column "dashboard_home_url" text;

alter table "public"."public_store_settings" add column "login_redirect_url" text;

alter table "public"."public_store_settings" add column "logout_redirect_url" text;

alter table "public"."public_store_settings" add column "password_reset_redirect_url" text;

alter table "public"."public_store_settings" add column "payment_failure_redirect_url" text;

alter table "public"."public_store_settings" add column "payment_success_redirect_url" text;

alter table "public"."public_store_settings" add column "signup_redirect_url" text;

alter table "public"."store_settings" add column "active_payment_gateway" text;

alter table "public"."store_settings" add column "base_currency" text;

CREATE UNIQUE INDEX orders_store_id_order_number_key ON public.orders USING btree (store_id, order_number);

CREATE UNIQUE INDEX public_store_settings_store_id_key ON public.public_store_settings USING btree (store_id);

alter table "public"."orders" add constraint "orders_store_id_order_number_key" UNIQUE using index "orders_store_id_order_number_key";

alter table "public"."public_store_settings" add constraint "public_store_settings_store_id_key" UNIQUE using index "public_store_settings_store_id_key";

alter table "public"."abandoned_carts" add constraint "abandoned_carts_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."abandoned_carts" validate constraint "abandoned_carts_customer_id_fkey";

alter table "public"."abandoned_carts" add constraint "abandoned_carts_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."abandoned_carts" validate constraint "abandoned_carts_store_id_fkey";

alter table "public"."affiliate_usages" add constraint "affiliate_usages_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) not valid;

alter table "public"."affiliate_usages" validate constraint "affiliate_usages_affiliate_id_fkey";

alter table "public"."affiliate_usages" add constraint "affiliate_usages_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."affiliate_usages" validate constraint "affiliate_usages_order_id_fkey";

alter table "public"."affiliates" add constraint "affiliates_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."affiliates" validate constraint "affiliates_store_id_fkey";

alter table "public"."customer_payment_profiles" add constraint "customer_payment_profiles_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."customer_payment_profiles" validate constraint "customer_payment_profiles_customer_id_fkey";

alter table "public"."customers" add constraint "customers_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."customers" validate constraint "customers_store_id_fkey";

alter table "public"."discount_usages" add constraint "discount_usages_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."discount_usages" validate constraint "discount_usages_customer_id_fkey";

alter table "public"."discount_usages" add constraint "discount_usages_discount_id_fkey" FOREIGN KEY (discount_id) REFERENCES public.discounts(id) not valid;

alter table "public"."discount_usages" validate constraint "discount_usages_discount_id_fkey";

alter table "public"."discount_usages" add constraint "discount_usages_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."discount_usages" validate constraint "discount_usages_order_id_fkey";

alter table "public"."discounts" add constraint "discounts_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."discounts" validate constraint "discounts_store_id_fkey";

alter table "public"."notifications" add constraint "notifications_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."notifications" validate constraint "notifications_customer_id_fkey";

alter table "public"."notifications" add constraint "notifications_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."notifications" validate constraint "notifications_store_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."orders" validate constraint "orders_customer_id_fkey";

alter table "public"."orders" add constraint "orders_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."orders" validate constraint "orders_store_id_fkey";

alter table "public"."public_store_settings" add constraint "public_store_settings_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."public_store_settings" validate constraint "public_store_settings_store_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES public.customers(id) not valid;

alter table "public"."referrals" validate constraint "referrals_referrer_id_fkey";

alter table "public"."returns" add constraint "returns_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."returns" validate constraint "returns_customer_id_fkey";

alter table "public"."returns" add constraint "returns_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."returns" validate constraint "returns_order_id_fkey";

alter table "public"."reviews" add constraint "reviews_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."reviews" validate constraint "reviews_customer_id_fkey";

alter table "public"."reviews" add constraint "reviews_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."reviews" validate constraint "reviews_order_id_fkey";

alter table "public"."store_integrations" add constraint "store_integrations_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."store_integrations" validate constraint "store_integrations_store_id_fkey";

alter table "public"."store_settings" add constraint "store_settings_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."store_settings" validate constraint "store_settings_store_id_fkey";

alter table "public"."stores" add constraint "stores_owner_customer_id_fkey" FOREIGN KEY (owner_customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."stores" validate constraint "stores_owner_customer_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_customer_id_fkey";

alter table "public"."user_stores" add constraint "user_stores_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."user_stores" validate constraint "user_stores_customer_id_fkey";

alter table "public"."user_stores" add constraint "user_stores_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."user_stores" validate constraint "user_stores_store_id_fkey";

alter table "public"."webflow_connections" add constraint "webflow_connections_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."webflow_connections" validate constraint "webflow_connections_customer_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_public_store_settings(p_store_id uuid)
 RETURNS TABLE(store_id uuid, base_currency text, active_payment_gateway text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    pss.store_id,
    pss.base_currency,
    pss.active_payment_gateway
  FROM public.public_store_settings pss
  WHERE pss.store_id = p_store_id
$function$
;

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

CREATE OR REPLACE FUNCTION public.generate_order_number(p_store_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_seq integer;
  store_prefix text;
BEGIN
  -- Atomically bump the store's own sequence
  UPDATE public.stores
  SET order_sequence = order_sequence + 1
  WHERE id = p_store_id
  RETURNING order_sequence INTO next_seq;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store % not found', p_store_id;
  END IF;

  -- Fetch the prefix
  SELECT prefix
  INTO store_prefix
  FROM public.stores
  WHERE id = p_store_id;

  RETURN store_prefix || '-' || lpad(next_seq::text, 4, '0');
END;
$function$
;

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

create or replace view "public"."public_store_integration_credentials" as  SELECT store_integrations.store_id,
    store_integrations.gateway,
    (store_integrations.settings ->> 'tokenization_key'::text) AS tokenization_key,
    (store_integrations.settings ->> 'publishable_key'::text) AS publishable_key
   FROM public.store_integrations
  WHERE (((store_integrations.settings ->> 'tokenization_key'::text) IS NOT NULL) OR ((store_integrations.settings ->> 'publishable_key'::text) IS NOT NULL));


create or replace view "public"."store_integration_credentials" as  SELECT public_store_integration_credentials.store_id,
    public_store_integration_credentials.gateway,
    public_store_integration_credentials.tokenization_key,
    public_store_integration_credentials.publishable_key
   FROM public.public_store_integration_credentials;


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


create policy "Allow authenticated users to read store settings"
on "public"."public_store_settings"
as permissive
for select
to authenticated
using (true);


create policy "Allow guests to read store settings"
on "public"."public_store_settings"
as permissive
for select
to anon
using (true);


create policy "Allow service role read access"
on "public"."stores"
as permissive
for select
to service_role
using (true);


create policy "abandoned_carts_admin_select"
on "public"."abandoned_carts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = abandoned_carts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "abandoned_carts_admin_write"
on "public"."abandoned_carts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = abandoned_carts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = abandoned_carts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "affiliate_usages_admin_select"
on "public"."affiliate_usages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (public.affiliates a
     JOIN public.user_stores us ON ((us.store_id = a.store_id)))
  WHERE ((a.id = affiliate_usages.affiliate_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "affiliate_usages_admin_write"
on "public"."affiliate_usages"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (public.affiliates a
     JOIN public.user_stores us ON ((us.store_id = a.store_id)))
  WHERE ((a.id = affiliate_usages.affiliate_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (public.affiliates a
     JOIN public.user_stores us ON ((us.store_id = a.store_id)))
  WHERE ((a.id = affiliate_usages.affiliate_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "affiliates_admin_select"
on "public"."affiliates"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = affiliates.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "affiliates_admin_write"
on "public"."affiliates"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = affiliates.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = affiliates.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "audit_logs_admin_select"
on "public"."audit_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "audit_logs_admin_write"
on "public"."audit_logs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "customer_payment_profiles_admin"
on "public"."customer_payment_profiles"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (public.customers c
     JOIN public.user_stores us ON ((us.customer_id = auth.uid())))
  WHERE ((c.id = customer_payment_profiles.customer_id) AND (c.store_id = us.store_id) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (public.customers c
     JOIN public.user_stores us ON ((us.customer_id = auth.uid())))
  WHERE ((c.id = customer_payment_profiles.customer_id) AND (c.store_id = us.store_id) AND (us.role = 'admin'::text)))));


create policy "customers_store_admin_select"
on "public"."customers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = customers.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "discount_usages_admin_select"
on "public"."discount_usages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (public.discounts d
     JOIN public.user_stores us ON ((us.store_id = d.store_id)))
  WHERE ((d.id = discount_usages.discount_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "discount_usages_admin_write"
on "public"."discount_usages"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (public.discounts d
     JOIN public.user_stores us ON ((us.store_id = d.store_id)))
  WHERE ((d.id = discount_usages.discount_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (public.discounts d
     JOIN public.user_stores us ON ((us.store_id = d.store_id)))
  WHERE ((d.id = discount_usages.discount_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "discounts_admin_select"
on "public"."discounts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = discounts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "discounts_admin_write"
on "public"."discounts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = discounts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = discounts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "notifications_admin_select"
on "public"."notifications"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = notifications.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "notifications_admin_write"
on "public"."notifications"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = notifications.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = notifications.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "order_items_customer_select"
on "public"."order_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.customer_id = auth.uid())))));


create policy "orders_admin_service_delete"
on "public"."orders"
as permissive
for delete
to public
using (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = orders.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "orders_admin_service_update"
on "public"."orders"
as permissive
for update
to public
using (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = orders.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))))
with check (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = orders.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "referrals_admin_select"
on "public"."referrals"
as permissive
for select
to public
using (((referrer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "referrals_admin_write"
on "public"."referrals"
as permissive
for all
to public
using (((referrer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))))
with check (((referrer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "returns_admin_select"
on "public"."returns"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.user_stores us ON ((us.store_id = o.store_id)))
  WHERE ((o.id = returns.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "returns_admin_write"
on "public"."returns"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.user_stores us ON ((us.store_id = o.store_id)))
  WHERE ((o.id = returns.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.user_stores us ON ((us.store_id = o.store_id)))
  WHERE ((o.id = returns.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "reviews_admin_select"
on "public"."reviews"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.user_stores us ON ((us.store_id = o.store_id)))
  WHERE ((o.id = reviews.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "reviews_admin_write"
on "public"."reviews"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.user_stores us ON ((us.store_id = o.store_id)))
  WHERE ((o.id = reviews.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.user_stores us ON ((us.store_id = o.store_id)))
  WHERE ((o.id = reviews.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "store_integrations_service_role_admin_select"
on "public"."store_integrations"
as permissive
for select
to public
using (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = store_integrations.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "store_settings_admin_all"
on "public"."store_settings"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = store_settings.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.store_id = store_settings.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "subscriptions_admin_select"
on "public"."subscriptions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (public.customers c
     JOIN public.user_stores us ON ((us.store_id = c.store_id)))
  WHERE ((c.id = subscriptions.customer_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "subscriptions_admin_write"
on "public"."subscriptions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (public.customers c
     JOIN public.user_stores us ON ((us.store_id = c.store_id)))
  WHERE ((c.id = subscriptions.customer_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (public.customers c
     JOIN public.user_stores us ON ((us.store_id = c.store_id)))
  WHERE ((c.id = subscriptions.customer_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "webflow_connections_admin_select"
on "public"."webflow_connections"
as permissive
for select
to public
using (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "webflow_connections_admin_write"
on "public"."webflow_connections"
as permissive
for all
to public
using (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))))
with check (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));



