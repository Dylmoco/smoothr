const CACHE = new Map();
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type'
};

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
    return new Response(JSON.stringify(cached.data), {
      headers: CORS_HEADERS
    });
  }
  try {
    const apiUrl = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
    let data;
    try {
      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'SmoothrCurrencyBot/1.0' }
      });
      if (!res.ok) {
        console.error('Exchange fetch status', res.status);
        console.error('Exchange fetch body', await res.text());
        throw new Error('Fetch failed');
      }
      data = await res.json();
    } catch (e) {
      console.error('Exchange fetch error', e);
      throw e;
    }
    const rates = {};
    symbols.forEach(code => {
      if (typeof data.rates[code] === 'number') {
        rates[code] = data.rates[code];
      }
    });
    const payload = { base, date: data.date || new Date().toISOString(), rates };
    CACHE.set(cacheKey, { timestamp: now, data: payload });
    return new Response(JSON.stringify(payload), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error('Failed to fetch live rates', err);
    const fallback = {
      base: 'GBP',
      date: new Date().toISOString(),
      rates: { USD: 1.25, EUR: 1.17, GBP: 1 }
    };
    return new Response(JSON.stringify(fallback), {
      headers: CORS_HEADERS
    });
  }
}
