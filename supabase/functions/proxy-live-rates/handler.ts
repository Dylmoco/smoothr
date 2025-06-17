export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handleRequest(
  req: Request,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const token = Deno.env.get('OPENEXCHANGERATES_TOKEN');

  if (!token) {
    console.error('❌ ENV TOKEN IS MISSING AT RUNTIME');
    return new Response(
      JSON.stringify({ code: 500, message: 'OPENEXCHANGERATES_TOKEN is not set at runtime' }),
      { status: 500, headers: CORS_HEADERS },
    );
  }

  console.log('✅ Token is present. Proceeding to fetch…');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.headers.get('Authorization') !== 'Token eca2385f63504d80a624d130cce7e240') {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401, headers: CORS_HEADERS },
    );
  }

  let payload;

  try {
    const { searchParams } = new URL(req.url);
    const base = (searchParams.get('base') ?? 'GBP').toUpperCase();
    const symbolsParam = searchParams.get('symbols') ?? 'USD,EUR,GBP';
    const requestedSymbols = symbolsParam
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const url =
      `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=USD,EUR,GBP`;
    console.log('ℹ️ Fetching', url.replace(token, '[redacted]'));

    let response: Response;
    try {
      response = await fetchFn(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SmoothrProxy/1.0',
        },
      });
    } catch (err) {
      const detail = (err as Error).message;
      console.error('❌ Fetch error:', detail);
      return new Response(
        JSON.stringify({ code: 500, message: 'Fetch failed', detail }),
        { status: 500, headers: CORS_HEADERS },
      );
    }
    if (!response.ok) {
      const errText = await response.text();
      console.error(
        '❌ OpenExchangeRates response:',
        response.status,
        errText,
      );
      return new Response(
        JSON.stringify({
          code: 500,
          message: 'Fetch failed',
          detail: `Status ${response.status}: ${errText}`,
        }),
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const data = await response.json();

    let finalBase = 'USD';
    let normalizedRates: Record<string, number> = { ...data.rates };
    if (base === 'GBP' || base === 'EUR') {
      const divider = data.rates[base];
      normalizedRates = {
        USD: data.rates.USD / divider,
        EUR: data.rates.EUR / divider,
        GBP: data.rates.GBP / divider,
      };
      normalizedRates[base] = 1;
      finalBase = base;
    }

    const filteredRates: Record<string, number> = {};
    for (const sym of requestedSymbols) {
      if (normalizedRates[sym] !== undefined) {
        filteredRates[sym] = normalizedRates[sym];
      }
    }
    if (!requestedSymbols.includes(finalBase)) {
      filteredRates[finalBase] = 1;
    }

    payload = {
      base: finalBase,
      date: new Date(data.timestamp * 1000).toISOString(),
      rates: filteredRates,
    };
  } catch (err) {
    const detail = (err as Error).message;
    return new Response(
      JSON.stringify({ code: 500, message: 'Fetch failed', detail }),
      { status: 500, headers: CORS_HEADERS },
    );
  }

  console.log('✅ Using OpenExchangeRates live rates');

  return new Response(JSON.stringify(payload), { headers: CORS_HEADERS });
}
