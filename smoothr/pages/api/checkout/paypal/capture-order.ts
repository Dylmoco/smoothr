
import type { NextApiRequest, NextApiResponse } from 'next';
import PayPal from '@paypal/checkout-server-sdk';
import { handleCheckout } from 'shared/checkout/handleCheckout';
import { getStoreIntegration } from 'shared/checkout/getStoreIntegration';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  interface CaptureOrderBody {
    orderID: string;
    store_id: string;
  }
  const { orderID, store_id } = req.body as CaptureOrderBody;
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
  } catch {
    // PayPal credential lookup failed
  }

  if (!clientId || !secret) {
    return res.status(400).json({ error: 'Missing PayPal credentials' });
  }

  const env = process.env.PAYPAL_ENV === 'production'
    ? new PayPal.core.LiveEnvironment(clientId, secret)
    : new PayPal.core.SandboxEnvironment(clientId, secret);
  const client = new PayPal.core.PayPalHttpClient(env);

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
  } catch (err: unknown) {
    return res
      .status(500)
      .json({ success: false, error: err instanceof Error ? err.message : 'PayPal capture failed' });
  }
}