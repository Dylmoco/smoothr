// pages/api/get-payment-key.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { storeId, provider } = req.query;

  if (!storeId || !provider) {
    return res.status(400).json({ error: 'Missing storeId or provider' });
  }

  const supabaseUrl = 'https://lpuqrzvokroazwlricgn.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Updated to match Vercel env var
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from('store_integrations')
    .select('tokenization_key')
    .eq('store_id', storeId)
    .eq('provider', provider)
    .single();

  if (error) {
    console.error('Supabase error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch key' });
  }

  if (data && data.tokenization_key) {
    return res.status(200).json({ tokenization_key: data.tokenization_key });
  } else {
    return res.status(404).json({ error: 'No key found' });
  }
}