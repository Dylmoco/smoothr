import 'shared/init';
import { createServerSupabaseClient } from 'shared/supabase/serverClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { store_id: storeId, customer_id: customerId } = req.body || {};
  if (!storeId || !customerId) {
    return res.status(400).json({ error: 'store_id and customer_id required' });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(email, name)')
      .eq('store_id', storeId)
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false });
    if (error) {
      return res
        .status(500)
        .json({ error: 'Failed to fetch orders', detail: error.message });
    }
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
