import { createClient } from '@supabase/supabase-js';

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
  console.log('Headers:', headers);

  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('Invalid JSON:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log('Payload:', payload);

  const { siteId } = payload;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const email = payload.customerInfo?.email || null;
  let customerId: string | null = null;

  if (email) {
    const { data: existing, error: lookupError } = await supabase
      .from('customers')
      .select('id')
      .eq('store_id', siteId)
      .eq('email', email)
      .maybeSingle();

    if (lookupError) {
      console.error('Customer lookup error:', lookupError);
      return new Response(
        JSON.stringify({ error: lookupError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (existing) {
      customerId = existing.id as string;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('customers')
        .insert({ store_id: siteId, email })
        .select('id')
        .single();

      if (insertError) {
        console.error('Customer insert error:', insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
      customerId = inserted?.id ?? null;
    }
  }

  // Insert the incoming Webflow order into the existing `orders` table
  const { error } = await supabase.from('orders').insert({
    customer_email: email,
    customer_id: customerId,
    platform: payload.platform || 'webflow',
    store_id: siteId,
    raw_data: payload,
    tracking_number: null,
    label_url: null,
    problem_flag: false,
    flag_reason: null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Insert error:', error);
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
