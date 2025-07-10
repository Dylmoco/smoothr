import { convertPrice, formatPrice, baseCurrency } from '../../core/currency/index.js';

const PRICE_ATTR_SELECTOR =
  '[data-smoothr-price], [data-smoothr-total], [data-smoothr="price"]';

const PRICE_SELECTORS = [
  '.w-commerce-commerceproductprice',
  '.w-commerce-commercecartitemprice',
  '.product-price'
];

function parsePriceText(text) {
  return parseFloat(
    text
      .replace(/[£$€]/g, '')
      .replace(/[,\s]/g, '')
  );
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

function formatElement(el) {
  const attr = el.hasAttribute('data-smoothr-total')
    ? 'data-smoothr-total'
    : 'data-smoothr-price';
  const base = getBaseAmount(el, attr);
  if (isNaN(base)) return;
  const currency = getSelectedCurrency();
  const converted = convertPrice(base, currency, baseCurrency);
  el.textContent = formatPrice(converted, currency);
  el.setAttribute(attr, converted);
}

function bindPriceElements(root = document) {
  const els = [];
  if (root.matches) {
    if (PRICE_SELECTORS.some(sel => root.matches(sel)) || root.matches(PRICE_ATTR_SELECTOR)) {
      els.push(root);
    }
  }
  if (root.querySelectorAll) {
    root
      .querySelectorAll([...PRICE_SELECTORS, PRICE_ATTR_SELECTOR].join(','))
      .forEach(el => els.push(el));
  }
  els.forEach(el => {
    const attr = el.hasAttribute('data-smoothr-total')
      ? 'data-smoothr-total'
      : 'data-smoothr-price';
    if (!el.hasAttribute(attr)) {
      const amt = parsePriceText(el.textContent || '');
      if (!isNaN(amt)) {
        el.dataset.smoothrBase = amt;
        if (window.SMOOTHR_CONFIG?.debug) {
          console.log('smoothr:bind-price', el, amt);
        }
      }
    }
    formatElement(el);
  });
}

function replacePrices(root = document) {
  bindPriceElements(root);
  root.querySelectorAll(PRICE_ATTR_SELECTOR).forEach(formatElement);
}

function bindCurrencyButtons(root = document) {
  if (root.id && root.id.startsWith('currency-')) {
    const code = root.id.slice('currency-'.length).toUpperCase();
    if (!root.__smoothrCurrencyBound) {
      root.addEventListener('click', () => setSelectedCurrency(code));
      root.__smoothrCurrencyBound = true;
    }
  }
  root.querySelectorAll('[id^="currency-"]').forEach(el => {
    const code = el.id.slice('currency-'.length).toUpperCase();
    if (el.__smoothrCurrencyBound) return;
    el.addEventListener('click', () => setSelectedCurrency(code));
    el.__smoothrCurrencyBound = true;
  });
}

export function initWebflowEcomCurrency() {
  if (typeof document === 'undefined') return;

  const observer =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(muts => {
          muts.forEach(m => {
            m.addedNodes.forEach(node => {
              if (node.nodeType !== 1) return;
              bindPriceElements(node);
              if (node.matches && node.matches(PRICE_ATTR_SELECTOR)) {
                formatElement(node);
              }
              if (node.matches && node.id?.startsWith('currency-')) {
                bindCurrencyButtons(node);
              }
              if (node.querySelectorAll) {
                node
                  .querySelectorAll(PRICE_ATTR_SELECTOR)
                  .forEach(formatElement);
                node
                  .querySelectorAll('[id^="currency-"]')
                  .forEach(el => bindCurrencyButtons(el));
              }
            });
          });
        })
      : null;

  document.addEventListener('DOMContentLoaded', () => {
    bindPriceElements();
    replacePrices();
    bindCurrencyButtons();
    observer?.observe(document.body, { childList: true, subtree: true });
  });

  document.addEventListener('smoothr:currencychange', () => replacePrices());
}

if (typeof window !== 'undefined') {
  initWebflowEcomCurrency();
}
