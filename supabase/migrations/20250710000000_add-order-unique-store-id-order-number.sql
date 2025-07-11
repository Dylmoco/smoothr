-- Adds unique constraint on store_id and order_number
ALTER TABLE public.orders
ADD CONSTRAINT orders_store_id_order_number_key UNIQUE (store_id, order_number);
