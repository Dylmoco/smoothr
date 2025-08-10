import supabase, { ensureSupabaseSessionAuth } from '../../supabase/browserClient.js';
import { getConfig } from '../features/config/globalConfig.js';

export async function getGatewayCredential(gateway) {
  const debug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('smoothr-debug');
  try {
    await ensureSupabaseSessionAuth();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;

    const { storeId: store_id } = getConfig();
    const supabaseUrl = supabase.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const headers = {
      'Content-Type': 'application/json',
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    if (access_token) {
      headers.Authorization = `Bearer ${access_token}`;
    }
    const body = JSON.stringify({ store_id, gateway });
    let res = await fetch(
      `${supabaseUrl}/functions/v1/get_gateway_credentials`,
      {
        method: 'POST',
        headers,
        body
      }
    );

    if ((res.status === 401 || res.status === 403) && headers.Authorization) {
      console.warn(
        '[Smoothr] Credential fetch unauthorized, retrying anon:',
        res.status
      );
      delete headers.Authorization;
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
      console.warn('[Smoothr] Credential fetch failed:', res.status, data?.message);
      return { publishable_key: null, tokenization_key: null };
    }
    return data;
  } catch (e) {
    console.warn('[Smoothr] Credential fetch error:', e?.message || e);
    return { publishable_key: null, tokenization_key: null };
  }
}

export default getGatewayCredential;

