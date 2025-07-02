


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."store_plan" AS ENUM (
    'free',
    'starter',
    'pro',
    'studio'
);


ALTER TYPE "public"."store_plan" OWNER TO "postgres";


CREATE TYPE "public"."store_plan_enum" AS ENUM (
    'free',
    'starter',
    'pro',
    'studio'
);


ALTER TYPE "public"."store_plan_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_set_plan_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.plan = 'free' THEN
    NEW.max_users  := 1;
    NEW.max_stores := 1;
  ELSIF NEW.plan = 'starter' THEN
    NEW.max_users  := 1;
    NEW.max_stores := 1;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_users  := 3;
    NEW.max_stores := 3;
  ELSIF NEW.plan = 'studio' THEN
    NEW.max_users  := 10;
    NEW.max_stores := 5;
  ELSE
    RAISE EXCEPTION 'Unrecognized plan: %', NEW.plan;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_set_plan_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."abandoned_carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "store_id" "uuid" NOT NULL,
    "cart_data" "jsonb" NOT NULL,
    "last_interaction" timestamp with time zone NOT NULL,
    "emailed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."abandoned_carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliate_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "commission_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."affiliate_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affiliates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "affiliate_code" "text" NOT NULL,
    "commission_rate" numeric NOT NULL,
    "payout_schedule" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."affiliates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "changed_by" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "diff" "jsonb" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discount_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "discount_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discount_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "base_currency" character(3) NOT NULL,
    "target_currency" character(3) NOT NULL,
    "rate" numeric NOT NULL,
    "fetched_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "retries" integer DEFAULT 0 NOT NULL,
    "scheduled_for" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "sku" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_number" "text" NOT NULL,
    "order_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_price" numeric NOT NULL,
    "status" "text" NOT NULL,
    "customer_id" "text",
    "customer_email" "text",
    "store_id" "uuid",
    "raw_data" "jsonb",
    "tracking_number" "text",
    "label_url" "text",
    "problem_flag" boolean DEFAULT false,
    "flag_reason" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payment_provider" "text",
    "paid_at" timestamp without time zone,
    "payment_intent_id" "text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_gateways" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "gateway" "text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_gateways" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "full_name" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid",
    "referred_email" "text",
    "referral_code" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "product_id" "text",
    "rating" integer,
    "text" "text",
    "order_id" "uuid"
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'Verified customer reviews';



