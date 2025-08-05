/**
 * Manages basic currency formatting and conversion utilities.
 *
 * The module exposes a few helpers that rely on a configurable base currency
 * and dynamic conversion rates. `updateRates` can be called at runtime to
 * supply live exchange data while `setBaseCurrency` defines the store's
 * primary currency. `convertPrice` always defaults to using the current base
 * currency as the source value unless another `from` currency is provided.
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

// Legacy function names maintained for backwards compatibility
export {
  convertPrice as convertCurrency,
  formatPrice as formatCurrency,
  rates,
  baseCurrency
};
