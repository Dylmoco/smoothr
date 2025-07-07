-- Adds cart_meta_hash column for deduplication
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_meta_hash text;
