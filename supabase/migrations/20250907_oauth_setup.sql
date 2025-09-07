-- OAuth setup migration
-- Creates oauth_one_time_codes table, supporting RPCs and cleanup function

-- Table for storing OAuth one-time codes
CREATE TABLE IF NOT EXISTS public.oauth_one_time_codes (
  code text NOT NULL,
  store_id uuid NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  PRIMARY KEY (code, store_id),
  FOREIGN KEY (store_id) REFERENCES public.stores(id)
);

ALTER TABLE public.oauth_one_time_codes OWNER TO supabase_admin;

-- Validate a store domain is unique
CREATE OR REPLACE FUNCTION public.validate_store_domain(p_domain text)
RETURNS TABLE(is_valid boolean, messages text[])
LANGUAGE plpgsql
AS $$
DECLARE
  msgs text[] := ARRAY[]::text[];
  exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.stores
    WHERE store_domain = p_domain OR live_domain = p_domain
  ) INTO exists;

  IF exists THEN
    msgs := array_append(msgs, 'domain_already_in_use');
    RETURN QUERY SELECT false, msgs;
  ELSE
    RETURN QUERY SELECT true, msgs;
  END IF;
END;
$$;

ALTER FUNCTION public.validate_store_domain(text) OWNER TO supabase_admin;

-- Return allowed hosts for a store
CREATE OR REPLACE FUNCTION public.get_allowed_hosts(p_store_id uuid)
RETURNS TABLE(host text)
LANGUAGE sql
AS $$
  SELECT host FROM (
    SELECT store_domain AS host FROM public.stores WHERE id = p_store_id
    UNION
    SELECT live_domain AS host FROM public.stores WHERE id = p_store_id AND live_domain IS NOT NULL
  ) AS hosts
  WHERE host IS NOT NULL;
$$;

ALTER FUNCTION public.get_allowed_hosts(uuid) OWNER TO supabase_admin;

-- Validate OAuth request domains
CREATE OR REPLACE FUNCTION public.validate_oauth_domains(
  p_origin text,
  p_redirect text,
  p_store_id uuid
)
RETURNS TABLE(is_valid boolean, messages text[])
LANGUAGE plpgsql
AS $$
DECLARE
  origin_host text;
  redirect_host text;
  allowed text[];
  msgs text[] := ARRAY[]::text[];
  valid boolean := true;
BEGIN
  origin_host := regexp_replace(p_origin, '^https?://([^/]+).*$','\1');
  redirect_host := regexp_replace(p_redirect, '^https?://([^/]+).*$','\1');
  SELECT array_agg(host) INTO allowed FROM public.get_allowed_hosts(p_store_id);

  IF origin_host IS NOT NULL AND NOT origin_host = ANY(allowed) THEN
    valid := false;
    msgs := array_append(msgs, 'origin_not_allowed');
  END IF;

  IF redirect_host IS NOT NULL AND NOT redirect_host = ANY(allowed) THEN
    valid := false;
    msgs := array_append(msgs, 'redirect_not_allowed');
  END IF;

  RETURN QUERY SELECT valid, msgs;
END;
$$;

ALTER FUNCTION public.validate_oauth_domains(text, text, uuid) OWNER TO supabase_admin;

-- Create an OAuth one-time code
CREATE OR REPLACE FUNCTION public.create_otc(
  p_store_id uuid,
  p_data jsonb,
  p_expires_in interval DEFAULT interval '5 minutes'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text := encode(gen_random_bytes(16), 'hex');
BEGIN
  INSERT INTO public.oauth_one_time_codes(code, store_id, data, expires_at, created_at)
  VALUES (v_code, p_store_id, p_data, now() + p_expires_in, now());
  RETURN v_code;
END;
$$;

ALTER FUNCTION public.create_otc(uuid, jsonb, interval) OWNER TO supabase_admin;

-- Redeem an OAuth one-time code
CREATE OR REPLACE FUNCTION public.redeem_otc(
  p_code text,
  p_store_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  UPDATE public.oauth_one_time_codes
  SET used_at = now()
  WHERE code = p_code
    AND store_id = p_store_id
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING data INTO payload;

  RETURN payload;
END;
$$;

ALTER FUNCTION public.redeem_otc(text, uuid) OWNER TO supabase_admin;

-- Cleanup function to purge expired or old used codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otcs()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$  
  WITH deleted AS (
    DELETE FROM public.oauth_one_time_codes
    WHERE 
      expires_at < NOW() - INTERVAL '1 hour'
      OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '24 hours')
    RETURNING *
  )
  SELECT count(*) FROM deleted;
  $$;

ALTER FUNCTION public.cleanup_expired_otcs() OWNER TO supabase_admin;

