// pages/api/get-payment-key.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://smoothr-cms.webflow.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

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
    const { data, error } = await supabase
      .from('store_integrations')
      .select('tokenization_key')
      .eq('store_id', storeId)
      .eq('provider', provider)
      .single();

    if (error) {
      console.error('[API] Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch key', details: error.message });
    }

    if (data && data.tokenization_key) {
      console.log('[API] Key fetched successfully for store:', storeId);
      return res.status(200).json({ tokenization_key: data.tokenization_key });
    } else {
      console.error('[API] No key found for store:', storeId, 'provider:', provider);
      return res.status(404).json({ error: 'No key found' });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error.message);
    return res.status(500).json({ error: 'Unexpected server error', details: error.message });
  }
}