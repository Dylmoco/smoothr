console.log('proxy-live-rates function started');
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};
export async function handleRequest(req) {
  // Handle OPTIONS preflight request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }
  try {
    const token = Deno.env.get('OPENEXCHANGERATES_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({
        code: 500,
        message: 'OPENEXCHANGERATES_TOKEN is not set'
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
    const url = `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=USD,EUR,GBP`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({
        code: 500,
        message: 'Fetch failed',
        detail: `Status ${res.status}: ${errorText}`
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
    const data = await res.json();
    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') || 'GBP';
    const divider = data.rates[base];
    if (!divider) {
      return new Response(JSON.stringify({
        code: 400,
        message: `Invalid base currency: ${base}`
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }
    const rates = {};
    for (const [k, v] of Object.entries(data.rates)){
      rates[k] = v / divider;
    }
    rates[base] = 1;
    return new Response(JSON.stringify({
      base,
      rates,
      date: new Date(data.timestamp * 1000).toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  } catch (err) {
    console.error('Unexpected error in proxy-live-rates:', err);
    return new Response(JSON.stringify({
      code: 500,
      message: 'Internal Server Error',
      detail: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
