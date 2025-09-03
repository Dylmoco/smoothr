import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Determine allowed origins for this store
  const domainsRes = await supabase
    .from('stores')
    .select('store_domain, live_domain')
    .eq('id', req.query.store_id)
    .maybeSingle();

  let allowOrigin = '*';
  const origin = req.headers.origin;
  const storeDomain = domainsRes.data?.store_domain;
  const liveDomain = domainsRes.data?.live_domain;
  const wildcardDomains = ['webflow.io', 'framer.website', 'webstudio.is'];

  if (origin) {
    try {
      const { hostname } = new URL(origin);
      const allowList = [storeDomain, liveDomain].filter(Boolean);
      const isAllowed =
        allowList.includes(hostname) ||
        wildcardDomains.some(domain => hostname.endsWith(`.${domain}`));
      if (isAllowed) allowOrigin = origin;
    } catch {
      // ignore URL parsing errors
    }
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).end();
  }

  // Fetch public store config
  const response = await supabase
    .from('v_public_store')
    .select(
      'store_id,active_payment_gateway,publishable_key,base_currency,public_settings,oauth_popup_enabled'
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

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('X-Smoothr-Store', String(req.query.store_id || ''));

  const data = response.data || {};
  const {
    store_id: storeId = null,
    active_payment_gateway: activePaymentGateway = null,
    publishable_key: publishableKey = null,
    base_currency: baseCurrency = null,
    public_settings: publicSettings = {},
    oauth_popup_enabled: oauthPopupEnabled = false
  } = data;

  const {
    tokenizationKey = null,
    acceptJsKey = null
  } = publicSettings || {};

  res.status(200).json({
    storeId,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    baseCurrency,
    activePaymentGateway,
    oauth_popup_enabled: !!oauthPopupEnabled,
    gateway: {
      stripe: { publishableKey },
      nmi: { tokenizationKey },
      authorize: { acceptJsKey }
    }
  });
}

