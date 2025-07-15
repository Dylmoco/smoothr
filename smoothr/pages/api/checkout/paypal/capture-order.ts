import type { NextApiRequest, NextApiResponse } from 'next';
import PayPal from '@paypal/checkout-server-sdk';
import { handleCheckout } from '../../../../../shared/checkout';

const env = process.env.PAYPAL_ENV === 'production'
  ? new PayPal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  : new PayPal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
const client = new PayPal.core.PayPalHttpClient(env);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { orderID } = req.body;
  const request = new PayPal.orders.OrdersAuthorizeRequest(orderID);

  try {
    const { result } = await client.execute(request);
    const data = await handleCheckout({ provider: 'paypal', paymentData: result });
    res.status(200).json({ success: data.success, order_id: data.order_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'PayPal capture failed' });
  }
}
