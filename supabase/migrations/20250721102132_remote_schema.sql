

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_order_number"("p_store_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_order_number"("p_store_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_tokenization_key"("input_store_id" "uuid", "input_gateway" "text") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    settings ->> 'tokenization_key'
  from store_integrations
  where store_id = input_store_id
    and gateway = input_gateway
    and sandbox = false
  limit 1;
$$;


ALTER FUNCTION "public"."get_public_tokenization_key"("input_store_id" "uuid", "input_gateway" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."abandoned_carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "cart_data" "jsonb" NOT NULL,
    "last_interaction" timestamp with time zone NOT NULL,
    "emailed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."abandoned_carts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."abandoned_carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."affiliate_usages" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "commission_rate" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."affiliates" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "changed_by" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "diff" "jsonb" NOT NULL,
    "comment" "text"
);

ALTER TABLE ONLY "public"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_payment_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "gateway" "text" NOT NULL,
    "profile_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."customer_payment_profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_payment_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "auth_provider_id" "text",
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."customers" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discount_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "discount_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."discount_usages" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."discount_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "usage_limit" integer,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."discounts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "retries" integer DEFAULT 0 NOT NULL,
    "scheduled_for" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."notifications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "sku" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."order_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "order_number" "text" NOT NULL,
    "order_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_price" numeric NOT NULL,
    "status" "text" NOT NULL,
    "payment_provider" "text" NOT NULL,
    "payment_intent_id" "text",
    "paid_at" timestamp with time zone,
    "cart_meta_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."orders" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "gateway" "text" NOT NULL,
    "api_key" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sandbox" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."store_integrations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_integrations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_store_integration_credentials" AS
 SELECT "store_integrations"."store_id",
    COALESCE("store_integrations"."gateway", ("store_integrations"."settings" ->> 'gateway'::"text")) AS "gateway",
    ("store_integrations"."settings" ->> 'tokenization_key'::"text") AS "tokenization_key"
   FROM "public"."store_integrations"
  WHERE ("store_integrations"."sandbox" = false);


ALTER TABLE "public"."public_store_integration_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_store_settings" (
    "store_id" "uuid" NOT NULL,
    "theme" "jsonb",
    "logo" "text",
    "currency" "text",
    "debug" boolean,
    "api_base" "text",
    "platform" "text",
    "rate_source" "text",
    "base_currency" "text",
    "active_payment_gateway" "text"
);


ALTER TABLE "public"."public_store_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_email" "text" NOT NULL,
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."referrals" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "status" "text" DEFAULT 'initiated'::"text" NOT NULL,
    "return_reason" "text",
    "initiated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."returns" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "product_id" "text" NOT NULL,
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."reviews" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."store_settings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_name" "text" NOT NULL,
    "store_domain" "text" NOT NULL,
    "live_domain" "text",
    "prefix" "text" DEFAULT 'ORD'::"text" NOT NULL,
    "order_sequence" integer DEFAULT 0 NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_customer_id" "uuid"
);

ALTER TABLE ONLY "public"."stores" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "gateway" "text" NOT NULL,
    "gateway_subscription_id" "text" NOT NULL,
    "plan" "text" NOT NULL,
    "status" "text" NOT NULL,
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."subscriptions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."user_stores" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webflow_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "site_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."webflow_connections" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."webflow_connections" OWNER TO "postgres";


ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_usages"
    ADD CONSTRAINT "affiliate_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_payment_profiles"
    ADD CONSTRAINT "customer_payment_profiles_customer_id_gateway_key" UNIQUE ("customer_id", "gateway");



