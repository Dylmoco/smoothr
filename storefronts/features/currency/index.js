import { fetchExchangeRates } from './fetchLiveRates.js';

/**
 * Manages currency formatting, conversion and basic DOM integration.
 */

let baseCurrency = 'USD';
let rates = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8
};

let initialized = false;
let debug = false;

export function setBaseCurrency(currency) {
  baseCurrency = currency;
}

export function updateRates(newRates = {}) {
  rates = { ...rates, ...newRates };
}

export function getRates() {
  return { ...rates };
}

export function convertPrice(amount, to = baseCurrency, from = baseCurrency) {
  if (!rates[from] || !rates[to]) {
    throw new Error('Unsupported currency');
  }
  const inBase = amount / rates[from];
  return inBase * rates[to];
}

export function formatPrice(amount, currency = baseCurrency, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

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

export function getSelectedCurrency() {
  if (typeof window === 'undefined') return baseCurrency;
  return localStorage.getItem('smoothr:currency') || baseCurrency;
}

export function setSelectedCurrency(currency) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('smoothr:currency', currency);
  document.dispatchEvent(
    new CustomEvent('smoothr:currencychange', { detail: { currency } })
  );
}

function replacePrices() {
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

function bindCurrencyButtons(root = document) {
  root.querySelectorAll('[id^="currency-"]').forEach(el => {
    const code = el.id.slice('currency-'.length).toUpperCase();
    if (el.__smoothrCurrencyBound) return;
    el.addEventListener('click', () => setSelectedCurrency(code));
    el.__smoothrCurrencyBound = true;
  });
}

function updateGlobalCurrency() {
  if (typeof window !== 'undefined') {
    window.Smoothr = window.Smoothr || {};
    window.Smoothr.currency = {
      setCurrency: setSelectedCurrency,
      getCurrency: getSelectedCurrency,
      getRates,
      convertPrice,
      formatPrice,
      fetchExchangeRates
    };
    window.smoothr = window.smoothr || window.Smoothr;
    window.smoothr.currency = window.Smoothr.currency;
  }
}

export async function init(config = {}) {
  if (initialized) return window.Smoothr?.currency;

  if (typeof window !== 'undefined') {
    window.SMOOTHR_CONFIG = { ...(window.SMOOTHR_CONFIG || {}), ...config };
    const debugQuery =
      new URLSearchParams(window.location.search).get('smoothr-debug') ===
      'true';
    debug = window.SMOOTHR_CONFIG?.debug || debugQuery;
  }

  if (config.baseCurrency) setBaseCurrency(config.baseCurrency);

  try {
    const symbols = Object.keys(rates);
    const fetched = await fetchExchangeRates(baseCurrency, symbols);
    if (fetched) updateRates(fetched);
  } catch {}

  updateGlobalCurrency();

  if (typeof document !== 'undefined') {
    const ready = () => {
      replacePrices();
      bindCurrencyButtons();
    };
    if (document.readyState !== 'loading') ready();
    else document.addEventListener('DOMContentLoaded', ready);
    document.addEventListener('smoothr:currencychange', replacePrices);
  }

  if (debug) {
    console.log('[Smoothr] Currency module loaded');
  }

  initialized = true;
  return window.Smoothr?.currency;
}

// Legacy function names maintained for backwards compatibility
export {
  convertPrice as convertCurrency,
  formatPrice as formatCurrency,
  rates,
  baseCurrency,
  fetchExchangeRates
};

