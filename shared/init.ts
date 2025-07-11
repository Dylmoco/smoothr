import supabase from './supabase/serverClient';

if (!globalThis.generateOrderNumber) {
  globalThis.generateOrderNumber = async (storeId: string) => {
    console.log('[generateOrderNumber] CALLED — storeId:', storeId);

    if (!storeId) {
      console.error('[generateOrderNumber] storeId is undefined or missing!');
      throw new Error('storeId is required for order number generation');
    }

    let prefix: string | undefined;
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('prefix')
        .eq('id', storeId)
        .single();

      prefix = data?.prefix;
      if (error || !prefix) throw new Error('No store prefix returned');
    } catch (err) {
      console.error('[generateOrderNumber] Supabase query failed:', err);
      throw err;
    }

    let next: number | null = null;
    try {
      const { data, error } = await supabase.rpc(
        'increment_store_order_number',
        { p_store_id: storeId },
      );
      if (error || data == null) throw error;
      next = data as number;
    } catch (err) {
      console.error('[generateOrderNumber] Counter increment failed:', err);
      throw err;
    }

    const orderNumber = `${prefix}-${String(next).padStart(4, '0')}`;

    console.log('[generateOrderNumber] Generated:', orderNumber);
    return orderNumber;
  };
}
export {};