CREATE TABLE IF NOT EXISTS "public"."store_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "site_url" "text" NOT NULL,
    "api_key" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "store_integrations_platform_check" CHECK (("platform" = ANY (ARRAY['webflow'::"text", 'framer'::"text", 'custom'::"text", 'shopify'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."store_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."store_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "store_name" "text" NOT NULL,
    "store_domain" "text" NOT NULL,
    "live_domain" "text",
    "login_redirect_url" "text" DEFAULT ''::"text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "branding_logo" "text",
    "branding_color" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "logout_redirect_url" "text",
    "platform" "text",
    "full_name" "text",
    "owner_email" "text",
    "max_users" integer DEFAULT 1 NOT NULL,
    "max_stores" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan" "text",
    "status" "text",
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_stores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_provider_id" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "clerk_id" "text",
    "stripe_customer_id" "text",
    "subscription_status" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webflow_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "site_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."webflow_connections" OWNER TO "postgres";


ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_usages"
    ADD CONSTRAINT "affiliate_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_affiliate_code_key" UNIQUE ("affiliate_code");



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_gateways"
    ADD CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stores"
    ADD CONSTRAINT "user_stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_provider_id_key" UNIQUE ("auth_provider_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."webflow_connections"
    ADD CONSTRAINT "webflow_connections_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_abandoned_carts_customer_id" ON "public"."abandoned_carts" USING "btree" ("customer_id");



CREATE INDEX "idx_abandoned_carts_store_id" ON "public"."abandoned_carts" USING "btree" ("store_id");



CREATE UNIQUE INDEX "idx_exchange_rates_unique" ON "public"."exchange_rates" USING "btree" ("base_currency", "target_currency");



CREATE INDEX "idx_notifications_store_id" ON "public"."notifications" USING "btree" ("store_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_order_date" ON "public"."orders" USING "btree" ("order_date");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_store_id" ON "public"."orders" USING "btree" ("store_id");



CREATE INDEX "idx_subscriptions_customer" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uidx_user_stores_user_store" ON "public"."user_stores" USING "btree" ("user_id", "store_id");



CREATE UNIQUE INDEX "unique_live_domain" ON "public"."stores" USING "btree" ("live_domain");



CREATE UNIQUE INDEX "unique_webflow_domain" ON "public"."stores" USING "btree" ("store_domain");



CREATE OR REPLACE TRIGGER "abandoned_carts_set_updated_at" BEFORE UPDATE ON "public"."abandoned_carts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "affiliates_set_updated_at" BEFORE UPDATE ON "public"."affiliates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "discounts_set_updated_at" BEFORE UPDATE ON "public"."discounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "exchange_rates_set_updated_at" BEFORE UPDATE ON "public"."exchange_rates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "notifications_set_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "order_items_set_updated_at" BEFORE UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "orders_set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "returns_set_updated_at" BEFORE UPDATE ON "public"."returns" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "store_integrations_set_updated_at" BEFORE UPDATE ON "public"."store_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "store_settings_set_updated_at" BEFORE UPDATE ON "public"."store_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "stores_plan_limits" BEFORE INSERT OR UPDATE ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_plan_limits"();



CREATE OR REPLACE TRIGGER "stores_set_updated_at" BEFORE UPDATE ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_set_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_orders_updated" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_stores_updated" BEFORE UPDATE ON "public"."user_stores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_updated_at" BEFORE UPDATE ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "user_stores_set_updated_at" BEFORE UPDATE ON "public"."user_stores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_usages"
    ADD CONSTRAINT "affiliate_usages_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_usages"
    ADD CONSTRAINT "affiliate_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discount_usages"
    ADD CONSTRAINT "discount_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "fk_reviews_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_integrations"
    ADD CONSTRAINT "store_integrations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stores"
    ADD CONSTRAINT "user_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stores"
    ADD CONSTRAINT "user_stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."payment_gateways"
    ADD CONSTRAINT "payment_gateways_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webflow_connections"
    ADD CONSTRAINT "webflow_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow logged-in users to insert reviews" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow read access" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Customers can insert their own orders" ON "public"."orders" FOR INSERT WITH CHECK (("customer_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Customers can read their own orders" ON "public"."orders" FOR SELECT USING (("customer_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Customers can update their own orders" ON "public"."orders" FOR UPDATE USING (("customer_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Customers can view their own orders" ON "public"."orders" FOR SELECT USING (("customer_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Store owners can insert store" ON "public"."stores" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Store owners can read their store" ON "public"."stores" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Store owners can update their store" ON "public"."stores" FOR UPDATE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own data" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can select own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can select their own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own data" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."abandoned_carts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "abandoned_carts_insert_policy" ON "public"."abandoned_carts" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR ("customer_id" = "auth"."uid"())));



CREATE POLICY "abandoned_carts_select_customer" ON "public"."abandoned_carts" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "abandoned_carts_select_staff" ON "public"."abandoned_carts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "abandoned_carts"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "abandoned_carts_update_policy" ON "public"."abandoned_carts" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR ("customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "abandoned_carts"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])))))));



ALTER TABLE "public"."affiliate_usages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliate_usages_insert_policy" ON "public"."affiliate_usages" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."affiliates" "a"
     JOIN "public"."stores" "s" ON (("s"."id" = "a"."store_id")))
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "s"."id")))
  WHERE (("a"."id" = "affiliate_usages"."affiliate_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "affiliate_usages_select" ON "public"."affiliate_usages" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."affiliates" "a"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "a"."store_id")))
     JOIN "public"."stores" "s" ON (("s"."id" = "a"."store_id")))
  WHERE (("a"."id" = "affiliate_usages"."affiliate_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "affiliate_usages_select_policy" ON "public"."affiliate_usages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."affiliates" "a"
     JOIN "public"."stores" "s" ON (("s"."id" = "a"."store_id")))
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "s"."id")))
  WHERE (("a"."id" = "affiliate_usages"."affiliate_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"]))))));



ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "affiliates_delete_policy" ON "public"."affiliates" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "affiliates"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"]))))));



