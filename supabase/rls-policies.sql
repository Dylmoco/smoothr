drop policy if exists "customer_payment_profiles_admin" on "public"."customer_payment_profiles";
create policy "customer_payment_profiles_admin"
on "public"."customer_payment_profiles"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (customers c
     JOIN user_stores us ON ((us.customer_id = auth.uid())))
  WHERE ((c.id = customer_payment_profiles.customer_id) AND (c.store_id = us.store_id) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM (customers c
     JOIN user_stores us ON ((us.customer_id = auth.uid())))
  WHERE ((c.id = customer_payment_profiles.customer_id) AND (c.store_id = us.store_id) AND (us.role = 'admin'::text)))));


drop policy if exists "customers_self_all" on "public"."customers";
create policy "customers_self_all"
on "public"."customers"
as permissive
for all
to public
using ((id = auth.uid()))
with check ((id = auth.uid()));


drop policy if exists "customers_store_admin_select" on "public"."customers";
create policy "customers_store_admin_select"
on "public"."customers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = customers.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "order_items_customer_select" on "public"."order_items";
create policy "order_items_customer_select"
on "public"."order_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND (o.customer_id = auth.uid())))));


drop policy if exists "orders_customer_select_insert" on "public"."orders";
create policy "orders_customer_select_insert"
on "public"."orders"
as permissive
for select, insert
to public
using ((customer_id = auth.uid()))
with check ((customer_id = auth.uid()));


drop policy if exists "orders_customer_unpaid_modify" on "public"."orders";
create policy "orders_customer_unpaid_modify"
on "public"."orders"
as permissive
for update, delete
to public
using (((customer_id = auth.uid()) AND (paid_at IS NULL)))
with check (((customer_id = auth.uid()) AND (paid_at IS NULL)));


