import { createClient } from '@supabase/supabase-js';
import { applyCors } from 'shared/utils/applyCors';

export default async function handler(req, res) {
  const origin = process.env.CORS_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    applyCors(res, origin);
    return res.status(200).json({});
  }

  applyCors(res, origin);
  const storeId = req.query.store_id || req.query.storeId;
  const gateway = req.query.gateway || req.query.provider;

  if (!storeId || !gateway) {
    console.error('[API] Missing store_id or gateway:', { storeId, gateway });
    return res.status(400).json({ error: 'Missing store_id or gateway' });
  }

  console.warn(
    '[API] get-payment-key is deprecated; use get_gateway_credentials edge function instead'
  );

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('[API] Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, anonKey);

    const { data, error } = await supabase
      .from('v_public_store')
      .select('publishable_key, tokenization_key, api_login_id')
      .eq('store_id', storeId)
      .eq('active_payment_gateway', gateway)
      .single();

    if (error) {
      console.error('[Supabase ERROR] Failed to fetch key:', error.message);
      return res.status(500).json({ error: 'Failed to fetch key', detail: error.message });
    }

    if (!data) {
      return res
        .status(404)
        .json({ error: 'Deprecated - use get_gateway_credentials edge function' });
    }

    return res.status(200).json({
      ...data,
      message: 'Deprecated - use get_gateway_credentials edge function',
    });
  } catch (error) {
    console.error('[Supabase ERROR] Unexpected error:', error.message);
    return res
      .status(500)
      .json({ error: 'Unexpected server error', detail: error.message });
  }
}

