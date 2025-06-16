export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const FALLBACK = {
  base: 'GBP',
  rates: {
    USD: 1.25,
    EUR: 1.17,
    GBP: 1,
  },
};

export async function handleRequest(
  req: Request,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const token = Deno.env.get('OPENEXCHANGERATES_TOKEN') || ''
  console.log('Loaded token:', token)
  let usedFallback = false
  let payload
  try {
    const apiUrl =
      `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=USD,EUR,GBP`;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    const res = await fetchFn(apiUrl, { redirect: 'manual', headers });
    const rawText = await res.text();
    const data = JSON.parse(rawText);
    if (!res.ok) {
      throw new Error('Fetch failed');
    }
    if (!data.rates || typeof data.rates.USD !== 'number') {
      throw new Error('Invalid rates structure');
    }
    const gbpRate = data.rates.GBP;
    const convertedRates = {
      USD: data.rates.USD / gbpRate,
      EUR: data.rates.EUR / gbpRate,
      GBP: 1,
    };
    payload = {
      base: 'GBP',
      date: new Date(data.timestamp * 1000).toISOString(),
      rates: convertedRates,
    }
  } catch (_e) {
    usedFallback = true
    payload = { ...FALLBACK, date: new Date().toISOString() }
  }

  if (usedFallback) {
    console.log('🚨 Using fallback rates')
  } else {
    console.log('✅ Using OpenExchangeRates live rates')
  }
  return new Response(JSON.stringify(payload), { headers: CORS_HEADERS })
}
