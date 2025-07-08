import supabase from './supabase/serverClient';

if (!globalThis.generateOrderNumber) {
  globalThis.generateOrderNumber = async (storeId: string) => {
    let store: { prefix: string; order_sequence: number } | null = null;
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('prefix, order_sequence')
        .eq('id', storeId)
        .single();

      store = data;
      if (error || !store) throw new Error('No store returned');
    } catch (err) {
      console.error('[generateOrderNumber] Supabase query failed:', err);
      throw err;
    }

    if (!store?.prefix || store.order_sequence == null) {
      console.error(
        '[generateOrderNumber] Failed to fetch store prefix/sequence',
        { storeId, error: null, data: store },
      );
      throw new Error('Invalid store data or missing prefix/sequence');
    }

    const next = Number(store.order_sequence) + 1;
    const orderNumber = `${store.prefix}-${String(next).padStart(4, '0')}`;
    console.log('[generateOrderNumber] Generated:', orderNumber);
    return orderNumber;
  };
}
export {};
