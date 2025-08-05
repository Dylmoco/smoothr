import { convertPrice, formatPrice, baseCurrency } from '../../core/currency/index.js';

const PRICE_SELECTOR =
  '[data-smoothr-price], [data-smoothr-total], [data-smoothr="price"]';

function parsePriceText(text) {
  return parseFloat(text.replace(/[£$€]/g, '').replace(/[\,\s]/g, ''));
}

function getBaseAmount(el, attr) {
  if (el.hasAttribute('data-product-price')) {
    return parseFloat(el.getAttribute('data-product-price'));
  }

  let base = parseFloat(el.dataset.smoothrBase);
  if (isNaN(base)) {
    base =
      parseFloat(el.getAttribute(attr)) ||
      parsePriceText(el.textContent || '');
    if (!isNaN(base)) el.dataset.smoothrBase = base;
  }
  return base;
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
    const base = getBaseAmount(el, attr);
    if (isNaN(base)) return;
    const converted = convertPrice(base, currency, baseCurrency);
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
