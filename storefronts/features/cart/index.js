// Core cart module for Smoothr SDK
import { getConfig } from '../config/globalConfig.js';
const STORAGE_KEY = 'smoothr_cart';

// Resolve the debug flag lazily so that configuration can be loaded
// before the cart module accesses it. This avoids ReferenceErrors when
// the module is imported prior to configuration being merged.
const log = (...args) => getConfig().debug && console.log('[Smoothr Cart]', ...args);
const warn = (...args) => getConfig().debug && console.warn('[Smoothr Cart]', ...args);
const err = (...args) => getConfig().debug && console.error('[Smoothr Cart]', ...args);

// Some builds reference a minified `al` variable for localStorage access.
// Define it safely here so imports never throw in environments without
// localStorage (e.g. server-side rendering or tests).
let al =
  globalThis.al ||
  ((typeof window !== 'undefined' && window.localStorage)
    ? window.localStorage
    : typeof globalThis !== 'undefined'
    ? globalThis.localStorage
    : undefined);
globalThis.al = al;
globalThis.il = globalThis.il || al;

// Some builds expect a minified helper `ll`. Provide a safe fallback.
const ll = globalThis.ll || {};
globalThis.ll = ll;

// Ensure the cart storage key exists so JSON.parse does not throw later.
try {
  if (al && al.getItem(STORAGE_KEY) == null) {
    al.setItem(
      STORAGE_KEY,
      JSON.stringify({ items: [], meta: { lastModified: Date.now() } })
    );
  }
} catch {
  // ignore storage errors
}

function getStorage() {
  return al || null;
}

export function readCart() {
  const storage = getStorage();
  if (!storage) {
    return { items: [], meta: { lastModified: Date.now() } };
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    warn('invalid data', err);
  }
  return { items: [], meta: { lastModified: Date.now() } };
}

function writeCart(cart) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    err('write failed', err);
  }
}

function dispatchUpdate(cart) {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(
      new CustomEvent('smoothr:cart:updated', { detail: cart })
    );
  }
}

export function getCart() {
  return readCart();
}

export function getMeta() {
  return getCart().meta || {};
}

export function setMetaField(key, value) {
  const cart = readCart();
  cart.meta = cart.meta || {};
  cart.meta[key] = value;
  cart.meta.lastModified = Date.now();
  writeCart(cart);
  dispatchUpdate(cart);
}

export function addItem(item) {
  const cart = readCart();
  const existing = cart.items.find(i => i.product_id === item.product_id);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.items.push({ ...item, quantity: item.quantity || 1 });
  }
  cart.meta.lastModified = Date.now();
  writeCart(cart);
  dispatchUpdate(cart);
}

export function removeItem(product_id) {
  const cart = readCart();
  cart.items = cart.items.filter(i => i.product_id !== product_id);
  cart.meta.lastModified = Date.now();
  writeCart(cart);
  dispatchUpdate(cart);
}

export function updateQuantity(product_id, qty) {
  const cart = readCart();
  const item = cart.items.find(i => i.product_id === product_id);
  if (!item) return;
  if (qty <= 0) {
    cart.items = cart.items.filter(i => i !== item);
  } else {
    item.quantity = qty;
  }
  cart.meta.lastModified = Date.now();
  writeCart(cart);
  dispatchUpdate(cart);
}

export function clearCart() {
  const cart = { items: [], meta: { lastModified: Date.now() } };
  writeCart(cart);
  dispatchUpdate(cart);
}

export function getSubtotal() {
  return readCart().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function applyDiscount(discount) {
  const cart = readCart();
  cart.discount = discount;
  cart.meta.lastModified = Date.now();
  writeCart(cart);
  dispatchUpdate(cart);
}

export function getDiscount() {
  return readCart().discount || null;
}

export function getTotal() {
  const cart = readCart();
  let subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (cart.discount) {
    if (cart.discount.type === 'percent') {
      subtotal -= Math.round(subtotal * (cart.discount.amount / 100));
    } else {
      subtotal -= cart.discount.amount;
    }
  }
  return subtotal < 0 ? 0 : subtotal;
}

export async function initCart() {
  const debug =
    typeof window !== 'undefined' &&
    window.location?.search?.includes('smoothr-debug=true');
  try {
    if (typeof window === 'undefined') return;
    const Smoothr = (window.Smoothr = window.Smoothr || {});
    if (!Smoothr.config) {
      if (debug) {
        console.groupCollapsed('[Smoothr]');
        console.error('Smoothr.config is required before initializing the cart');
        console.groupEnd();
      }
      return;
    }

    try {
      if (window.localStorage.getItem(STORAGE_KEY) == null) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ items: [], meta: { lastModified: Date.now() } })
        );
      }
    } catch (e) {
      if (debug) {
        console.groupCollapsed('[Smoothr]');
        console.error('Failed to access localStorage', e);
        console.groupEnd();
      }
    }

    al = window.localStorage || globalThis.localStorage;
    globalThis.al = al;

    Smoothr.cart = {
      readCart,
      getCart,
      getMeta,
      setMetaField,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getSubtotal,
      applyDiscount,
      getDiscount,
      getTotal,
    };
    return Smoothr.cart;
  } catch (e) {
    if (debug) {
      console.groupCollapsed('[Smoothr]');
      console.error('Cart initialization failed', e);
      console.groupEnd();
    }
  }
}

export default (async () => {
  try {
    await initCart();
  } catch (err) {
    console.warn('[Smoothr SDK] Cart initialization failed', err);
  }
})();
