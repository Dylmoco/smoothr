const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Rates]', ...args);

function getAuthToken() {
  return (
    (typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.liveRatesToken) ||
    (typeof process !== 'undefined' && process.env.LIVE_RATES_AUTH_TOKEN)
  );
}


// Default endpoint used when no custom rateSource is provided. This proxies
// requests through a Supabase Edge Function to avoid Cloudflare redirect
// issues.
const DEFAULT_RATE_SOURCE =
  'https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP';

// Endpoint requiring auth token
const PROXY_LIVE_RATES_ENDPOINT =
  'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates';

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
      Accept: 'application/json'
    };
    if (typeof window === 'undefined') {
      headers['User-Agent'] = 'SmoothrCurrencyBot/1.0';
    }
    try {
      const { hostname, pathname } = new URL(url);
      if (
        hostname.endsWith('.functions.supabase.co') &&
        pathname === '/proxy-live-rates'
      ) {
        const token = getAuthToken();
        if (token) {
          headers.Authorization = `Token ${token}`;
        }
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
