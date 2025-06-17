export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  const token = Deno.env.get('OPENEXCHANGERATES_TOKEN');
  console.log('✅ Token loaded from env:', token);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.headers.get('Authorization') !== 'Token eca2385f63504d80a624d130cce7e240') {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401, headers: CORS_HEADERS },
    );
  }

  let usedFallback = false;
  let payload;

  try {
    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') ?? 'GBP';
    const symbolsParam = searchParams.get('symbols') ?? 'USD,EUR,GBP';
    const requestedSymbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const oersSymbols = Array.from(new Set([...requestedSymbols, base])).join(',');

    const url = `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=${oersSymbols}`;

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
    const baseRate = base === 'USD' ? 1 : data.rates[base];
    const convertedRates: Record<string, number> = {};
    for (const sym of requestedSymbols) {
      if (sym === base) {
        convertedRates[sym] = 1;
      } else {
        convertedRates[sym] = data.rates[sym] / baseRate;
      }
    }
    if (!requestedSymbols.includes(base)) {
      convertedRates[base] = 1;
    }
    payload = {
      base,
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
