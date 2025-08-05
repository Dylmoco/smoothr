import { supabase } from '../../features/supabaseClient.js';

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
      const { data, error } = await supabase
        .from('public_store_integration_credentials')
        .select('publishable_key')
        .eq('store_id', storeId)
        .eq('gateway', 'stripe')
        .maybeSingle();
      if (error) {
        console.warn('[Smoothr] Credential lookup failed:', error.message || error);
        return null;
      }
      if (data?.publishable_key) {
        console.log('[Smoothr] Loaded Stripe key from Supabase.');
        return { publishable_key: data.publishable_key };
      }
      console.warn('[Smoothr] Stripe publishable key not found');
      return null;
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

