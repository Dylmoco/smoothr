const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout NMI]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout NMI]', ...args);

import { getStoreIntegration } from '../getStoreIntegration';

interface NmiPayload {
  payment_token?: string; // Optional for vaulted payments
  customer_profile_id?: string; // Optional vault ID for repeat payments
  amount: number;
  store_id: string;
  first_name: string;
  last_name: string;
  email: string;
  shipping: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  billing?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  cart: Array<{
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  currency: string;
}

export default async function handleNmi(payload: NmiPayload) {
  let securityKey = '';

  try {
    const creds = await getStoreIntegration(payload.store_id, 'nmi');
    securityKey = creds?.settings?.api_key || creds?.api_key || '';
  } catch (e) {
    err('getStoreIntegration error:', e);
  }

  if (!securityKey.trim()) {
    console.warn('[Checkout NMI] Missing security key');
    return { success: false, error: 'Missing security key' };
  }

  // Prepare NMI params with full details
  const params = new URLSearchParams({
    security_key: securityKey,
    type: 'sale',
    amount: (payload.amount / 100).toFixed(2),
    firstname: payload.first_name,
    lastname: payload.last_name,
    email: payload.email,
    address1: payload.shipping.address.line1,
    address2: payload.shipping.address.line2 || '',
    city: payload.shipping.address.city,
    state: payload.shipping.address.state,
    zip: payload.shipping.address.postal_code,
    country: payload.shipping.address.country,
    currency_code: payload.currency,
    shipping_firstname: payload.first_name,
    shipping_lastname: payload.last_name,
    shipping_address1: payload.shipping.address.line1,
    shipping_address2: payload.shipping.address.line2 || '',
    shipping_city: payload.shipping.address.city,
    shipping_state: payload.shipping.address.state,
    shipping_zip: payload.shipping.address.postal_code,
    shipping_country: payload.shipping.address.country,
    orderid: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`  // Unique ID for each payment
  });

  if (payload.customer_profile_id) {
    params.append('customer_vault_id', payload.customer_profile_id);
  } else {
    params.append('customer_vault', 'add_customer');
    params.append('payment_token', payload.payment_token || '');
  }

  // Add billing if provided, else use shipping
  const billAddr = payload.billing?.address || payload.shipping.address;
  params.append('billing_address1', billAddr.line1);
  params.append('billing_address2', billAddr.line2 || '');
  params.append('billing_city', billAddr.city);
  params.append('billing_state', billAddr.state);
  params.append('billing_zip', billAddr.postal_code);
  params.append('billing_country', billAddr.country);

  // Add cart items as products (NMI supports multiple product lines)
  payload.cart.forEach((item, index) => {
    params.append(`product[${index}][sku]`, item.product_id);
    params.append(`product[${index}][description]`, item.name);
    params.append(`product[${index}][qty]`, item.quantity.toString());
    params.append(`product[${index}][price]`, (item.price / 100).toFixed(2));
  });

  try {
    const res = await fetch(
      'https://secure.networkmerchants.com/api/transact.php',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );
    const text = await res.text();
    log('NMI response:', text);
    const data = new URLSearchParams(text);
    const success = data.get('response') === '1';
    return {
      success,
      data,
      transaction_id: data.get('transactionid') ?? null,
      customer_vault_id: data.get('customer_vault_id') ?? null // Capture for new vaults
    };
  } catch (e: any) {
    err('NMI error:', e?.message || e);
    return { success: false };
  }
}