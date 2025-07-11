-- Adds store_order_counters table and increment function
CREATE TABLE IF NOT EXISTS public.store_order_counters (
  store_id uuid PRIMARY KEY REFERENCES stores(id),
  current_order_number integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.increment_store_order_number(p_store_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_number integer;
BEGIN
  INSERT INTO store_order_counters(store_id, current_order_number)
  VALUES (p_store_id, 1)
  ON CONFLICT (store_id) DO UPDATE
    SET current_order_number = store_order_counters.current_order_number + 1
    RETURNING current_order_number INTO new_number;
  RETURN new_number;
END;
$$;
