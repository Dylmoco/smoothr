/**
 * Utility functions for currency formatting and conversion.
 */

let baseCurrency = 'USD';
let rates = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8
};

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

export { init } from './init.js';

// Legacy function names maintained for backwards compatibility
export {
  convertPrice as convertCurrency,
  formatPrice as formatCurrency,
  rates,
  baseCurrency
};

