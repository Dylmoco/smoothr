const CACHE = new Map();

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const base = (url.searchParams.get('base') || 'GBP').toUpperCase();
  const symbolsParam = url.searchParams.get('symbols');
  const symbols = symbolsParam
    ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : ['USD', 'EUR', 'GBP'];
  const cacheKey = `${base}:${symbols.join(',')}`;
  const cached = CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < 86400000) {
    return new Response(JSON.stringify({ rates: cached.rates }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  try {
    const apiUrl = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    const rates = {};
    symbols.forEach(code => {
      if (typeof data.rates[code] === 'number') {
        rates[code] = data.rates[code];
      }
    });
    CACHE.set(cacheKey, { timestamp: now, rates });
    return new Response(JSON.stringify({ rates }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('Failed to fetch live rates', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch live rates' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
