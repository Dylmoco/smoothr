


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


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "created_at" timestamp DEFAULT now()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";

COMMENT ON TABLE "public"."customers" IS 'Customers belonging to a store. Each row may optionally link to a user account via user_id.';

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY customers_service_role ON public.customers
  FOR ALL USING (auth.role() = 'service_role');

-- Customers may view their own profile
CREATE POLICY customers_self_select ON public.customers
  FOR SELECT USING (user_id = auth.uid());

-- Store owners may view customers of their stores
CREATE POLICY customers_store_owner_select ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = customers.store_id
        AND s.owner_user_id = auth.uid()
    )
  );


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

COMMENT ON TABLE "public"."order_items" IS 'Items belonging to an order. Each row references the parent order via order_id.';


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_number" "text" NOT NULL,
    "order_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_price" numeric NOT NULL,
    "status" "text" NOT NULL,
    "customer_id" "uuid",
    "customer_email" "text",
    "platform" "text",
    "store_id" "uuid" NOT NULL,
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

COMMENT ON TABLE "public"."orders" IS 'Orders placed by customers within a store. References store_id and optionally customer_id for the purchaser.';


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
    "customer_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'initiated'::"text" NOT NULL,
    "return_reason" "text",
    "initiated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Enable RLS for returns
-- service_role: full access
-- other roles: auth.uid() must match customers.user_id
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY returns_service_role ON public.returns
  FOR ALL USING (auth.role() = 'service_role');

-- Customers may view their own return records
CREATE POLICY returns_customer_select ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = returns.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Customers may create returns for their own orders
CREATE POLICY returns_customer_insert ON public.returns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = returns.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Store owners may view returns for their stores
CREATE POLICY returns_store_owner_select ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = returns.store_id
        AND s.owner_user_id = auth.uid()
    )
  );


ALTER TABLE "public"."returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
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

COMMENT ON TABLE "public"."store_settings" IS 'JSON configuration for a store. One row per store referenced by store_id.';


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "store_name" "text" NOT NULL,
    "store_domain" "text" NOT NULL,
    "live_domain" "text",
    "login_redirect_url" "text" DEFAULT ''::"text" NOT NULL,
    "plan" "public"."store_plan" DEFAULT 'free'::public.store_plan NOT NULL,
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

COMMENT ON TABLE "public"."stores" IS 'Stores managed in Smoothr. Each store is owned by a user and links to store_settings, orders, and other tables via store_id.';


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan" "public"."store_plan",
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

COMMENT ON TABLE "public"."user_stores" IS 'Joins users to stores with a specific role (owner, manager, etc.). Each row links a user_id to a store_id.';


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

COMMENT ON TABLE "public"."users" IS 'Application users including store owners and customers. Holds authentication provider IDs and subscription data.';


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

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");


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

CREATE INDEX "idx_customers_store_id" ON "public"."customers" USING "btree" ("store_id");
CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");
CREATE INDEX "idx_customers_user_id" ON "public"."customers" USING "btree" ("user_id");


CREATE UNIQUE INDEX "idx_exchange_rates_unique" ON "public"."exchange_rates" USING "btree" ("base_currency", "target_currency");



