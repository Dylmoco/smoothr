import { createClient } from '../../supabase/client.js';
const supabase = createClient();
import { SMOOTHR_CONFIG } from '../config.js';

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', SMOOTHR_CONFIG.storeId);

  if (error) {
    console.error('[Smoothr] Failed to fetch orders:', error);
    return [];
  }

  return data || [];
}