drop policy if exists "orders_admin_service_modify" on "public"."orders";
create policy "orders_admin_service_modify"
on "public"."orders"
as permissive
for update, delete
to public
using (((auth.role() = 'service_role') OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = orders.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))))
with check (((auth.role() = 'service_role') OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = orders.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


drop policy if exists "store_integrations_service_role_admin_select" on "public"."store_integrations";
create policy "store_integrations_service_role_admin_select"
on "public"."store_integrations"
as permissive
for select
to public
using (((auth.role() = 'service_role') OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = store_integrations.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


drop policy if exists "stores_admin_access" on "public"."stores";
create policy "stores_admin_access"
on "public"."stores"
as permissive
for all
to public
using ((owner_customer_id = auth.uid()))
with check ((owner_customer_id = auth.uid()));


drop policy if exists "user_stores_self_all" on "public"."user_stores";
create policy "user_stores_self_all"
on "public"."user_stores"
as permissive
for all
to public
using ((customer_id = auth.uid()))
with check ((customer_id = auth.uid()));


drop policy if exists "store_settings_admin_all" on "public"."store_settings";
create policy "store_settings_admin_all"
on "public"."store_settings"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = store_settings.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = store_settings.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "abandoned_carts_admin_select" on "public"."abandoned_carts";
create policy "abandoned_carts_admin_select"
on "public"."abandoned_carts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = abandoned_carts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "abandoned_carts_admin_write" on "public"."abandoned_carts";
create policy "abandoned_carts_admin_write"
on "public"."abandoned_carts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = abandoned_carts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = abandoned_carts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "affiliate_usages_admin_select" on "public"."affiliate_usages";
create policy "affiliate_usages_admin_select"
on "public"."affiliate_usages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM affiliates a
     JOIN user_stores us ON ((us.store_id = a.store_id))
  WHERE ((a.id = affiliate_usages.affiliate_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "affiliate_usages_admin_write" on "public"."affiliate_usages";
create policy "affiliate_usages_admin_write"
on "public"."affiliate_usages"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM affiliates a
     JOIN user_stores us ON ((us.store_id = a.store_id))
  WHERE ((a.id = affiliate_usages.affiliate_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM affiliates a
     JOIN user_stores us ON ((us.store_id = a.store_id))
  WHERE ((a.id = affiliate_usages.affiliate_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "affiliates_admin_select" on "public"."affiliates";
create policy "affiliates_admin_select"
on "public"."affiliates"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = affiliates.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "affiliates_admin_write" on "public"."affiliates";
create policy "affiliates_admin_write"
on "public"."affiliates"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = affiliates.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = affiliates.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "audit_logs_admin_select" on "public"."audit_logs";
create policy "audit_logs_admin_select"
on "public"."audit_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "audit_logs_admin_write" on "public"."audit_logs";
create policy "audit_logs_admin_write"
on "public"."audit_logs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "discount_usages_admin_select" on "public"."discount_usages";
create policy "discount_usages_admin_select"
on "public"."discount_usages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM discounts d
     JOIN user_stores us ON ((us.store_id = d.store_id))
  WHERE ((d.id = discount_usages.discount_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "discount_usages_admin_write" on "public"."discount_usages";
create policy "discount_usages_admin_write"
on "public"."discount_usages"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM discounts d
     JOIN user_stores us ON ((us.store_id = d.store_id))
  WHERE ((d.id = discount_usages.discount_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM discounts d
     JOIN user_stores us ON ((us.store_id = d.store_id))
  WHERE ((d.id = discount_usages.discount_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "discounts_admin_select" on "public"."discounts";
create policy "discounts_admin_select"
on "public"."discounts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = discounts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "discounts_admin_write" on "public"."discounts";
create policy "discounts_admin_write"
on "public"."discounts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = discounts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = discounts.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "notifications_admin_select" on "public"."notifications";
create policy "notifications_admin_select"
on "public"."notifications"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = notifications.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "notifications_admin_write" on "public"."notifications";
create policy "notifications_admin_write"
on "public"."notifications"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = notifications.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = notifications.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "referrals_admin_select" on "public"."referrals";
create policy "referrals_admin_select"
on "public"."referrals"
as permissive
for select
to public
using (((referrer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


drop policy if exists "referrals_admin_write" on "public"."referrals";
create policy "referrals_admin_write"
on "public"."referrals"
as permissive
for all
to public
using (((referrer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))) )
with check (((referrer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


drop policy if exists "returns_admin_select" on "public"."returns";
create policy "returns_admin_select"
on "public"."returns"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM orders o
     JOIN user_stores us ON ((us.store_id = o.store_id))
  WHERE ((o.id = returns.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "returns_admin_write" on "public"."returns";
create policy "returns_admin_write"
on "public"."returns"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM orders o
     JOIN user_stores us ON ((us.store_id = o.store_id))
  WHERE ((o.id = returns.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM orders o
     JOIN user_stores us ON ((us.store_id = o.store_id))
  WHERE ((o.id = returns.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "reviews_admin_select" on "public"."reviews";
create policy "reviews_admin_select"
on "public"."reviews"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM orders o
     JOIN user_stores us ON ((us.store_id = o.store_id))
  WHERE ((o.id = reviews.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "reviews_admin_write" on "public"."reviews";
create policy "reviews_admin_write"
on "public"."reviews"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM orders o
     JOIN user_stores us ON ((us.store_id = o.store_id))
  WHERE ((o.id = reviews.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM orders o
     JOIN user_stores us ON ((us.store_id = o.store_id))
  WHERE ((o.id = reviews.order_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "subscriptions_admin_select" on "public"."subscriptions";
create policy "subscriptions_admin_select"
on "public"."subscriptions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM customers c
     JOIN user_stores us ON ((us.store_id = c.store_id))
  WHERE ((c.id = subscriptions.customer_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


drop policy if exists "subscriptions_admin_write" on "public"."subscriptions";
create policy "subscriptions_admin_write"
on "public"."subscriptions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM customers c
     JOIN user_stores us ON ((us.store_id = c.store_id))
  WHERE ((c.id = subscriptions.customer_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM customers c
     JOIN user_stores us ON ((us.store_id = c.store_id))
  WHERE ((c.id = subscriptions.customer_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))));


drop policy if exists "webflow_connections_admin_select" on "public"."webflow_connections";
create policy "webflow_connections_admin_select"
on "public"."webflow_connections"
as permissive
for select
to public
using (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


drop policy if exists "webflow_connections_admin_write" on "public"."webflow_connections";
create policy "webflow_connections_admin_write"
on "public"."webflow_connections"
as permissive
for all
to public
using (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))) )
with check (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