CREATE POLICY "affiliates_insert_policy" ON "public"."affiliates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "us"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"]))))));



CREATE POLICY "affiliates_select" ON "public"."affiliates" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "affiliates"."store_id") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "affiliates_select_policy" ON "public"."affiliates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "affiliates"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"]))))));



CREATE POLICY "affiliates_update_policy" ON "public"."affiliates" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "affiliates"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" = ANY (ARRAY['pro'::"text", 'studio'::"text"]))))));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_insert_policy" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "audit_logs_select_policy" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."stores" "s"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "s"."id")))
  WHERE (("s"."plan" = 'studio'::"text") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = 'owner'::"text")))));



ALTER TABLE "public"."discount_usages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discount_usages_delete" ON "public"."discount_usages" FOR DELETE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = 'owner'::"text") AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discount_usages_insert" ON "public"."discount_usages" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discount_usages_insert_policy" ON "public"."discount_usages" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "s"."id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" <> 'free'::"text"))))));



CREATE POLICY "discount_usages_select" ON "public"."discount_usages" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discount_usages_select_policy" ON "public"."discount_usages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "s"."id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" <> 'free'::"text")))));



CREATE POLICY "discount_usages_update" ON "public"."discount_usages" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = 'owner'::"text") AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"]))))))) WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM (("public"."discounts" "d"
     JOIN "public"."user_stores" "us" ON (("us"."store_id" = "d"."store_id")))
     JOIN "public"."stores" "s" ON (("s"."id" = "d"."store_id")))
  WHERE (("d"."id" = "discount_usages"."discount_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = 'owner'::"text") AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



ALTER TABLE "public"."discounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discounts_delete" ON "public"."discounts" FOR DELETE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "discounts"."store_id") AND ("us"."role" = 'owner'::"text") AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discounts_delete_policy" ON "public"."discounts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "discounts"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" <> 'free'::"text")))));



CREATE POLICY "discounts_insert" ON "public"."discounts" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "us"."store_id") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discounts_insert_policy" ON "public"."discounts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "us"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" <> 'free'::"text")))));



CREATE POLICY "discounts_manage" ON "public"."discounts" USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "discounts"."store_id") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"]))))))) WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us2"
     JOIN "public"."stores" "s2" ON (("s2"."id" = "us2"."store_id")))
  WHERE (("us2"."user_id" = "auth"."uid"()) AND ("us2"."store_id" = "discounts"."store_id") AND ("us2"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s2"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discounts_select" ON "public"."discounts" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "discounts"."store_id") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"])) AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discounts_select_policy" ON "public"."discounts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "discounts"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" <> 'free'::"text")))));



CREATE POLICY "discounts_update" ON "public"."discounts" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "discounts"."store_id") AND ("us"."role" = 'owner'::"text") AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"]))))))) WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."store_id" = "us"."store_id") AND ("us"."role" = 'owner'::"text") AND ("s"."plan" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'studio'::"text"])))))));



CREATE POLICY "discounts_update_policy" ON "public"."discounts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."id" = "us"."store_id")))
  WHERE (("s"."id" = "discounts"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])) AND ("s"."plan" <> 'free'::"text")))));



ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exchange_rates_modify_service" ON "public"."exchange_rates" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "exchange_rates_select_public" ON "public"."exchange_rates" FOR SELECT USING (true);



CREATE POLICY "exchange_rates_update_service" ON "public"."exchange_rates" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_insert_policy" ON "public"."notifications" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "us"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])))))));



CREATE POLICY "notifications_select_customer" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_select_staff" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "notifications"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



CREATE POLICY "notifications_update_policy" ON "public"."notifications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "notifications"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_insert_policy" ON "public"."order_items" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "us"."store_id")))
  WHERE (("o"."id" = "order_items"."order_id") AND (("us"."user_id")::"text" = ("auth"."uid"())::"text") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])))))));