ALTER TABLE ONLY "public"."customer_payment_profiles"
    ADD CONSTRAINT "customer_payment_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_payment_intent_id_key" UNIQUE ("payment_intent_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_store_settings"
    ADD CONSTRAINT "public_store_settings_pkey" PRIMARY KEY ("store_id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_integrations"
    ADD CONSTRAINT "store_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_store_id_key" UNIQUE ("store_id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_store_domain_key" UNIQUE ("store_domain");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stores"
    ADD CONSTRAINT "user_stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webflow_connections"
    ADD CONSTRAINT "webflow_connections_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_store_id" ON "public"."orders" USING "btree" ("store_id");



CREATE INDEX "idx_user_stores_customer" ON "public"."user_stores" USING "btree" ("customer_id");



CREATE INDEX "idx_user_stores_store" ON "public"."user_stores" USING "btree" ("store_id");



ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."affiliate_usages"
    ADD CONSTRAINT "affiliate_usages_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id");



ALTER TABLE ONLY "public"."affiliate_usages"
    ADD CONSTRAINT "affiliate_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."customer_payment_profiles"
    ADD CONSTRAINT "customer_payment_profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id");



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."public_store_settings"
    ADD CONSTRAINT "public_store_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."store_integrations"
    ADD CONSTRAINT "store_integrations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_owner_customer_id_fkey" FOREIGN KEY ("owner_customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."user_stores"
    ADD CONSTRAINT "user_stores_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."user_stores"
    ADD CONSTRAINT "user_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."webflow_connections"
    ADD CONSTRAINT "webflow_connections_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE "public"."abandoned_carts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "abandoned_carts_admin_select" ON "public"."abandoned_carts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "abandoned_carts"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "abandoned_carts_admin_write" ON "public"."abandoned_carts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "abandoned_carts"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "abandoned_carts"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."affiliate_usages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliate_usages_admin_select" ON "public"."affiliate_usages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."affiliates" "a"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "a"."store_id")))
  WHERE (("a"."id" = "affiliate_usages"."affiliate_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "affiliate_usages_admin_write" ON "public"."affiliate_usages" USING ((EXISTS ( SELECT 1
   FROM ("public"."affiliates" "a"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "a"."store_id")))
  WHERE (("a"."id" = "affiliate_usages"."affiliate_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."affiliates" "a"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "a"."store_id")))
  WHERE (("a"."id" = "affiliate_usages"."affiliate_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliates_admin_select" ON "public"."affiliates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "affiliates"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "affiliates_admin_write" ON "public"."affiliates" USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "affiliates"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "affiliates"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "anon can select store config" ON "public"."public_store_settings" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_admin_select" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "audit_logs_admin_write" ON "public"."audit_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."customer_payment_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_payment_profiles_admin" ON "public"."customer_payment_profiles" USING ((EXISTS ( SELECT 1
   FROM ("public"."customers" "c"
     JOIN "public"."user_stores" "us" ON (("us"."customer_id" = "auth"."uid"())))
  WHERE (("c"."id" = "customer_payment_profiles"."customer_id") AND ("c"."store_id" = "us"."store_id") AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."customers" "c"
     JOIN "public"."user_stores" "us" ON (("us"."customer_id" = "auth"."uid"())))
  WHERE (("c"."id" = "customer_payment_profiles"."customer_id") AND ("c"."store_id" = "us"."store_id") AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_self_all" ON "public"."customers" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "customers_store_admin_select" ON "public"."customers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "customers"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."discount_usages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discount_usages_admin_select" ON "public"."discount_usages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "discount_usages_admin_write" ON "public"."discount_usages" USING ((EXISTS ( SELECT 1
   FROM ("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."discounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discounts_admin_select" ON "public"."discounts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "discounts"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "discounts_admin_write" ON "public"."discounts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "discounts"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "discounts"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_admin_select" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "notifications"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "notifications_admin_write" ON "public"."notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "notifications"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "notifications"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_customer_select" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."customer_id" = "auth"."uid"())))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_admin_service_delete" ON "public"."orders" FOR DELETE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "orders"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));



CREATE POLICY "orders_admin_service_update" ON "public"."orders" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "orders"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))))) WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "orders"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));



CREATE POLICY "orders_customer_insert" ON "public"."orders" FOR INSERT WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "orders_customer_select" ON "public"."orders" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "orders_customer_unpaid_delete" ON "public"."orders" FOR DELETE USING ((("customer_id" = "auth"."uid"()) AND ("paid_at" IS NULL)));



CREATE POLICY "orders_customer_unpaid_update" ON "public"."orders" FOR UPDATE USING ((("customer_id" = "auth"."uid"()) AND ("paid_at" IS NULL))) WITH CHECK ((("customer_id" = "auth"."uid"()) AND ("paid_at" IS NULL)));



CREATE POLICY "public read" ON "public"."public_store_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public select" ON "public"."public_store_settings" FOR SELECT USING (true);



ALTER TABLE "public"."public_store_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "referrals_admin_select" ON "public"."referrals" FOR SELECT USING ((("referrer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));



