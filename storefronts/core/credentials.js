import { getSupabaseClient, ensureSupabaseSessionAuth } from '../../supabase/browserClient.js';
import { getConfig } from '../features/config/globalConfig.js';

export async function getGatewayCredential(gateway) {
  const debug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('smoothr-debug');
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return { publishable_key: null, tokenization_key: null, api_login_id: null };
    }
    await ensureSupabaseSessionAuth();
    const { storeId: store_id } = getConfig();

    const { data: creds, error } = await supabase.functions.invoke(
      'get_gateway_credentials',
      {
        body: { store_id, gateway }
      }
    );

    if (error) {
      debug &&
        console.warn('[Smoothr] Credential fetch failed:', error.message);
      return { publishable_key: null, tokenization_key: null, api_login_id: null };
    }

    const {
      publishable_key = null,
      tokenization_key = null,
      api_login_id = null
    } = creds || {};
    return { publishable_key, tokenization_key, api_login_id };
  } catch (e) {
    debug && console.warn('[Smoothr] Credential fetch error:', e?.message || e);
    return { publishable_key: null, tokenization_key: null, api_login_id: null };
  }
}

export default getGatewayCredential;

