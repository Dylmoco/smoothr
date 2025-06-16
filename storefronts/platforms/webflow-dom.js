import { convertPrice, formatPrice, baseCurrency } from '../core/currency/index.js';

function getSelectedCurrency() {
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
  document.querySelectorAll('[data-smoothr-price]').forEach(el => {
    const amt = parseFloat(el.getAttribute('data-smoothr-price'));
    if (isNaN(amt)) return;
    const converted = convertPrice(amt, currency, baseCurrency);
    el.textContent = formatPrice(converted, currency);
  });
}

export function initCurrencyDom() {
  if (typeof document === 'undefined') return;
  replacePrices();
  document.addEventListener('smoothr:currencychange', replacePrices);
}

if (typeof window !== 'undefined') {
  initCurrencyDom();
}
