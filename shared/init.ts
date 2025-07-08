import supabase from './supabase/serverClient';

if (!globalThis.generateOrderNumber) {
  console.log('[init] Registering globalThis.generateOrderNumber');

  globalThis.generateOrderNumber = async (storeId: string) => {
    console.log('[hook] generateOrderNumber invoked with storeId:', storeId);

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('prefix, order_sequence')
        .eq('id', storeId)
        .single();

      if (error || !data) {
        console.error('[hook] Supabase fetch failed:', error);
        throw new Error('Failed to fetch store prefix/sequence');
      }

      const next = Number(data.order_sequence) + 1;
      const result = `${data.prefix}-${String(next).padStart(4, '0')}`;
      console.log('[hook] Returning order number:', result);
      return result;
    } catch (err) {
      console.error('[hook] generateOrderNumber threw:', err);
      throw err;
    }
  };
}
export {};
