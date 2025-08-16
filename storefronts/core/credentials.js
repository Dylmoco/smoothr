import { getConfig } from '../features/config/globalConfig.js';

export async function getGatewayCredential(gateway) {
  const w = typeof window !== 'undefined' ? window : globalThis;
  const debug = new URLSearchParams(w.location?.search || '').has('smoothr-debug');

  try {
    const supabase =
      (await (w.Smoothr?.supabaseReady || Promise.resolve(null))) || null;

    if (!supabase) {
      debug && console.warn('[Smoothr] Supabase not ready in getGatewayCredential');
      return { publishable_key: null, tokenization_key: null, api_login_id: null };
    }

    // Best-effort: hydrate session if present.
    try {
      const mod = await import('../../supabase/client/browserClient.js');
      await mod.ensureSupabaseSessionAuth?.();
    } catch {}

    const { storeId } = getConfig();
    const { data, error } = await supabase.functions.invoke('get_gateway_credentials', {
      body: { store_id: storeId, gateway },
    });
    if (error) throw error;

    const {
      publishable_key = null,
      tokenization_key = null,
      api_login_id = null,
    } = data || {};
    return { publishable_key, tokenization_key, api_login_id };
  } catch (e) {
    debug && console.warn('[Smoothr] Credential fetch error:', e?.message || e);
    return { publishable_key: null, tokenization_key: null, api_login_id: null };
  }
}

export default getGatewayCredential;

