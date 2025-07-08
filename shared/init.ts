import supabase from './supabase/serverClient';

if (!globalThis.generateOrderNumber) {
  globalThis.generateOrderNumber = async (storeId: string) => {
    const { data, error } = await supabase
      .from('stores')
      .select('prefix, order_sequence')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      throw new Error('Failed to fetch store prefix/sequence');
    }

    const next = Number(data.order_sequence) + 1;
    return `${data.prefix}-${String(next).padStart(4, '0')}`;
  };
}
export {};
