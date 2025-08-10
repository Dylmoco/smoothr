// pages/api/get-payment-key.js
import { createClient } from '@supabase/supabase-js';
import { applyCors } from '../../../shared/utils/applyCors.js';

export default async function handler(req, res) {
  const origin = process.env.CORS_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    applyCors(res, origin);
    return res.status(200).json({});
  }

  applyCors(res, origin);
  const { storeId, provider } = req.query;

  if (!storeId || !provider) {
    console.error('[API] Missing storeId or provider:', { storeId, provider });
    return res.status(400).json({ error: 'Missing storeId or provider' });
  }

  try {
    const supabaseUrl = 'https://lpuqrzvokroazwlricgn.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('[API] SUPABASE_SERVICE_ROLE_KEY not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    console.log('[API] Querying store_integrations for store:', storeId, 'provider:', provider);
    const { data, error } = await supabase
      .from('store_integrations')
      .select('api_key')
      .eq('store_id', storeId)
      .eq('gateway', provider)
      .single();

    if (error) {
      console.error(
        '[Supabase ERROR] Failed to fetch key:',
        error.message,
        error.code,
        error.details,
        error.hint
      );
      return res
        .status(500)
        .json({ error: 'Failed to fetch key', detail: error.message });
    }

    if (data && data.api_key) {
      console.log('[API] Key fetched successfully for store:', storeId);
      return res.status(200).json({ tokenization_key: data.api_key });
    }

    console.error('[Supabase ERROR] No key found for store:', storeId, 'provider:', provider, 'data:', data);
    return res.status(404).json({ error: 'No key found', detail: 'Missing integration key' });
  } catch (error) {
    console.error('[Supabase ERROR] Unexpected error:', error.message, error.stack);
    return res.status(500).json({ error: 'Unexpected server error', detail: error.message });
  }
}