CREATE INDEX "idx_notifications_store_id" ON "public"."notifications" USING "btree" ("store_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_order_date" ON "public"."orders" USING "btree" ("order_date");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_store_id" ON "public"."orders" USING "btree" ("store_id");
CREATE INDEX "idx_returns_order_id" ON "public"."returns" USING "btree" ("order_id");
CREATE INDEX "idx_returns_store_customer" ON "public"."returns" USING "btree" ("store_id", "customer_id");
CREATE INDEX "idx_reviews_order_id" ON "public"."reviews" USING "btree" ("order_id");
CREATE INDEX "idx_reviews_store_customer" ON "public"."reviews" USING "btree" ("store_id", "customer_id");



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

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


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
    ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



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

ALTER TABLE ONLY "public"."payment_gateways"
    ADD CONSTRAINT "payment_gateways_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."webflow_connections"
    ADD CONSTRAINT "webflow_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



DROP POLICY IF EXISTS "Allow logged-in users to insert reviews" ON public.reviews;






DROP POLICY IF EXISTS "Customers can insert their own orders" ON public.orders;



DROP POLICY IF EXISTS "Customers can read their own orders" ON public.orders;



DROP POLICY IF EXISTS "Customers can update their own orders" ON public.orders;



DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;



DROP POLICY IF EXISTS "Store owners can insert store" ON public.stores;



DROP POLICY IF EXISTS "Store owners can read their store" ON public.stores;



DROP POLICY IF EXISTS "Store owners can update their store" ON public.stores;



DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;



DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;



DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;



DROP POLICY IF EXISTS "Users can select their own data" ON public.users;



DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;



DROP POLICY IF EXISTS "Users can update their own data" ON public.users;



-- Enable RLS for abandoned carts
-- service_role: full access
-- other roles: auth.uid() must match customers.user_id
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY abandoned_carts_service_role ON public.abandoned_carts
  FOR ALL USING (auth.role() = 'service_role');

-- Customers may view their own abandoned cart
CREATE POLICY abandoned_carts_customer_select ON public.abandoned_carts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = abandoned_carts.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Customers may create a cart linked to their account
CREATE POLICY abandoned_carts_customer_insert ON public.abandoned_carts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = abandoned_carts.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Customers may update their own cart
CREATE POLICY abandoned_carts_customer_update ON public.abandoned_carts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = abandoned_carts.customer_id
        AND c.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = abandoned_carts.customer_id
        AND c.user_id = auth.uid()
    )
  );


DROP POLICY IF EXISTS "abandoned_carts_insert_policy" ON public.abandoned_carts;



DROP POLICY IF EXISTS "abandoned_carts_select_customer" ON public.abandoned_carts;



DROP POLICY IF EXISTS "abandoned_carts_select_staff" ON public.abandoned_carts;



DROP POLICY IF EXISTS "abandoned_carts_update_policy" ON public.abandoned_carts;



ALTER TABLE public.affiliate_usages DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "affiliate_usages_insert_policy" ON public.affiliate_usages;



DROP POLICY IF EXISTS "affiliate_usages_select" ON public.affiliate_usages;



DROP POLICY IF EXISTS "affiliate_usages_select_policy" ON public.affiliate_usages;



ALTER TABLE public.affiliates DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "affiliates_delete_policy" ON public.affiliates;



DROP POLICY IF EXISTS "affiliates_insert_policy" ON public.affiliates;



DROP POLICY IF EXISTS "affiliates_select" ON public.affiliates;



DROP POLICY IF EXISTS "affiliates_select_policy" ON public.affiliates;



DROP POLICY IF EXISTS "affiliates_update_policy" ON public.affiliates;



ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;



DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;



ALTER TABLE public.discount_usages DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "discount_usages_delete" ON public.discount_usages;



DROP POLICY IF EXISTS "discount_usages_insert" ON public.discount_usages;



DROP POLICY IF EXISTS "discount_usages_insert_policy" ON public.discount_usages;



DROP POLICY IF EXISTS "discount_usages_select" ON public.discount_usages;



DROP POLICY IF EXISTS "discount_usages_select_policy" ON public.discount_usages;



DROP POLICY IF EXISTS "discount_usages_update" ON public.discount_usages;



ALTER TABLE public.discounts DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "discounts_delete" ON public.discounts;



DROP POLICY IF EXISTS "discounts_delete_policy" ON public.discounts;



DROP POLICY IF EXISTS "discounts_insert" ON public.discounts;



DROP POLICY IF EXISTS "discounts_insert_policy" ON public.discounts;



DROP POLICY IF EXISTS "discounts_manage" ON public.discounts;



DROP POLICY IF EXISTS "discounts_select" ON public.discounts;



DROP POLICY IF EXISTS "discounts_select_policy" ON public.discounts;



DROP POLICY IF EXISTS "discounts_update" ON public.discounts;



DROP POLICY IF EXISTS "discounts_update_policy" ON public.discounts;



ALTER TABLE public.exchange_rates DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "exchange_rates_modify_service" ON public.exchange_rates;



DROP POLICY IF EXISTS "exchange_rates_select_service" ON public.exchange_rates;

DROP POLICY IF EXISTS "exchange_rates_select_staff" ON public.exchange_rates;



DROP POLICY IF EXISTS "exchange_rates_update_service" ON public.exchange_rates;



ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;



