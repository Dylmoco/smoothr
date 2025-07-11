import supabase from './supabase/serverClient';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[generateOrderNumber]', ...args);
const err = (...args: any[]) => debug && console.error('[generateOrderNumber]', ...args);

if (!globalThis.generateOrderNumber) {
  globalThis.generateOrderNumber = async (storeId: string) => {
    log('CALLED — storeId:', storeId);

    if (!storeId) {
      err('storeId is undefined or missing!');
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
        err('Supabase query failed:', err);
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
        err('Counter increment failed:', err);
      throw err;
    }

    const orderNumber = `${prefix}-${String(next).padStart(4, '0')}`;

    log('Generated:', orderNumber);
    return orderNumber;
  };
}
export {};
