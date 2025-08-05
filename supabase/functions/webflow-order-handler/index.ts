import { createClient } from '@supabase/supabase-js';
import { findOrCreateCustomer } from '../../../shared/lib/findOrCreateCustomer.ts';

const debug = Deno.env.get('SMOOTHR_DEBUG') === 'true';
const log = (...args: any[]) => debug && console.log('[webflow-order]', ...args);
const warn = (...args: any[]) => debug && console.warn('[webflow-order]', ...args);
const errorLog = (...args: any[]) => debug && console.error('[webflow-order]', ...args);

export async function handleRequest(req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const headers = Object.fromEntries(req.headers.entries());
  log('Headers:', headers);

  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    errorLog('Invalid JSON:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  log('Payload:', payload);

  const { siteId } = payload;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  });

  const email = payload.customerInfo?.email || null;
  let customerId: string | null = null;

  if (email) {
    try {
      customerId = await findOrCreateCustomer(supabase, siteId, email);
    } catch (err: any) {
      errorLog('Customer error:', err);
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Insert the incoming Webflow order into the simplified `orders` table
  const { error } = await supabase.from('orders').insert({
    store_id: siteId,
    customer_id: customerId,
    order_number: payload.orderId,
    status: payload.orderStatus || 'paid',
    payment_provider: payload.processor || null,
    total_price: payload.total,
  });

  if (error) {
    errorLog('Insert error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, site_id: siteId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}

Deno.serve(handleRequest);
