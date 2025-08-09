# RLS Map

This document maps each table to its columns and row level security (RLS) policies.

## abandoned_carts
**Columns**: id, customer_id, store_id, cart_data, last_interaction, emailed, created_at, updated_at

**Policies**:
- `abandoned_carts_admin_select`: select (public)
- `abandoned_carts_admin_write`: all (public)

## affiliate_usages
**Columns**: id, affiliate_id, order_id, amount, created_at

**Policies**:
- `affiliate_usages_admin_select`: select (public)
- `affiliate_usages_admin_write`: all (public)

## affiliates
**Columns**: id, store_id, code, commission_rate, created_at, updated_at

**Policies**:
- `affiliates_admin_select`: select (public)
- `affiliates_admin_write`: all (public)

## audit_logs
**Columns**: id, table_name, record_id, action, changed_by, changed_at, diff, comment

**Policies**:
- `audit_logs_admin_select`: select (public)
- `audit_logs_admin_write`: all (public)

## customer_payment_profiles
**Columns**: id, customer_id, gateway, profile_id, created_at

**Policies**:
- `customer_payment_profiles_admin`: all (public)

## customers
**Columns**: id, store_id, auth_provider_id, email, first_name, last_name, avatar_url, full_name, created_at

**Policies**:
- `customers_self_all`: all (public)
- `customers_store_admin_select`: select (public)

## discount_usages
**Columns**: id, discount_id, order_id, customer_id, used_at

**Policies**:
- `discount_usages_admin_select`: select (public)
- `discount_usages_admin_write`: all (public)

## discounts
**Columns**: id, store_id, code, type, value, usage_limit, expires_at, created_at, updated_at

**Policies**:
- `discounts_admin_select`: select (public)
- `discounts_admin_write`: all (public)

## notifications
**Columns**: id, store_id, customer_id, type, payload, status, retries, scheduled_for, created_at, updated_at

**Policies**:
- `notifications_admin_select`: select (public)
- `notifications_admin_write`: all (public)

## public_store_settings
**Columns**: store_id, theme, logo, currency, debug, api_base, platform, rate_source, base_currency, active_payment_gateway

**Policies**:
- `public_read`: select (anon, authenticated)

## order_items
**Columns**: id, order_id, sku, product_name, quantity, unit_price, created_at

**Policies**:
- `order_items_customer_select`: select (public)

## orders
**Columns**: id, store_id, customer_id, order_number, order_date, total_price, status, payment_provider, payment_intent_id, paid_at, cart_meta_hash, created_at, updated_at

**Policies**:
- `orders_customer_select_insert`: select, insert (public)
- `orders_customer_unpaid_modify`: update, delete (public)
- `orders_admin_service_modify`: update, delete (public) – uses service_role

## referrals
**Columns**: id, referrer_id, referred_email, utm_source, utm_medium, utm_campaign, created_at

**Policies**:
- `referrals_admin_select`: select (public)
- `referrals_admin_write`: all (public)

## returns
**Columns**: id, order_id, customer_id, status, return_reason, initiated_at, completed_at, created_at, updated_at

**Policies**:
- `returns_admin_select`: select (public)
- `returns_admin_write`: all (public)

## reviews
**Columns**: id, customer_id, product_id, order_id, rating, comment, created_at

**Policies**:
- `reviews_admin_select`: select (public)
- `reviews_admin_write`: all (public)

## store_integrations
**Columns**: id, store_id, gateway, api_key, settings, sandbox, created_at, updated_at

**Policies**:
- `store_integrations_service_role_admin_select`: select (public) – uses service_role

## store_settings
**Columns**: id, store_id, settings, created_at, updated_at

**Policies**:
- `store_settings_admin_all`: all (public)

## stores
**Columns**: id, store_name, store_domain, live_domain, prefix, order_sequence, plan, created_at, updated_at, owner_customer_id

**Policies**:
- `stores_admin_access`: all (public)

## subscriptions
**Columns**: id, customer_id, gateway, gateway_subscription_id, plan, status, period_start, period_end, created_at

**Policies**:
- `subscriptions_admin_select`: select (public)
- `subscriptions_admin_write`: all (public)

## user_stores
**Columns**: id, customer_id, store_id, role, created_at, updated_at

**Policies**:
- `user_stores_self_all`: all (public)

## webflow_connections
**Columns**: id, customer_id, site_id, access_token, created_at

**Policies**:
- `webflow_connections_admin_select`: select (public)
- `webflow_connections_admin_write`: all (public)

