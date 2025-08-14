import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

export default async function handler(req, res) {
  const response = await supabase
    .from('v_public_store')
    .select(
      'store_id,active_payment_gateway,publishable_key,base_currency,public_settings'
    )
    .eq('store_id', req.query.store_id)
    .maybeSingle();

  res
    .status(200)
    .json(
      response.data || { public_settings: {}, active_payment_gateway: null }
    );
}
