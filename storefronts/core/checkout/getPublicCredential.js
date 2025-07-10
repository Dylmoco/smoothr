import supabase from '../../../supabase/supabaseClient.js';

export async function getPublicCredential(storeId, integrationId) {
  if (!storeId || !integrationId) return null;
  try {
    const { data, error } = await supabase
      .from('store_integrations')
      .select('api_key, settings')
      .eq('store_id', storeId)
      .eq('provider', integrationId)
      .maybeSingle();
    if (error) {
      console.warn('[Smoothr Checkout] Credential lookup failed:', error.message || error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[Smoothr Checkout] Credential fetch error:', e?.message || e);
    return null;
  }
}

export default getPublicCredential;
