import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const supabase = createClient(url, anonKey);
  try {
    const { data, error } = await supabase
      .from('v_public_store')
      .select(
        'store_id,active_payment_gateway,publishable_key,base_currency,public_settings'
      )
      .eq('store_id', req.query.store_id)
      .maybeSingle();

    if (error) throw error;

    res
      .status(200)
      .json(data || { public_settings: {}, active_payment_gateway: null });
  } catch (err) {
    console.error('[api/config] Supabase query failed', err);
    res
      .status(500)
      .json({ public_settings: {}, active_payment_gateway: null });
  }
}
