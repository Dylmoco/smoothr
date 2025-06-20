console.log("🔥 Smoothr live-rates function triggered");

// Default endpoint used when no custom rateSource is provided. This proxies
// requests through a Supabase Edge Function to avoid Cloudflare redirect
// issues.
const DEFAULT_RATE_SOURCE =
  'https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP';

// Endpoint requiring auth token
const PROXY_LIVE_RATES_ENDPOINT =
  'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates';
// Token used when hitting PROXY_LIVE_RATES_ENDPOINT. Inject via env var at build time.
const PROXY_AUTH_TOKEN =
  typeof process !== 'undefined' ? process.env.PROXY_LIVE_RATES_TOKEN : undefined;

export async function fetchExchangeRates(
  base = 'GBP',
  symbols = ['USD', 'EUR', 'GBP'],
  rateSource
) {
  if (typeof fetch === 'undefined') return null;

  const CACHE_KEY = 'smoothrRatesCache';
  if (typeof window !== 'undefined') {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.base === base && Date.now() - cached.timestamp < 86400000) {
        if (symbols.every(code => cached.rates[code])) {
          return cached.rates;
        }
      }
    } catch {}
  }

  try {
    const source = rateSource || DEFAULT_RATE_SOURCE;
    let url = source;
    const params = [];
    if (!/[?&]base=/.test(source)) {
      params.push(`base=${encodeURIComponent(base)}`);
    }
    if (!/[?&]symbols=/.test(source)) {
      params.push(`symbols=${symbols.join(',')}`);
    }
    if (params.length) {
      url += (source.includes('?') ? '&' : '?') + params.join('&');
    }
    const headers = {
      'User-Agent': 'SmoothrCurrencyBot/1.0',
      Accept: 'application/json'
    };
    try {
      const { hostname, pathname } = new URL(url);
      if (
        hostname.endsWith('.functions.supabase.co') &&
        pathname === '/proxy-live-rates' &&
        PROXY_AUTH_TOKEN
      ) {
        headers.Authorization = `Token ${PROXY_AUTH_TOKEN}`;
      }
    } catch {}
    const res = await fetch(url, {
      headers,
      redirect: 'manual'
    });
    if (!res.ok) throw new Error('Failed to fetch rates');
    const data = await res.json();
    const rates = {};
    symbols.forEach(code => {
      if (typeof data.rates[code] === 'number') {
        rates[code] = data.rates[code];
      }
    });
    if (typeof window !== 'undefined' && !data.fallback) {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), base, rates })
        );
      } catch {}
    }
    return rates;
  } catch {
    return null;
  }
}
