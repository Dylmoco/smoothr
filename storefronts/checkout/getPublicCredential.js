import { supabase } from '../../shared/supabase/browserClient';

export async function getPublicCredential(storeId, integrationId, gateway) {
  if (!storeId || !integrationId) return null;
  try {
    // Special case for NMI tokenization key exposed via the
    // public_store_integration_credentials view
    if (integrationId === 'nmi' || gateway === 'nmi') {
      const { data, error } = await supabase
        .from('public_store_integration_credentials')
        .select('tokenization_key')
        .eq('store_id', storeId)
        .eq('gateway', gateway || integrationId)
        .maybeSingle();
      if (error) {
        console.warn('[Smoothr] Credential lookup failed:', error.message || error);
        return null;
      }
      return data ? { tokenization_key: data.tokenization_key } : null;
    }

    if (integrationId === 'stripe' || gateway === 'stripe') {
      const match = gateway || integrationId;
      const { data, error } = await supabase
        .from('public_store_integration_credentials')
        .select('settings')
        .eq('store_id', storeId)
        .or(`provider.eq.${match},gateway.eq.${match}`)
        .maybeSingle();
      if (error) {
        console.warn('[Smoothr] Credential lookup failed:', error.message || error);
        return null;
      }
      return data || null;
    }

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

