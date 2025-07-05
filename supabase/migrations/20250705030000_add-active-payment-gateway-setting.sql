-- Adds active_payment_gateway default setting for stores

ALTER TABLE public.store_settings
  ALTER COLUMN settings SET DEFAULT '{"active_payment_gateway": "stripe"}'::jsonb;

UPDATE public.store_settings
SET settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{active_payment_gateway}', '"stripe"', true)
WHERE settings IS NULL OR NOT (settings ? 'active_payment_gateway');
