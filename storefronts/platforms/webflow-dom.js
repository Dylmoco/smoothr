import { convertPrice, formatPrice, baseCurrency } from '../core/currency/index.js';

const PRICE_SELECTOR =
  '[data-smoothr-price], [data-smoothr-total], [data-smoothr="price"]';

function parsePriceText(text) {
  return parseFloat(text.replace(/[£$€]/g, '').replace(/[\,\s]/g, ''));
}

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
  document.querySelectorAll(PRICE_SELECTOR).forEach(el => {
    const attr = el.hasAttribute('data-smoothr-total')
      ? 'data-smoothr-total'
      : 'data-smoothr-price';
    let amt = parseFloat(el.getAttribute(attr));
    if (isNaN(amt)) {
      amt = parsePriceText(el.textContent || '');
      if (!isNaN(amt)) {
        el.setAttribute(attr, amt);
      }
    }
    if (isNaN(amt)) return;
    const converted = convertPrice(amt, currency, baseCurrency);
    el.textContent = formatPrice(converted, currency);
    el.setAttribute(attr, converted);
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
