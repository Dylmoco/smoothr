import Stripe from 'stripe';
import crypto from 'crypto';
import { getStoreIntegration } from '../getStoreIntegration';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout Stripe]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout Stripe]', ...args);

interface StripePayload {
  payment_method: string;
  email: string;
  first_name: string;
  last_name: string;
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
  cart: any[];
  total: number;
  currency: string;
  description?: string;
  metaCartString: string;
  store_id: string;
}

export default async function handleStripe(payload: StripePayload) {
  const integration = await getStoreIntegration(payload.store_id, 'stripe');
  const stripeSecret =
    integration?.settings?.secret_key ||
    integration?.api_key ||
    '';
  if (!stripeSecret.trim()) {
    err('Missing Stripe credentials');
    return { success: false, error: 'Missing credentials' };
  }
  if (stripeSecret.startsWith('pk_')) {
    console.warn('[Checkout Stripe] Using publishable key on server');
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
  const { payment_method, total, currency, shipping } = payload;
  const { name, address } = shipping || {};
  const { line1, city, state, postal_code, country } = address || {};

  if (
    !payment_method ||
    typeof total !== 'number' ||
    !currency ||
    !name ||
    !line1 ||
    !city ||
    !state ||
    !postal_code ||
    !country
  ) {
    err('Missing required fields');
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${payload.email}-${payload.total}-${payload.metaCartString}`)
      .digest('hex');

    const intent = await stripe.paymentIntents.create(
      {
        amount: payload.total,
        currency: payload.currency,
        payment_method: payload.payment_method,
        confirm: true,
        ...(payload.description ? { description: payload.description } : {}),
        metadata: {
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          cart: payload.metaCartString
        },
        shipping: payload.shipping
      },
      { idempotencyKey }
    );
    log('Stripe PaymentIntent created:', intent.id);
    return { success: true, transaction_id: intent.id };
  } catch (err: any) {
    console.error('Stripe Error:', err);
    return { success: false, error: err?.message || 'Stripe checkout failed' };
  }
}
