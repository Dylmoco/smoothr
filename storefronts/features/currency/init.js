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
import { mergeConfig, getConfig } from '../config/globalConfig.js';
import { fetchExchangeRates } from './fetchLiveRates.js';

let initialized = false;
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

async function domReady() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
}

function updateGlobalCurrency() {
  if (typeof globalThis !== 'undefined') {
    globalThis.setSelectedCurrency = setSelectedCurrency;
  }
  if (typeof window === 'undefined') {
    return {
      setCurrency: setSelectedCurrency,
      getCurrency: getSelectedCurrency,
      getRates: getRates || (() => ({})),
      convertPrice,
      formatPrice,
      fetchExchangeRates
    };
  }
  const Smoothr = (window.Smoothr = window.Smoothr || {});
  window.smoothr = window.smoothr || Smoothr;
  Smoothr.currency = {
    setCurrency: setSelectedCurrency,
    getCurrency: getSelectedCurrency,
    getRates: getRates || (() => ({})),
    convertPrice,
    formatPrice,
    fetchExchangeRates
  };
  window.smoothr.currency = Smoothr.currency;
  return Smoothr.currency;
}

export async function init(config = {}) {
  if (initialized) return window.Smoothr?.currency;

  mergeConfig({
    ...config,
    ...(config.settings?.liveRatesToken
      ? { liveRatesToken: config.settings.liveRatesToken }
      : {}),
    ...(config.rateSource ? { rateSource: config.rateSource } : {})
  });

  const cfg = getConfig();
  const debug = typeof window !== 'undefined' && cfg.debug;
  const log = (...args) => debug && console.log('[Smoothr Currency]', ...args);

  if (cfg.baseCurrency && setBaseCurrency) setBaseCurrency(cfg.baseCurrency);
  const base = cfg.baseCurrency || baseCurrency || 'USD';

  await domReady();

  try {
    const symbols = Object.keys(getRates ? getRates() : {});
    const fetched = await fetchExchangeRates(base, symbols, cfg.rateSource);
    if (fetched && updateRates) updateRates(fetched);
  } catch (err) {
    log('Failed to fetch exchange rates', err);
  }

  if (typeof document !== 'undefined') {
    updateDisplayedPrices();
    bindCurrencySelectors();
    document.addEventListener('smoothr:currencychange', updateDisplayedPrices);
  }

  const helper = updateGlobalCurrency();

  initialized = true;
  return helper;
}

