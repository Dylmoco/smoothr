-- RLS policy audit for Smoothr

-- Table: abandoned_carts
--   abandoned_carts_admin_select: select (public) 
--   abandoned_carts_admin_write: all (public) 

-- Table: affiliate_usages
--   affiliate_usages_admin_select: select (public) 
--   affiliate_usages_admin_write: all (public) 

-- Table: affiliates
--   affiliates_admin_select: select (public) 
--   affiliates_admin_write: all (public) 

-- Table: audit_logs
--   audit_logs_admin_select: select (public) 
--   audit_logs_admin_write: all (public) 

-- Table: customer_payment_profiles
--   customer_payment_profiles_admin: all (public) 

-- Table: customers
--   customers_self_all: all (public) 
--   customers_store_admin_select: select (public) 

-- Table: discount_usages
--   discount_usages_admin_select: select (public) 
--   discount_usages_admin_write: all (public) 

-- Table: discounts
--   discounts_admin_select: select (public) 
--   discounts_admin_write: all (public) 

-- Table: notifications
--   notifications_admin_select: select (public) 
--   notifications_admin_write: all (public) 

-- Table: order_items
--   order_items_customer_select: select (public) 

-- Table: orders
--   orders_customer_select_insert: select, insert (public) 
--   orders_customer_unpaid_modify: update, delete (public) 
--   orders_admin_service_modify: update, delete (public)  -- SUSPICIOUS: uses service_role

-- Table: referrals
--   referrals_admin_select: select (public) 
--   referrals_admin_write: all (public) 

-- Table: returns
--   returns_admin_select: select (public) 
--   returns_admin_write: all (public) 

-- Table: reviews
--   reviews_admin_select: select (public) 
--   reviews_admin_write: all (public) 

-- Table: store_integrations
--   store_integrations_service_role_admin_select: select (public)  -- SUSPICIOUS: uses service_role

-- Table: store_settings
--   store_settings_admin_all: all (public) 

-- Table: stores
--   stores_admin_access: all (public) 

-- Table: subscriptions
--   subscriptions_admin_select: select (public) 
--   subscriptions_admin_write: all (public) 

-- Table: user_stores
--   user_stores_self_all: all (public) 

-- Table: webflow_connections
--   webflow_connections_admin_select: select (public) 
--   webflow_connections_admin_write: all (public) 
