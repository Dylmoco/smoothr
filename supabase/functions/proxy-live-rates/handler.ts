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
  const token = "a45f3fb4ba674d089a2484adf5bd9262";
  console.log('🔑 Using hardcoded token:', token);

  let usedFallback = false;
  let payload;

  try {
    const url = `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=USD,GBP,EUR`;

    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmoothrProxy/1.0',
      },
    });

    console.log('✅ Fetch status:', response.status);
    if (!response.ok) {
      console.log('❌ Fetch failed:', await response.text());
      throw new Error('Fetch failed');
    }

    const data = await response.json();
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
    };
  } catch (_e) {
    usedFallback = true;
    payload = { ...FALLBACK, date: new Date().toISOString() };
  }

  if (usedFallback) {
    console.log('🚨 Using fallback rates');
  } else {
    console.log('✅ Using OpenExchangeRates live rates');
  }

  return new Response(JSON.stringify(payload), { headers: CORS_HEADERS });
}
