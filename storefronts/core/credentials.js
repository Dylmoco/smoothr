import supabase from '../../supabase/browserClient.js';
import { getConfig } from '../features/config/globalConfig.js';

const cache = {};
const missingLogged = {};

export async function getGatewayCredential(gateway) {
  if (cache[gateway]) return cache[gateway];

  const debug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('smoothr-debug');
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;

    const { storeId: store_id } = getConfig();
    const supabaseUrl =
      supabase.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const headers = {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${access_token || anonKey}`
    };

    const gatewayMap = { authorizeNet: 'authorize' };
    const body = JSON.stringify({
      store_id,
      gateway: gatewayMap[gateway] || gateway
    });

    let res = await fetch(
      `${supabaseUrl}/functions/v1/get_gateway_credentials`,
      {
        method: 'POST',
        headers,
        body
      }
    );

    if ((res.status === 401 || res.status === 403) && access_token) {
      console.warn(
        '[Smoothr] Credential fetch unauthorized, retrying anon:',
        res.status
      );
      headers.Authorization = `Bearer ${anonKey}`;
      res = await fetch(
        `${supabaseUrl}/functions/v1/get_gateway_credentials`,
        { method: 'POST', headers, body }
      );
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      console.warn('[Smoothr] Credential fetch failed:', res.status, data);
      return {
        publishable_key: null,
        tokenization_key: null,
        hosted_fields: null,
        active: false
      };
    }

    cache[gateway] = data;

    if (gateway === 'stripe' && !data.publishable_key && !missingLogged.stripe) {
      missingLogged.stripe = true;
      console.warn('[Smoothr] Missing publishable_key in credentials response');
    }
    if (gateway === 'nmi' && !data.tokenization_key && !missingLogged.nmi) {
      missingLogged.nmi = true;
      console.warn('[Smoothr] Missing tokenization_key in credentials response');
    }
    if (
      gateway === 'authorizeNet' &&
      !data?.hosted_fields?.client_key &&
      !missingLogged.authorizeNet
    ) {
      missingLogged.authorizeNet = true;
      console.warn('[Smoothr] Missing client key in credentials response');
    }

    return data;
  } catch (e) {
    console.warn('[Smoothr] Credential fetch error:', e?.message || e);
    return {
      publishable_key: null,
      tokenization_key: null,
      hosted_fields: null,
      active: false
    };
  }
}

export default getGatewayCredential;

