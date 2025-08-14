import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const response = await supabase
    .from('v_public_store')
    .select(
      'store_id,active_payment_gateway,publishable_key,base_currency,public_settings'
    )
    .eq('store_id', req.query.store_id)
    .maybeSingle();

  if (response.error) {
    const { status, code, message } = response.error;
    console.error('[api/config] Supabase query failed', {
      status,
      code,
      message
    });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.status(200).json({
    data:
      response.data || { public_settings: {}, active_payment_gateway: null }
  });
}

