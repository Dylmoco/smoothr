import {
  convertPrice,
  formatPrice,
  getSelectedCurrency,
  setSelectedCurrency,
  updateRates,
  getRates,
  setBaseCurrency,
  baseCurrency
} from './index.js';

let initialized = false;

const SUPABASE_ENDPOINT =
  'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates';
const REMOTE_ENDPOINT = 'https://api.exchangerate.host/latest';
const PRICE_SELECTOR = '[data-smoothr-price], [data-smoothr-total]';

function parsePriceText(text) {
  return parseFloat(text.replace(/[£$€]/g, '').replace(/[\,\s]/g, ''));
}

function getBaseAmount(el, attr) {
  let base = parseFloat(el.dataset.smoothrBase);
  if (isNaN(base)) {
    base =
      parseFloat(el.getAttribute(attr)) ||
      parsePriceText(el.textContent || '');
    if (!isNaN(base)) el.dataset.smoothrBase = base;
  }
  return base;
}

function updateDisplayedPrices() {
  if (!convertPrice || !formatPrice || !getSelectedCurrency) return;
  const currency = getSelectedCurrency();
  document.querySelectorAll(PRICE_SELECTOR).forEach(el => {
    const attr = el.hasAttribute('data-smoothr-total')
      ? 'data-smoothr-total'
      : 'data-smoothr-price';
    const base = getBaseAmount(el, attr);
    if (isNaN(base)) return;
    const converted = convertPrice(base, currency, baseCurrency);
    el.textContent = formatPrice(converted, currency);
    el.setAttribute(attr, converted);
  });
}

function bindCurrencySelectors(root = document) {
  if (!setSelectedCurrency) return;
  root.querySelectorAll('[id^="currency-"]').forEach(el => {
    const code = el.id.slice('currency-'.length).toUpperCase();
    if (el.__smoothrCurrencyBound) return;
    el.addEventListener('click', () => setSelectedCurrency(code));
    el.__smoothrCurrencyBound = true;
  });
}

async function fetchRates(base, symbols, token) {
  if (typeof fetch === 'undefined') return null;
  const headers = { Accept: 'application/json' };
  let url;
  if (token) {
    url = `${SUPABASE_ENDPOINT}?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
    headers.Authorization = `Token ${token}`;
  } else {
    url = `${REMOTE_ENDPOINT}?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch rates');
  const data = await res.json();
  const out = {};
  symbols.forEach(code => {
    if (typeof data?.rates?.[code] === 'number') out[code] = data.rates[code];
  });
  return out;
}

export async function init(config = {}) {
  if (initialized) return window.Smoothr?.currency;

  if (config.baseCurrency && setBaseCurrency) setBaseCurrency(config.baseCurrency);
  const base = config.baseCurrency || baseCurrency || 'USD';
  const token = config?.settings?.liveRatesToken;
  try {
    const symbols = Object.keys(getRates ? getRates() : {});
    const fetched = await fetchRates(base, symbols, token);
    if (fetched && updateRates) updateRates(fetched);
  } catch {}

  if (typeof document !== 'undefined') {
    updateDisplayedPrices();
    bindCurrencySelectors();
    document.addEventListener('smoothr:currencychange', updateDisplayedPrices);
  }

  if (typeof window !== 'undefined') {
    const Smoothr = (window.Smoothr = window.Smoothr || {});
    window.smoothr = window.smoothr || Smoothr;
    Smoothr.currency = {
      setCurrency: setSelectedCurrency,
      getCurrency: getSelectedCurrency,
      getRates: getRates || (() => ({})),
      convertPrice,
      formatPrice,
      baseCurrency
    };
    window.smoothr.currency = Smoothr.currency;
  }

  initialized = true;
  return window.Smoothr?.currency;
}

