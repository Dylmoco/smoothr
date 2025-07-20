-- Row level security policies documentation for Smoothr

-- orders_customer_select_insert
--   Customers may read their own orders or create new ones.
--   The row's customer_id must match auth.uid().

-- orders_customer_unpaid_modify
--   Allows customers to update or delete an order only while
--   it has not been paid (paid_at IS NULL). Prevents tampering
--   after payment occurs.

-- orders_admin_service_modify
--   Admins and the service role can update or delete any order,
--   even after payment, to support refunds and manual corrections.
