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
    product_id?: string;
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

  // Default objects so property lookups don't explode
  const shipping = payload.shipping || {} as any;
  const shipAddr = shipping.address || {} as any;

  if (!payload.payment_token && !payload.customer_profile_id) {
    console.log('[NMI Checkout] Using credentials: none');
    throw new Error('Missing payment credentials');
  }

  if (
    !shipAddr.line1 ||
    !shipAddr.city ||
    !shipAddr.state ||
    !shipAddr.postal_code ||
    !shipAddr.country
  ) {
    err('Missing required address fields');
    throw new Error('Missing payment credentials');
  }

  // Prepare NMI params with full details
  const params = new URLSearchParams({
    security_key: securityKey,
    type: 'auth',
    amount: (payload.amount / 100).toFixed(2),
    firstname: payload.first_name,
    lastname: payload.last_name,
    email: payload.email,
    address1: shipAddr.line1,
    address2: shipAddr.line2 || '',
    city: shipAddr.city,
    state: shipAddr.state,
    zip: shipAddr.postal_code,
    country: shipAddr.country,
    currency_code: payload.currency,
    shipping_firstname: payload.first_name,
    shipping_lastname: payload.last_name,
    shipping_address1: shipAddr.line1,
    shipping_address2: shipAddr.line2 || '',
    shipping_city: shipAddr.city,
    shipping_state: shipAddr.state,
    shipping_zip: shipAddr.postal_code,
    shipping_country: shipAddr.country,
    orderid: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`  // Unique ID for each payment
  });

  // 🔐 Credential Routing Logic
  if (payload.payment_token) {
    // ✅ Primary path: use new payment token
    params.append('payment_token', payload.payment_token);
    params.append('customer_vault', 'add_customer');
    console.log('[NMI Checkout] Using credentials: token');
  } else if (payload.customer_profile_id) {
    // ✅ Fallback: use vault
    params.append('customer_vault_id', payload.customer_profile_id);
    console.log('[NMI Checkout] Using credentials: vault');
  } else {
    // ❌ Error if neither is supplied
    console.log('[NMI Checkout] Using credentials: none');
    throw new Error('Missing payment credentials');
  }

  // Add billing if provided, else use shipping
  const billAddr = payload.billing?.address || shipAddr;
  params.append('billing_address1', billAddr.line1);
  params.append('billing_address2', billAddr.line2 || '');
  params.append('billing_city', billAddr.city);
  params.append('billing_state', billAddr.state);
  params.append('billing_zip', billAddr.postal_code);
  params.append('billing_country', billAddr.country);

  // Add cart items as products (NMI supports multiple product lines))
  payload.cart.forEach((item, index) => {
    // Fallback to empty string so "undefined" isn't sent when product_id is missing
    params.append(`product[${index}][sku]`, item.product_id || '');
    params.append(`product[${index}][description]`, item.name);
    params.append(`product[${index}][qty]`, item.quantity.toString());
    params.append(`product[${index}][price]`, (item.price / 100).toFixed(2));
  });

  try {
    log('NMI payload:', params.toString());
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

    // Parse the form encoded response into a plain object
    const responseParams = new URLSearchParams(text);
    const data: Record<string, string> = {};
    responseParams.forEach((value, key) => {
      data[key] = value;
    });

    const success = data.response === '1';

    if (!success) {
      return {
        success: false,
        error: data.responsetext || `NMI error (code ${data.response_code})`,
        transaction_id: null,
        customer_vault_id: null
      };
    }

    return {
      success: true,
      transaction_id: data.transactionid ?? null,
      customer_vault_id: data.customer_vault_id ?? null
    };
  } catch (e: any) {
    err('NMI error:', e?.message || e);
    return { success: false };
  }
}