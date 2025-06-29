import { convertPrice, formatPrice, baseCurrency } from './index.js';

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

function bindCurrencyButtons(root = document) {
  root.querySelectorAll('[id^="currency-"]').forEach(el => {
    const code = el.id.slice('currency-'.length).toUpperCase();
    if (el.__smoothrCurrencyBound) return;
    el.addEventListener('click', () => setSelectedCurrency(code));
    el.__smoothrCurrencyBound = true;
  });
}

export function initCmsCurrency() {
  if (typeof document === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    replacePrices();
    bindCurrencyButtons();
  });
  document.addEventListener('smoothr:currencychange', replacePrices);
}

if (typeof window !== 'undefined') {
  initCmsCurrency();
}