CREATE POLICY "order_items_select_policy" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND (("o"."customer_id" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
           FROM "public"."user_stores" "us"
          WHERE (("us"."store_id" = "o"."store_id") AND (("us"."user_id")::"text" = ("auth"."uid"())::"text") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))))))));



CREATE POLICY "order_items_update_policy" ON "public"."order_items" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "us"."store_id")))
  WHERE (("o"."id" = "order_items"."order_id") AND (("us"."user_id")::"text" = ("auth"."uid"())::"text") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])))))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_can_delete" ON "public"."orders" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores"
  WHERE (("user_stores"."user_id" = "auth"."uid"()) AND ("user_stores"."store_id" = "orders"."store_id") AND ("user_stores"."role" = 'owner'::"text")))));



CREATE POLICY "orders_can_select" ON "public"."orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores"
  WHERE (("user_stores"."user_id" = "auth"."uid"()) AND ("user_stores"."store_id" = "orders"."store_id") AND ("user_stores"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



CREATE POLICY "orders_delete_owner" ON "public"."orders" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "orders"."store_id") AND (("us"."user_id")::"text" = ("auth"."uid"())::"text") AND ("us"."role" = 'owner'::"text")))));



CREATE POLICY "orders_insert_policy" ON "public"."orders" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR ("customer_id" = ("auth"."uid"())::"text")));



CREATE POLICY "orders_select_customer" ON "public"."orders" FOR SELECT USING (("customer_id" = ("auth"."uid"())::"text"));



CREATE POLICY "orders_select_staff" ON "public"."orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "orders"."store_id") AND (("us"."user_id")::"text" = ("auth"."uid"())::"text") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



CREATE POLICY "orders_update_staff" ON "public"."orders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "orders"."store_id") AND (("us"."user_id")::"text" = ("auth"."uid"())::"text") AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



ALTER TABLE "public"."payment_gateways" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."returns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "returns_insert_policy" ON "public"."returns" FOR INSERT WITH CHECK ((( SELECT "s"."plan"
   FROM ("public"."stores" "s"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "s"."id")))
  WHERE ("o"."id" = "returns"."order_id")) <> 'free'::"text"));



CREATE POLICY "returns_select_customer" ON "public"."returns" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "returns_select_staff" ON "public"."returns" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "us"."store_id")))
  WHERE (("o"."id" = "returns"."order_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "returns_update_staff" ON "public"."returns" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "us"."store_id")))
  WHERE (("o"."id" = "returns"."order_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_insert_policy" ON "public"."reviews" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "reviews"."order_id") AND ("o"."customer_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "reviews_select_customer" ON "public"."reviews" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "reviews_select_staff" ON "public"."reviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "us"."store_id")))
  WHERE (("o"."id" = "reviews"."order_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



CREATE POLICY "reviews_update_staff" ON "public"."reviews" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."orders" "o" ON (("o"."store_id" = "us"."store_id")))
  WHERE (("o"."id" = "reviews"."order_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."store_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_integrations_delete_policy" ON "public"."store_integrations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_integrations"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "store_integrations_insert_policy" ON "public"."store_integrations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "us"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "store_integrations_select_policy" ON "public"."store_integrations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_integrations"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "store_integrations_update_policy" ON "public"."store_integrations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_integrations"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."store_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_settings_delete_policy" ON "public"."store_settings" FOR DELETE USING (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "store_settings"."store_id"))));



CREATE POLICY "store_settings_insert_policy" ON "public"."store_settings" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "store_settings"."store_id"))));



CREATE POLICY "store_settings_select_policy" ON "public"."store_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "store_settings"."store_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



CREATE POLICY "store_settings_update_policy" ON "public"."store_settings" FOR UPDATE USING (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "store_settings"."store_id"))));



ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stores_delete_owner" ON "public"."stores" FOR DELETE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "stores_insert_service" ON "public"."stores" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "stores_select_public" ON "public"."stores" FOR SELECT USING (("auth"."role"() = 'anon'::"text"));



