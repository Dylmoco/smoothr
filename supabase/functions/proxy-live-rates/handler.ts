export async function handleRequest(
  req: Request,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const token = Deno.env.get('OPENEXCHANGERATES_TOKEN');
  if (!token) {
    return new Response(
      JSON.stringify({
        code: 500,
        message: 'OPENEXCHANGERATES_TOKEN is not set',
      }),
      { status: 500 },
    );
  }

  const url = `https://openexchangerates.org/api/latest.json?app_id=${token}&symbols=USD,EUR,GBP`;
  const res = await fetchFn(url);

  if (!res.ok) {
    const errorText = await res.text();
    return new Response(
      JSON.stringify({
        code: 500,
        message: 'Fetch failed',
        detail: `Status ${res.status}: ${errorText}`,
      }),
      { status: 500 },
    );
  }

  const data = await res.json();
  const { searchParams } = new URL(req.url);
  const base = searchParams.get('base') || 'GBP';

  const divider = data.rates[base];
  if (!divider) {
    return new Response(
      JSON.stringify({
        code: 400,
        message: `Invalid base currency: ${base}`,
      }),
      { status: 400 },
    );
  }

  const rates: Record<string, number> = {};
  for (const [k, v] of Object.entries<number>(data.rates)) {
    rates[k] = v / divider;
  }
  rates[base] = 1;

  return new Response(
    JSON.stringify({
      base,
      rates,
      date: new Date(data.timestamp * 1000).toISOString(),
    }),
  );
}
