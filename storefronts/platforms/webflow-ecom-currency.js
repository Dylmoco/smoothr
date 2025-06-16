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

function formatElement(el) {
  const amt = parseFloat(el.getAttribute('data-smoothr-price'));
  if (isNaN(amt)) return;
  const currency = getSelectedCurrency();
  const converted = convertPrice(amt, currency, baseCurrency);
  el.textContent = formatPrice(converted, currency);
}

function replacePrices(root = document) {
  root.querySelectorAll('[data-smoothr-price]').forEach(formatElement);
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
              if (node.matches && node.matches('[data-smoothr-price]')) {
                formatElement(node);
              }
              if (node.matches && node.id?.startsWith('currency-')) {
                bindCurrencyButtons(node);
              }
              if (node.querySelectorAll) {
                node
                  .querySelectorAll('[data-smoothr-price]')
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
    replacePrices();
    bindCurrencyButtons();
    observer?.observe(document.body, { childList: true, subtree: true });
  });

  document.addEventListener('smoothr:currencychange', () => replacePrices());
}

if (typeof window !== 'undefined') {
  initWebflowEcomCurrency();
}