CREATE POLICY "referrals_admin_write" ON "public"."referrals" USING ((("referrer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))))) WITH CHECK ((("referrer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."returns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "returns_admin_select" ON "public"."returns" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "o"."store_id")))
  WHERE (("o"."id" = "returns"."order_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "returns_admin_write" ON "public"."returns" USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "o"."store_id")))
  WHERE (("o"."id" = "returns"."order_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "o"."store_id")))
  WHERE (("o"."id" = "returns"."order_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_admin_select" ON "public"."reviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "o"."store_id")))
  WHERE (("o"."id" = "reviews"."order_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "reviews_admin_write" ON "public"."reviews" USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "o"."store_id")))
  WHERE (("o"."id" = "reviews"."order_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "o"."store_id")))
  WHERE (("o"."id" = "reviews"."order_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."store_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_integrations_service_role_admin_select" ON "public"."store_integrations" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_integrations"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."store_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_settings_admin_all" ON "public"."store_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_settings"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_settings"."store_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stores_admin_access" ON "public"."stores" USING (("owner_customer_id" = "auth"."uid"())) WITH CHECK (("owner_customer_id" = "auth"."uid"()));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_admin_select" ON "public"."subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."customers" "c"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "c"."store_id")))
  WHERE (("c"."id" = "subscriptions"."customer_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



CREATE POLICY "subscriptions_admin_write" ON "public"."subscriptions" USING ((EXISTS ( SELECT 1
   FROM ("public"."customers" "c"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "c"."store_id")))
  WHERE (("c"."id" = "subscriptions"."customer_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."customers" "c"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "c"."store_id")))
  WHERE (("c"."id" = "subscriptions"."customer_id") AND ("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))));



ALTER TABLE "public"."user_stores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_stores_self_all" ON "public"."user_stores" USING (("customer_id" = "auth"."uid"())) WITH CHECK (("customer_id" = "auth"."uid"()));



ALTER TABLE "public"."webflow_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "webflow_connections_admin_select" ON "public"."webflow_connections" FOR SELECT USING ((("customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));



CREATE POLICY "webflow_connections_admin_write" ON "public"."webflow_connections" USING ((("customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text")))))) WITH CHECK ((("customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."customer_id" = "auth"."uid"()) AND ("us"."role" = 'admin'::"text"))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
































































































































































































































































































GRANT ALL ON FUNCTION "public"."get_public_tokenization_key"("input_store_id" "uuid", "input_gateway" "text") TO "anon";





















GRANT SELECT ON TABLE "public"."abandoned_carts" TO "anon";



GRANT SELECT ON TABLE "public"."affiliate_usages" TO "anon";



GRANT SELECT ON TABLE "public"."affiliates" TO "anon";



GRANT SELECT ON TABLE "public"."audit_logs" TO "anon";



GRANT SELECT ON TABLE "public"."customer_payment_profiles" TO "anon";



GRANT SELECT ON TABLE "public"."customers" TO "anon";



GRANT SELECT ON TABLE "public"."discount_usages" TO "anon";



GRANT SELECT ON TABLE "public"."discounts" TO "anon";



GRANT SELECT ON TABLE "public"."notifications" TO "anon";



GRANT SELECT ON TABLE "public"."order_items" TO "anon";



GRANT SELECT ON TABLE "public"."orders" TO "anon";



GRANT SELECT ON TABLE "public"."store_integrations" TO "anon";



GRANT SELECT ON TABLE "public"."public_store_integration_credentials" TO "anon";



GRANT SELECT ON TABLE "public"."public_store_settings" TO "anon";
GRANT SELECT ON TABLE "public"."public_store_settings" TO "authenticated";



GRANT SELECT ON TABLE "public"."referrals" TO "anon";



GRANT SELECT ON TABLE "public"."returns" TO "anon";



GRANT SELECT ON TABLE "public"."reviews" TO "anon";



GRANT SELECT ON TABLE "public"."store_settings" TO "anon";
GRANT SELECT ON TABLE "public"."store_settings" TO "authenticated";



GRANT SELECT ON TABLE "public"."stores" TO "anon";



GRANT SELECT ON TABLE "public"."subscriptions" TO "anon";



GRANT SELECT ON TABLE "public"."user_stores" TO "anon";



GRANT SELECT ON TABLE "public"."webflow_connections" TO "anon";

































RESET ALL;
