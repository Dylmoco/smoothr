import { getStoreIntegration } from '../getStoreIntegration';

const env = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
const baseUrl =
  env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout PayPal]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout PayPal]', ...args);

interface PayPalPayload {
  total: number;
  currency: string;
  description?: string;
  store_id: string;
}

export default async function handlePayPal(payload: PayPalPayload) {
  let clientId = process.env.PAYPAL_CLIENT_ID || '';
  let clientSecret = process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET || '';

  try {
    const integration = await getStoreIntegration(payload.store_id, 'paypal');
    if (integration) {
      clientId = integration.settings?.client_id || integration.api_key || clientId;
      clientSecret = integration.settings?.secret || clientSecret;
    }
  } catch (e) {
    err('Credential lookup failed:', e);
  }

  if (!clientId || !clientSecret) {
    err('Missing PayPal credentials');
    return { success: false, error: 'Missing PayPal credentials' } as const;
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const token = await tokenRes.json();
    log('PayPal token acquired');

    const orderBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: payload.currency,
            value: (payload.total / 100).toFixed(2)
          },
          ...(payload.description ? { description: payload.description } : {})
        }
      ]
    };

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderBody)
    });
    const order = await orderRes.json();
    log('PayPal order response:', JSON.stringify(order));
    return { success: true, order } as const;
  } catch (e: any) {
    err('PayPal error:', e?.message || e);
    return { success: false, error: e?.message || 'PayPal request failed' } as const;
  }
}
