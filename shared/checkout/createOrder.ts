import supabase from '../supabase/serverClient';

const generateOrderNumber =
  (globalThis as any).generateOrderNumber as ((storeId: string) => Promise<string>) | undefined;

export interface CreateOrderPayload {
  email: string;
  name: string;
  cart: any[];
  total_price: number;
  currency: string;
  gateway: string;
  platform?: string;
  shipping?: any;
  billing?: any;
  store_id: string;
  order_number?: string;
  customer_id?: string | null;
}

export async function createOrder(payload: CreateOrderPayload) {
  const {
    email,
    name,
    cart,
    total_price,
    currency,
    gateway,
    platform,
    shipping,
    billing,
    store_id,
    order_number,
  } = payload;

  if (!store_id) {
    throw new Error('store_id is required');
  }

  let orderNumber: string | undefined = order_number;
  if (!orderNumber) {
    try {
      if (!generateOrderNumber) throw new Error('generateOrderNumber not defined');
      orderNumber = await generateOrderNumber(store_id);
    } catch (err: any) {
      throw new Error('Failed to generate order number');
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: 'unpaid',
      payment_provider: gateway,
      total_price,
      store_id,
      customer_id: payload.customer_id ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