DROP POLICY IF EXISTS "notifications_select_customer" ON public.notifications;



DROP POLICY IF EXISTS "notifications_select_staff" ON public.notifications;



DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;



ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;



DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;



DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;



-- Enable RLS for orders
-- service_role: full access
-- other roles: auth.uid() must match customers.user_id
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY orders_service_role ON public.orders
  FOR ALL USING (auth.role() = 'service_role');

-- Customers may view their own orders
CREATE POLICY orders_customer_select ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = orders.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Store owners may view orders for their stores
CREATE POLICY orders_store_owner_select ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id
        AND s.owner_user_id = auth.uid()
    )
  );


DROP POLICY IF EXISTS "orders_can_delete" ON public.orders;



DROP POLICY IF EXISTS "orders_can_select" ON public.orders;



DROP POLICY IF EXISTS "orders_delete_owner" ON public.orders;



DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;



DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;



DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;



DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;



ALTER TABLE public.payment_gateways DISABLE ROW LEVEL SECURITY;


ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;


ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;


-- RLS already enabled above for returns
--ALTER TABLE public.returns DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "returns_insert_policy" ON public.returns;



DROP POLICY IF EXISTS "returns_select_customer" ON public.returns;



DROP POLICY IF EXISTS "returns_select_staff" ON public.returns;



DROP POLICY IF EXISTS "returns_update_staff" ON public.returns;



-- Enable RLS for reviews
-- service_role: full access
-- other roles: auth.uid() must match customers.user_id
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY reviews_service_role ON public.reviews
  FOR ALL USING (auth.role() = 'service_role');

-- Customers may create reviews for stores they have ordered from
CREATE POLICY reviews_customer_insert ON public.reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.id = reviews.order_id
        AND o.store_id = reviews.store_id
        AND c.user_id = auth.uid()
        AND reviews.customer_id = c.id
    )
  );

-- Store owners may view reviews for their stores
CREATE POLICY reviews_store_owner_select ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = reviews.store_id
        AND s.owner_user_id = auth.uid()
    )
  );


DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;



DROP POLICY IF EXISTS "reviews_select_customer" ON public.reviews;



DROP POLICY IF EXISTS "reviews_select_staff" ON public.reviews;



DROP POLICY IF EXISTS "reviews_update_staff" ON public.reviews;



ALTER TABLE public.store_integrations DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "store_integrations_delete_policy" ON public.store_integrations;



DROP POLICY IF EXISTS "store_integrations_insert_policy" ON public.store_integrations;



DROP POLICY IF EXISTS "store_integrations_select_policy" ON public.store_integrations;



DROP POLICY IF EXISTS "store_integrations_update_policy" ON public.store_integrations;





DROP POLICY IF EXISTS "store_settings_delete_policy" ON public.store_settings;



DROP POLICY IF EXISTS "store_settings_insert_policy" ON public.store_settings;



DROP POLICY IF EXISTS "store_settings_select_policy" ON public.store_settings;



DROP POLICY IF EXISTS "store_settings_update_policy" ON public.store_settings;

-- Enable RLS for store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY store_settings_service_role ON public.store_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Store owners may manage settings for their store
CREATE POLICY store_settings_owner_select ON public.store_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_settings.store_id
        AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY store_settings_owner_insert ON public.store_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_settings.store_id
        AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY store_settings_owner_update ON public.store_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_settings.store_id
        AND s.owner_user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_settings.store_id
        AND s.owner_user_id = auth.uid()
    )
  );




DROP POLICY IF EXISTS "stores_delete_owner" ON public.stores;



DROP POLICY IF EXISTS "stores_insert_service" ON public.stores;



DROP POLICY IF EXISTS "stores_select_public" ON public.stores;



DROP POLICY IF EXISTS "stores_select_staff" ON public.stores;



DROP POLICY IF EXISTS "stores_update_staff" ON public.stores;

-- Enable RLS for stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access
CREATE POLICY stores_service_role ON public.stores
  FOR ALL USING (auth.role() = 'service_role');

-- Store owners may manage their store
CREATE POLICY stores_owner_select ON public.stores
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY stores_owner_insert ON public.stores
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY stores_owner_update ON public.stores
  FOR UPDATE USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());


ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "subscriptions_insert_policy" ON public.subscriptions;