CREATE POLICY "stores_select_staff" ON "public"."stores" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "stores"."id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'support'::"text"]))))));



CREATE POLICY "stores_update_staff" ON "public"."stores" FOR UPDATE USING ((("auth"."uid"() = "owner_user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."store_id" = "stores"."id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"])))))));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_insert_policy" ON "public"."subscriptions" FOR INSERT WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_stores" "us"
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."role" = 'owner'::"text"))))));



CREATE POLICY "subscriptions_select_owner" ON "public"."subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "subscriptions_select_staff" ON "public"."subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_stores" "us"
     JOIN "public"."stores" "s" ON (("s"."owner_user_id" = "us"."user_id")))
  WHERE (("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "subscriptions_update_policy" ON "public"."subscriptions" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."user_stores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_stores_can_delete" ON "public"."user_stores" FOR DELETE USING (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id"))));



CREATE POLICY "user_stores_can_insert" ON "public"."user_stores" FOR INSERT WITH CHECK ((("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id"))) AND (( SELECT "count"(*) AS "count"
   FROM "public"."user_stores" "user_stores_1"
  WHERE ("user_stores_1"."store_id" = "user_stores_1"."store_id")) < ( SELECT "stores"."max_users"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id")))));



CREATE POLICY "user_stores_can_select" ON "public"."user_stores" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_stores_can_update" ON "public"."user_stores" FOR UPDATE WITH CHECK (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id"))));



CREATE POLICY "user_stores_delete_owner" ON "public"."user_stores" FOR DELETE USING (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id"))));



CREATE POLICY "user_stores_insert_owner" ON "public"."user_stores" FOR INSERT WITH CHECK ((("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id"))) AND (( SELECT "count"(*) AS "count"
   FROM "public"."user_stores" "us2"
  WHERE ("us2"."store_id" = "us2"."store_id")) < ( SELECT "stores"."max_users"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id")))));



CREATE POLICY "user_stores_select_own" ON "public"."user_stores" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_stores_update_owner" ON "public"."user_stores" FOR UPDATE USING (("auth"."uid"() = ( SELECT "stores"."owner_user_id"
   FROM "public"."stores"
  WHERE ("stores"."id" = "user_stores"."store_id"))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webflow_connections" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_set_plan_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_set_plan_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_set_plan_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."abandoned_carts" TO "anon";
GRANT ALL ON TABLE "public"."abandoned_carts" TO "authenticated";
GRANT ALL ON TABLE "public"."abandoned_carts" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_usages" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_usages" TO "service_role";



GRANT ALL ON TABLE "public"."affiliates" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliates" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."discount_usages" TO "authenticated";
GRANT ALL ON TABLE "public"."discount_usages" TO "service_role";



GRANT ALL ON TABLE "public"."discounts" TO "authenticated";
GRANT ALL ON TABLE "public"."discounts" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_gateways" TO "anon";
GRANT ALL ON TABLE "public"."payment_gateways" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_gateways" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."returns" TO "anon";
GRANT ALL ON TABLE "public"."returns" TO "authenticated";
GRANT ALL ON TABLE "public"."returns" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."store_integrations" TO "anon";
GRANT ALL ON TABLE "public"."store_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."store_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."store_settings" TO "anon";
GRANT ALL ON TABLE "public"."store_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."store_settings" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_stores" TO "anon";
GRANT ALL ON TABLE "public"."user_stores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stores" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."webflow_connections" TO "anon";
GRANT ALL ON TABLE "public"."webflow_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."webflow_connections" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

-- Migrate existing data from orders.items into order_items then drop the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='items'
  ) THEN
    INSERT INTO public.order_items (order_id, sku, product_name, quantity, unit_price)
    SELECT
      o.id,
      item->>'sku',
      item->>'product_name',
      (item->>'quantity')::integer,
      (item->>'unit_price')::numeric
    FROM public.orders o
    CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item;

    ALTER TABLE public.orders DROP COLUMN items;
  END IF;
END;
$$;






RESET ALL;
