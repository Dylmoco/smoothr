import { getConfig } from '../config/globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const log = (...args) => debug && console.log('[Smoothr Rates]', ...args);

function getAuthToken() {
  return (
    (typeof window !== 'undefined' && getConfig().liveRatesToken) ||
    (typeof process !== 'undefined' && process.env.LIVE_RATES_AUTH_TOKEN)
  );
}

function getSupabaseUrl() {
  return (
    (typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.supabaseUrl) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env.SUPABASE_URL)
  );
}

function resolveDefaultSource() {
  const cfgRate =
    typeof window !== 'undefined' &&
    window.SMOOTHR_CONFIG?.settings?.rateSource;
  const envRate =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVE_RATES_URL) ||
    (typeof process !== 'undefined' && process.env.LIVE_RATES_URL);
  if (cfgRate) return cfgRate;
  if (envRate) return envRate;
  const supabase = getSupabaseUrl();
  return supabase
    ? `${supabase.replace('.co', '.co/functions')}/proxy-live-rates`
    : null;
}

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
    const source = rateSource || resolveDefaultSource();
    if (!source) {
      console.warn('[Smoothr Rates] Missing live rates URL; skipping fetch');
      return null;
    }
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
      const proxyEndpoint = getSupabaseUrl()
        ? `${getSupabaseUrl().replace('.co', '.co/functions')}/proxy-live-rates`
        : null;
      const { hostname, pathname } = new URL(url);
      if (proxyEndpoint) {
        const proxyUrl = new URL(proxyEndpoint);
        if (hostname === proxyUrl.hostname && pathname === proxyUrl.pathname) {
          const token = getAuthToken();
          if (token) {
            headers.Authorization = `Token ${token}`;
          }
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
