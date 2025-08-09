import { createClient } from 'https://esm.sh/@supabase/supabase-js';
export async function handleRequest(req) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Missing Supabase credentials'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405
    });
  }
  const headers = Object.fromEntries(req.headers.entries());
  console.log('Headers:', headers);
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('Invalid JSON:', err);
    return new Response(JSON.stringify({
      error: 'Invalid JSON payload'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  console.log('Payload:', payload);
  const { orderId, customerInfo, lineItems, total, siteId, createdOn } = payload;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from('orders').insert({
    order_id: orderId,
    email: customerInfo?.email,
    line_items: lineItems,
    total,
    site_id: siteId,
    created_at: createdOn ? new Date(createdOn).toISOString() : new Date().toISOString()
  });
  if (error) {
    console.error('Insert error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
Deno.serve(handleRequest);
