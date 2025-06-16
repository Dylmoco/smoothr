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
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  try {
    const apiUrl =
      `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=USD,EUR,GBP`;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    const payload = {
      base: 'GBP',
      date: new Date(data.timestamp * 1000).toISOString(),
      rates: convertedRates,
    };
    return new Response(JSON.stringify(payload), { headers: CORS_HEADERS });
  } catch (_e) {
    const fallbackPayload = { ...FALLBACK, date: new Date().toISOString() };
    return new Response(JSON.stringify(fallbackPayload), { headers: CORS_HEADERS });
  }
}
