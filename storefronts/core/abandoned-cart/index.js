/**
 * Abandoned cart tracking utilities.
 *
 * This module monitors cart activity and user interactions to detect
 * when a shopper might have abandoned their cart. The collected metadata
 * can be used by future recovery flows (emails, webhooks, etc.).
 */

const STORAGE_KEY = 'smoothr_cart_meta';
let isSetup = false;

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('smoothr:abandoned-cart', ...args);
const warn = (...args) => debug && console.warn('smoothr:abandoned-cart', ...args);
const err = (...args) => debug && console.error('smoothr:abandoned-cart', ...args);

function readMeta() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    warn('invalid meta', err);
  }
  return {};
}

function writeMeta(meta) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch (err) {
    err('write failed', err);
  }
}

function ensureSessionId(meta) {
  if (meta.sessionId) return meta.sessionId;
  let id;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    id = crypto.randomUUID();
  } else {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  meta.sessionId = id;
  return id;
}

function parseUtm() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  ['source', 'medium', 'campaign'].forEach(k => {
    const val = params.get('utm_' + k);
    if (val) utm[k] = val;
  });
  return utm;
}

export function setupAbandonedCartTracker(opts = {}) {
  if (isSetup || typeof window === 'undefined') return;
  isSetup = true;

  const debug = !!opts.debug;
  const meta = readMeta();

  ensureSessionId(meta);
  if (!meta.referrer && typeof document !== 'undefined') {
    meta.referrer = document.referrer || '';
  }
  if (!meta.utm || Object.keys(meta.utm).length === 0) {
    meta.utm = parseUtm();
  }

  meta.lastActive = Date.now();
  writeMeta(meta);

  const updateModified = () => {
    const m = readMeta();
    m.lastModified = Date.now();
    writeMeta(m);
    if (debug) console.log('smoothr:abandoned-cart lastModified', m.lastModified);
  };

  const updateActive = () => {
    const m = readMeta();
    m.lastActive = Date.now();
    writeMeta(m);
    if (debug) console.log('smoothr:abandoned-cart lastActive', m.lastActive);
  };

  window.addEventListener('smoothr:cart:updated', updateModified);
  ['click', 'keydown', 'scroll', 'mousemove'].forEach(evt => {
    window.addEventListener(evt, updateActive);
  });
}

export function triggerRecoveryFlow() {
  // Placeholder for future recovery logic
}

export default {
  setupAbandonedCartTracker,
  triggerRecoveryFlow
};
