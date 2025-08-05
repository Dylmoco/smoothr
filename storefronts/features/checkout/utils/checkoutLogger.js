import waitForElement from './waitForElement.js';

export default function checkoutLogger(block = document) {
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
  const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);
  const err = (...args) => debug && console.error('[Smoothr Checkout]', ...args);
  const select = sel => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return document.querySelector(sel);
    }
    return waitForElement(sel, 5000);
  };
  const q = sel => block.querySelector(sel) || document.querySelector(sel);
  return { log, warn, err, select, q };
}
