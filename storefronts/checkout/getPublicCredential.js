import supabase from '../../supabase/supabaseClient.js';

export async function getPublicCredential(storeId, integrationId, gateway) {
  if (!storeId || !integrationId) return null;
  try {
    let query = supabase
      .from('store_integrations')
      .select('api_key, settings')
      .eq('store_id', storeId);
    if (gateway) {
      query = query.or(
        `gateway.eq.${integrationId},settings->>gateway.eq.${gateway}`
      );
    } else {
      query = query.eq('gateway', integrationId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn('[Smoothr] Credential lookup failed:', error.message || error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[Smoothr] Credential fetch error:', e?.message || e);
    return null;
  }
}
