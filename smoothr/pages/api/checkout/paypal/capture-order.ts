
import type { NextApiRequest, NextApiResponse } from 'next';
import PayPal from '@paypal/checkout-server-sdk';
// Use the tsconfig path alias and point at the actual file
import { handleCheckout } from 'shared/checkout/handleCheckout';

const env =
  process.env.PAYPAL_ENV === 'production'
    ? new PayPal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_SECRET!
      )
    : new PayPal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_SECRET!
      );
const client = new PayPal.core.PayPalHttpClient(env);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { orderID } = req.body;
  const request = new PayPal.orders.OrdersAuthorizeRequest(orderID);

  try {
    const { result } = await client.execute(request);

    // Inject the raw PayPal result into the body so handleCheckout sees it
    // alongside your existing payload (store_id, cart, shipping, etc.)
    req.body = {
      ...req.body,
      paymentData: result,
    };

    // Delegate to your shared checkout handler
    return handleCheckout({ req, res });
  } catch (err) {
    console.error('[PayPal Capture Error]', err);
    return res
      .status(500)
      .json({ success: false, error: 'PayPal capture failed' });
  }
}