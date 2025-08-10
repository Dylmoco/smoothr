// shared/checkout/providers/nmi.ts

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout NMI]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout NMI]', ...args);

import { getStoreIntegration } from '../getStoreIntegration';

interface NmiPayload {
  payment_token?: string;
  customer_profile_id?: string;
  amount: number;
  store_id: string;
  first_name: string;
  last_name: string;
  email: string;
  shipping?: {
    name: string;
    address?: {
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

  // 1) Try DB integration
  try {
    const creds = await getStoreIntegration(payload.store_id, 'nmi');
    securityKey = creds?.settings?.api_key || creds?.api_key || '';
  } catch (e) {
    err('getStoreIntegration error:', e);
  }

  // 2) Fallback to env var if DB missing
  if (!securityKey.trim()) {
    securityKey = process.env.NMI_SECURITY_KEY || '';
  }

  // 3) If still missing, return error
  if (!securityKey.trim()) {
    console.warn('[Checkout NMI] Missing security key');
    return { success: false, error: 'Missing security key' };
  }

  // 4) Require payment_token or customer_profile_id up‑front
  const { payment_token, customer_profile_id } = payload;
  if (!payment_token && !customer_profile_id) {
    throw new Error('Missing payment credentials');
  }

  // 5) Guard shipping.address for tests that omit it
  const ship = payload.shipping?.address || {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  };

  // 6) Build core params
  const params = new URLSearchParams({
    security_key:    securityKey,
    type:            'auth',
    amount:          (payload.amount / 100).toFixed(2),
    firstname:       payload.first_name,
    lastname:        payload.last_name,
    email:           payload.email,
    address1:        ship.line1,
    address2:        ship.line2 || '',
    city:            ship.city,
    state:           ship.state,
    zip:             ship.postal_code,
    country:         ship.country,
    currency_code:   payload.currency,
    shipping_firstname: payload.first_name,
    shipping_lastname:  payload.last_name,
    shipping_address1:  ship.line1,
    shipping_address2:  ship.line2 || '',
    shipping_city:      ship.city,
    shipping_state:     ship.state,
    shipping_zip:       ship.postal_code,
    shipping_country:   ship.country,
    orderid:            `${Date.now()}-${Math.random().toString(36).substring(2,7)}`
  });

  // 7) Credential routing
  if (payment_token) {
    params.append('payment_token', payment_token);
    params.append('customer_vault', 'add_customer');
    log('Using credentials: token');
  } else {
    params.append('customer_vault_id', customer_profile_id!);
    log('Using credentials: vault');
  }

  // 8) Billing fallback
  const billAddr = payload.billing?.address || ship;
  params.append('billing_address1', billAddr.line1);
  params.append('billing_address2', billAddr.line2 || '');
  params.append('billing_city',     billAddr.city);
  params.append('billing_state',    billAddr.state);
  params.append('billing_zip',      billAddr.postal_code);
  params.append('billing_country',  billAddr.country);

  // 9) Cart items
  payload.cart.forEach((item, i) => {
    params.append(`product[${i}][sku]`,         item.product_id || '');
    params.append(`product[${i}][description]`, item.name);
    params.append(`product[${i}][qty]`,         item.quantity.toString());
    params.append(`product[${i}][price]`,       (item.price / 100).toFixed(2));
  });

  // 10) Dispatch request
  try {
    log('NMI payload:', params.toString());
    const res = await fetch('https://secure.networkmerchants.com/api/transact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const text = await res.text();
    log('NMI response:', text);

    const responseParams = new URLSearchParams(text);
    const data: Record<string,string> = {};
    responseParams.forEach((v,k) => { data[k] = v });

    if (data.response !== '1') {
      return {
        success: false,
        error: data.responsetext || `NMI error (code ${data.response_code})`,
        transaction_id: null,
        customer_vault_id: null
      };
    }

    return {
      success: true,
      transaction_id:    data.transactionid  ?? null,
      customer_vault_id: data.customer_vault_id ?? null
    };
  } catch (e: any) {
    err('NMI error:', e?.message || e);
    return { success: false };
  }
}
