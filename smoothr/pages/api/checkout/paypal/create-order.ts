import type { NextApiRequest, NextApiResponse } from 'next';
import PayPal from '@paypal/checkout-server-sdk';
import { getStoreIntegration } from 'shared/checkout/getStoreIntegration';



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { amount, currency, store_id } = req.body as any;
  if (!store_id) {
    return res.status(400).json({ error: 'store_id required' });
  }

  let clientId = '';
  let secret = '';
  try {
    const integration = await getStoreIntegration(store_id, 'paypal');
    if (integration) {
      clientId = integration.settings?.client_id || integration.api_key || clientId;
      secret = integration.settings?.secret || secret;
    }
  } catch (e) {
    console.error('[PayPal] credential lookup failed', e);
  }

  if (!clientId || !secret) {
    return res.status(400).json({ error: 'Missing PayPal credentials' });
  }

  const env = process.env.PAYPAL_ENV === 'production'
    ? new PayPal.core.LiveEnvironment(clientId, secret)
    : new PayPal.core.SandboxEnvironment(clientId, secret);
  const client = new PayPal.core.PayPalHttpClient(env);

  const request = new PayPal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'AUTHORIZE',
    purchase_units: [{ amount: { currency_code: currency, value: amount.toString() } }]
  });

  try {
    const { result } = await client.execute(request);
    res.status(200).json({ id: result.id });
  } catch (err) {
    console.error('[PayPal create-order] failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'PayPal order creation failed' });
  }
}
