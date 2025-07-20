create extension if not exists "wrappers" with schema "extensions";


create table "public"."abandoned_carts" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "store_id" uuid not null,
    "cart_data" jsonb not null,
    "last_interaction" timestamp with time zone not null,
    "emailed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."abandoned_carts" enable row level security;

create table "public"."affiliate_usages" (
    "id" uuid not null default gen_random_uuid(),
    "affiliate_id" uuid not null,
    "order_id" uuid not null,
    "amount" numeric not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."affiliate_usages" enable row level security;

create table "public"."affiliates" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "code" text not null,
    "commission_rate" numeric not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."affiliates" enable row level security;

create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "table_name" text not null,
    "record_id" uuid not null,
    "action" text not null,
    "changed_by" text not null,
    "changed_at" timestamp with time zone not null default now(),
    "diff" jsonb not null,
    "comment" text
);


alter table "public"."audit_logs" enable row level security;

create table "public"."customer_payment_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "gateway" text not null,
    "profile_id" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."customer_payment_profiles" enable row level security;

create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "auth_provider_id" text,
    "email" text not null,
    "first_name" text,
    "last_name" text,
    "avatar_url" text,
    "full_name" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."customers" enable row level security;

create table "public"."discount_usages" (
    "id" uuid not null default gen_random_uuid(),
    "discount_id" uuid not null,
    "order_id" uuid not null,
    "customer_id" uuid,
    "used_at" timestamp with time zone not null default now()
);


alter table "public"."discount_usages" enable row level security;

create table "public"."discounts" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "code" text not null,
    "type" text not null,
    "value" numeric not null,
    "usage_limit" integer,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."discounts" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "customer_id" uuid,
    "type" text not null,
    "payload" jsonb not null,
    "status" text not null default 'pending'::text,
    "retries" integer not null default 0,
    "scheduled_for" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "sku" text not null,
    "product_name" text not null,
    "quantity" integer not null,
    "unit_price" numeric not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."order_items" enable row level security;

create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "customer_id" uuid,
    "order_number" text not null,
    "order_date" timestamp with time zone not null default now(),
    "total_price" numeric not null,
    "status" text not null,
    "payment_provider" text not null,
    "payment_intent_id" text,
    "paid_at" timestamp with time zone,
    "cart_meta_hash" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."orders" enable row level security;