DROP POLICY IF EXISTS "subscriptions_select_owner" ON public.subscriptions;



DROP POLICY IF EXISTS "subscriptions_select_staff" ON public.subscriptions;



DROP POLICY IF EXISTS "subscriptions_update_policy" ON public.subscriptions;



ALTER TABLE public.user_stores DISABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "user_stores_can_delete" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_can_insert" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_can_select" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_can_update" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_delete_owner" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_insert_owner" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_select_own" ON public.user_stores;



DROP POLICY IF EXISTS "user_stores_update_owner" ON public.user_stores;



ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;


ALTER TABLE public.webflow_connections DISABLE ROW LEVEL SECURITY;


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



GRANT ALL ON TABLE "public"."abandoned_carts" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_usages" TO "service_role";



GRANT ALL ON TABLE "public"."affiliates" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."discount_usages" TO "service_role";



GRANT ALL ON TABLE "public"."discounts" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_gateways" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."returns" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."store_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."store_settings" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_stores" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."webflow_connections" TO "service_role";
REVOKE ALL ON TABLE public.abandoned_carts FROM anon;
REVOKE ALL ON TABLE public.abandoned_carts FROM authenticated;
REVOKE ALL ON TABLE public.affiliate_usages FROM anon;
REVOKE ALL ON TABLE public.affiliate_usages FROM authenticated;
REVOKE ALL ON TABLE public.affiliates FROM anon;
REVOKE ALL ON TABLE public.affiliates FROM authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM anon;
REVOKE ALL ON TABLE public.audit_logs FROM authenticated;
REVOKE ALL ON TABLE public.discount_usages FROM anon;
REVOKE ALL ON TABLE public.discount_usages FROM authenticated;
REVOKE ALL ON TABLE public.discounts FROM anon;
REVOKE ALL ON TABLE public.discounts FROM authenticated;
REVOKE ALL ON TABLE public.exchange_rates FROM anon;
REVOKE ALL ON TABLE public.exchange_rates FROM authenticated;
REVOKE ALL ON TABLE public.notifications FROM anon;
REVOKE ALL ON TABLE public.notifications FROM authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon;
REVOKE ALL ON TABLE public.order_items FROM authenticated;
REVOKE ALL ON TABLE public.orders FROM anon;
REVOKE ALL ON TABLE public.orders FROM authenticated;
REVOKE ALL ON TABLE public.payment_gateways FROM anon;
REVOKE ALL ON TABLE public.payment_gateways FROM authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
REVOKE ALL ON TABLE public.referrals FROM anon;
REVOKE ALL ON TABLE public.referrals FROM authenticated;
REVOKE ALL ON TABLE public.returns FROM anon;
REVOKE ALL ON TABLE public.returns FROM authenticated;
REVOKE ALL ON TABLE public.reviews FROM anon;
REVOKE ALL ON TABLE public.reviews FROM authenticated;
REVOKE ALL ON TABLE public.store_integrations FROM anon;
REVOKE ALL ON TABLE public.store_integrations FROM authenticated;
REVOKE ALL ON TABLE public.store_settings FROM anon;
REVOKE ALL ON TABLE public.store_settings FROM authenticated;
REVOKE ALL ON TABLE public.stores FROM anon;
REVOKE ALL ON TABLE public.stores FROM authenticated;
REVOKE ALL ON TABLE public.subscriptions FROM anon;
REVOKE ALL ON TABLE public.subscriptions FROM authenticated;
REVOKE ALL ON TABLE public.user_stores FROM anon;
REVOKE ALL ON TABLE public.user_stores FROM authenticated;
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.users FROM authenticated;
REVOKE ALL ON TABLE public.webflow_connections FROM anon;
REVOKE ALL ON TABLE public.webflow_connections FROM authenticated;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
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

-- Convert orders.customer_id from text to uuid if needed and add platform column
DO $$
BEGIN
  -- Change column type when it still uses text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_id' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN customer_id TYPE uuid USING NULLIF(customer_id, '')::uuid;
  END IF;

  -- Add platform column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'platform'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN platform text;
  END IF;

  -- Ensure foreign key exists
  BEGIN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id)
      REFERENCES public.customers(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Ensure index exists for customer_id
  CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
END;
$$;






RESET ALL;
