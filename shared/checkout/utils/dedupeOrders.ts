import { SupabaseClient } from '@supabase/supabase-js';

export interface DedupeParams {
  store_id: string;
  customer_id: string | null;
  total: number;
  cart_meta_hash: string;
}

export interface ExistingOrder {
  id: string;
  created_at: string;
  status: string;
  payment_intent_id: string | null;
}

export async function dedupeOrders(
  supabase: SupabaseClient,
  params: DedupeParams
): Promise<ExistingOrder | null> {
  const { store_id, customer_id, total, cart_meta_hash } = params;
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, status, payment_intent_id')
    .eq('store_id', store_id)
    .eq('customer_id', customer_id)
    .eq('total_price', total)
    .eq('cart_meta_hash', cart_meta_hash)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Order lookup failed: ${error.message}`);
  }

  if (data && data.length > 0) {
    return data[0] as ExistingOrder;
  }

  return null;
}