create table "public"."referrals" (
    "id" uuid not null default gen_random_uuid(),
    "referrer_id" uuid not null,
    "referred_email" text not null,
    "utm_source" text,
    "utm_medium" text,
    "utm_campaign" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."referrals" enable row level security;

create table "public"."returns" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "customer_id" uuid,
    "status" text not null default 'initiated'::text,
    "return_reason" text,
    "initiated_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."returns" enable row level security;

create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "product_id" text not null,
    "order_id" uuid,
    "rating" integer not null,
    "comment" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."reviews" enable row level security;

create table "public"."store_integrations" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "gateway" text not null,
    "api_key" text not null,
    "settings" jsonb not null default '{}'::jsonb,
    "sandbox" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."store_integrations" enable row level security;

create table "public"."store_settings" (
    "id" uuid not null default gen_random_uuid(),
    "store_id" uuid not null,
    "settings" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."store_settings" enable row level security;

create table "public"."stores" (
    "id" uuid not null default gen_random_uuid(),
    "store_name" text not null,
    "store_domain" text not null,
    "live_domain" text,
    "prefix" text not null default 'ORD'::text,
    "order_sequence" integer not null default 0,
    "plan" text not null default 'free'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "owner_customer_id" uuid
);


alter table "public"."stores" enable row level security;

create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "gateway" text not null,
    "gateway_subscription_id" text not null,
    "plan" text not null,
    "status" text not null,
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."subscriptions" enable row level security;

create table "public"."user_stores" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "store_id" uuid not null,
    "role" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_stores" enable row level security;

create table "public"."webflow_connections" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "site_id" text not null,
    "access_token" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."webflow_connections" enable row level security;

CREATE UNIQUE INDEX abandoned_carts_pkey ON public.abandoned_carts USING btree (id);

CREATE UNIQUE INDEX affiliate_usages_pkey ON public.affiliate_usages USING btree (id);

CREATE UNIQUE INDEX affiliates_code_key ON public.affiliates USING btree (code);

CREATE UNIQUE INDEX affiliates_pkey ON public.affiliates USING btree (id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX customer_payment_profiles_customer_id_gateway_key ON public.customer_payment_profiles USING btree (customer_id, gateway);

CREATE UNIQUE INDEX customer_payment_profiles_pkey ON public.customer_payment_profiles USING btree (id);

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX discount_usages_pkey ON public.discount_usages USING btree (id);

CREATE UNIQUE INDEX discounts_code_key ON public.discounts USING btree (code);

CREATE UNIQUE INDEX discounts_pkey ON public.discounts USING btree (id);

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);

CREATE INDEX idx_orders_store_id ON public.orders USING btree (store_id);

CREATE INDEX idx_user_stores_customer ON public.user_stores USING btree (customer_id);

CREATE INDEX idx_user_stores_store ON public.user_stores USING btree (store_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX orders_payment_intent_id_key ON public.orders USING btree (payment_intent_id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX referrals_pkey ON public.referrals USING btree (id);

CREATE UNIQUE INDEX returns_pkey ON public.returns USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX store_integrations_pkey ON public.store_integrations USING btree (id);

CREATE UNIQUE INDEX store_settings_pkey ON public.store_settings USING btree (id);

CREATE UNIQUE INDEX store_settings_store_id_key ON public.store_settings USING btree (store_id);

CREATE UNIQUE INDEX stores_pkey ON public.stores USING btree (id);

CREATE UNIQUE INDEX stores_store_domain_key ON public.stores USING btree (store_domain);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX user_stores_pkey ON public.user_stores USING btree (id);

CREATE UNIQUE INDEX webflow_connections_pkey ON public.webflow_connections USING btree (id);

alter table "public"."abandoned_carts" add constraint "abandoned_carts_pkey" PRIMARY KEY using index "abandoned_carts_pkey";

alter table "public"."affiliate_usages" add constraint "affiliate_usages_pkey" PRIMARY KEY using index "affiliate_usages_pkey";

alter table "public"."affiliates" add constraint "affiliates_pkey" PRIMARY KEY using index "affiliates_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."customer_payment_profiles" add constraint "customer_payment_profiles_pkey" PRIMARY KEY using index "customer_payment_profiles_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."discount_usages" add constraint "discount_usages_pkey" PRIMARY KEY using index "discount_usages_pkey";

alter table "public"."discounts" add constraint "discounts_pkey" PRIMARY KEY using index "discounts_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."referrals" add constraint "referrals_pkey" PRIMARY KEY using index "referrals_pkey";

alter table "public"."returns" add constraint "returns_pkey" PRIMARY KEY using index "returns_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."store_integrations" add constraint "store_integrations_pkey" PRIMARY KEY using index "store_integrations_pkey";

alter table "public"."store_settings" add constraint "store_settings_pkey" PRIMARY KEY using index "store_settings_pkey";

alter table "public"."stores" add constraint "stores_pkey" PRIMARY KEY using index "stores_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."user_stores" add constraint "user_stores_pkey" PRIMARY KEY using index "user_stores_pkey";

alter table "public"."webflow_connections" add constraint "webflow_connections_pkey" PRIMARY KEY using index "webflow_connections_pkey";

alter table "public"."abandoned_carts" add constraint "abandoned_carts_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."abandoned_carts" validate constraint "abandoned_carts_customer_id_fkey";

alter table "public"."abandoned_carts" add constraint "abandoned_carts_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."abandoned_carts" validate constraint "abandoned_carts_store_id_fkey";

alter table "public"."affiliate_usages" add constraint "affiliate_usages_affiliate_id_fkey" FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) not valid;

alter table "public"."affiliate_usages" validate constraint "affiliate_usages_affiliate_id_fkey";

alter table "public"."affiliate_usages" add constraint "affiliate_usages_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."affiliate_usages" validate constraint "affiliate_usages_order_id_fkey";

alter table "public"."affiliates" add constraint "affiliates_code_key" UNIQUE using index "affiliates_code_key";

alter table "public"."affiliates" add constraint "affiliates_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."affiliates" validate constraint "affiliates_store_id_fkey";

alter table "public"."customer_payment_profiles" add constraint "customer_payment_profiles_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."customer_payment_profiles" validate constraint "customer_payment_profiles_customer_id_fkey";

alter table "public"."customer_payment_profiles" add constraint "customer_payment_profiles_customer_id_gateway_key" UNIQUE using index "customer_payment_profiles_customer_id_gateway_key";

alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key";

alter table "public"."customers" add constraint "customers_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."customers" validate constraint "customers_store_id_fkey";

alter table "public"."discount_usages" add constraint "discount_usages_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."discount_usages" validate constraint "discount_usages_customer_id_fkey";

alter table "public"."discount_usages" add constraint "discount_usages_discount_id_fkey" FOREIGN KEY (discount_id) REFERENCES discounts(id) not valid;

alter table "public"."discount_usages" validate constraint "discount_usages_discount_id_fkey";

alter table "public"."discount_usages" add constraint "discount_usages_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."discount_usages" validate constraint "discount_usages_order_id_fkey";

alter table "public"."discounts" add constraint "discounts_code_key" UNIQUE using index "discounts_code_key";

alter table "public"."discounts" add constraint "discounts_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."discounts" validate constraint "discounts_store_id_fkey";

alter table "public"."notifications" add constraint "notifications_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."notifications" validate constraint "notifications_customer_id_fkey";

alter table "public"."notifications" add constraint "notifications_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."notifications" validate constraint "notifications_store_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."orders" validate constraint "orders_customer_id_fkey";

alter table "public"."orders" add constraint "orders_payment_intent_id_key" UNIQUE using index "orders_payment_intent_id_key";

alter table "public"."orders" add constraint "orders_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."orders" validate constraint "orders_store_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES customers(id) not valid;

alter table "public"."referrals" validate constraint "referrals_referrer_id_fkey";

alter table "public"."returns" add constraint "returns_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."returns" validate constraint "returns_customer_id_fkey";

alter table "public"."returns" add constraint "returns_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."returns" validate constraint "returns_order_id_fkey";

alter table "public"."reviews" add constraint "reviews_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."reviews" validate constraint "reviews_customer_id_fkey";

alter table "public"."reviews" add constraint "reviews_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) not valid;

alter table "public"."reviews" validate constraint "reviews_order_id_fkey";

alter table "public"."store_integrations" add constraint "store_integrations_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."store_integrations" validate constraint "store_integrations_store_id_fkey";

alter table "public"."store_settings" add constraint "store_settings_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."store_settings" validate constraint "store_settings_store_id_fkey";

alter table "public"."store_settings" add constraint "store_settings_store_id_key" UNIQUE using index "store_settings_store_id_key";

alter table "public"."stores" add constraint "stores_owner_customer_id_fkey" FOREIGN KEY (owner_customer_id) REFERENCES customers(id) not valid;

alter table "public"."stores" validate constraint "stores_owner_customer_id_fkey";

alter table "public"."stores" add constraint "stores_store_domain_key" UNIQUE using index "stores_store_domain_key";

alter table "public"."subscriptions" add constraint "subscriptions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_customer_id_fkey";

alter table "public"."user_stores" add constraint "user_stores_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."user_stores" validate constraint "user_stores_customer_id_fkey";

alter table "public"."user_stores" add constraint "user_stores_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."user_stores" validate constraint "user_stores_store_id_fkey";

alter table "public"."webflow_connections" add constraint "webflow_connections_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."webflow_connections" validate constraint "webflow_connections_customer_id_fkey";

set check_function_bodies = off;

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

grant select on table "public"."abandoned_carts" to "anon";

grant select on table "public"."affiliate_usages" to "anon";

grant select on table "public"."affiliates" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant select on table "public"."customer_payment_profiles" to "anon";

grant select on table "public"."customers" to "anon";

grant select on table "public"."discount_usages" to "anon";

grant select on table "public"."discounts" to "anon";

grant select on table "public"."notifications" to "anon";

grant select on table "public"."order_items" to "anon";

grant select on table "public"."orders" to "anon";

grant select on table "public"."referrals" to "anon";

grant select on table "public"."returns" to "anon";

grant select on table "public"."reviews" to "anon";

grant select on table "public"."store_integrations" to "anon";


grant select on table "public"."stores" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant select on table "public"."user_stores" to "anon";

grant select on table "public"."webflow_connections" to "anon";

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


create policy "customers_self_all"
on "public"."customers"
as permissive
for all
to public
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "customers_store_admin_select"
on "public"."customers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = customers.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text)))));


create policy "order_items_customer_select"
on "public"."order_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND (o.customer_id = auth.uid())))));


create policy "orders_customer_all"
on "public"."orders"
as permissive
for all
to public
using ((customer_id = auth.uid()))
with check ((customer_id = auth.uid()));


create policy "store_integrations_service_role_admin_select"
on "public"."store_integrations"
as permissive
for select
to public
using (((auth.role() = 'service_role') OR (EXISTS ( SELECT 1
   FROM user_stores us
  WHERE ((us.store_id = store_integrations.store_id) AND (us.customer_id = auth.uid()) AND (us.role = 'admin'::text))))));


create policy "stores_admin_access"
on "public"."stores"
as permissive
for all
to public
using ((owner_customer_id = auth.uid()))
with check ((owner_customer_id = auth.uid()));


create policy "user_stores_self_all"
on "public"."user_stores"
as permissive
for all
to public
using ((customer_id = auth.uid()))
with check ((customer_id = auth.uid()));


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

