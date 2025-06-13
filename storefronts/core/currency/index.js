/**
 * Manages basic currency formatting and conversion utilities.
 */

const rates = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8
};

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function convertCurrency(amount, from = 'USD', to = 'USD') {
  if (!rates[from] || !rates[to]) {
    throw new Error('Unsupported currency');
  }
  const inUsd = amount / rates[from];
  return inUsd * rates[to];
}
