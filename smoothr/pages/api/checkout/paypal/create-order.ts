import type { NextApiRequest, NextApiResponse } from 'next';
import PayPal from '@paypal/checkout-server-sdk';

const env = process.env.PAYPAL_ENV === 'production'
  ? new PayPal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  : new PayPal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
const client = new PayPal.core.PayPalHttpClient(env);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { amount, currency } = req.body;
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
    console.error(err);
    res.status(500).json({ error: 'PayPal order creation failed' });
  }
}
