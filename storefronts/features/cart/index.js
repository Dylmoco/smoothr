const STORAGE_KEY = 'smoothr_cart';

const getDebug = () => window.Smoothr?.config?.debug;
const log = (...args) => getDebug() && console.log('[Smoothr Cart]', ...args);
const warn = (...args) => getDebug() && console.warn('[Smoothr Cart]', ...args);
const err = (...args) => getDebug() && console.error('[Smoothr Cart]', ...args);

function getStorage() {
  try {
    return (
      globalThis.al ||
      (typeof window !== 'undefined' && window.localStorage) ||
      globalThis.localStorage ||
      null
    );
  } catch {
    return null;
  }
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

