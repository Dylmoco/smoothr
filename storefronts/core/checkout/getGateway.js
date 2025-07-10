import supabase from '../../../supabase/supabaseClient.js';

export async function getActivePaymentGateway(log = () => {}, warn = () => {}) {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.active_payment_gateway) return cfg.active_payment_gateway;
  const storeId = cfg.storeId;
  if (!storeId) {
    warn('Store ID missing; defaulting to stripe');
    return 'stripe';
  }
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('settings')
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return 'stripe';
    }
    const gateway = data?.settings?.active_payment_gateway;
    if (!gateway) {
      warn('active_payment_gateway missing; defaulting to stripe');
      return 'stripe';
    }
    return gateway;
  } catch (e) {
    warn('Gateway lookup failed:', e?.message || e);
    return 'stripe';
  }
}

export default getActivePaymentGateway;
