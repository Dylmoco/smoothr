// checkout.js

import bindCardInputs from './utils/inputFormatters.js';
import checkoutLogger from './utils/checkoutLogger.js';
import resolveGateway from './utils/resolveGateway.js';
import collectFormFields from './utils/collectFormFields.js';
import constructPayload from './utils/constructPayload.js';
import gatewayDispatcher from './utils/gatewayDispatcher.js';
import {
  computeCartHash,
  disableButton,
  enableButton
} from './utils/cartHash.js';
import { loadPublicConfig } from '../config/sdkConfig.js';
import { getConfig, mergeConfig } from '../config/globalConfig.js';
import { platformReady } from '../../utils/platformReady.js';
import loadScriptOnce from '../../utils/loadScriptOnce.js';

// Some builds expect a minified global `el` helper for DOM queries. Provide a
// simple wrapper so imports referencing it don't throw.
const el = globalThis.el || (sel => document.querySelector(sel));
globalThis.el = el;

// Some builds reference a minified helper `rl`. Ensure it exists.
const rl = globalThis.rl || {};
globalThis.rl = rl;

// Ensure a minified global placeholder `Gc` exists for compatibility with
// legacy bundles that reference it.
const Gc = globalThis.Gc || {};
globalThis.Gc = Gc;

// Some builds reference a minified helper `Jc`. Provide a safe fallback.
let Jc;
try {
  Jc = globalThis.Jc || {};
  globalThis.Jc = Jc;
} catch {
  Jc = {};
}

// Some environments expect a minified helper `Vc`. Provide a safe fallback.
let Vc;
try {
  Vc = globalThis.Vc || {};
  globalThis.Vc = Vc;
} catch {
  Vc = {};
}

  // Some builds reference a minified helper `Yc`. Provide a safe fallback.
  let Yc;
  try {
    Yc = globalThis.Yc || {};
    globalThis.Yc = Yc;
  } catch {
    Yc = {};
  }

// Some builds reference a minified helper `Xc`. Provide a safe fallback.
let Xc;
try {
  Xc = globalThis.Xc || {};
  globalThis.Xc = Xc;
} catch {
  Xc = {};
}

// Some builds reference a minified helper `vc`. Provide a safe fallback.
let vc;
try {
  vc = globalThis.vc || {};
  globalThis.vc = vc;
} catch {
  vc = {};
}

let __checkoutInitialized = false;
export function __test_resetCheckout() {
  __checkoutInitialized = false;
  try {
    if (typeof window !== 'undefined') {
      if (window.Smoothr) delete window.Smoothr.checkout;
      if (window.smoothr) delete window.smoothr.checkout;
    }
  } catch {}
}

function forEachPayButton(fn) {
  // TODO: Remove legacy [data-smoothr-pay] support once all projects are migrated.
  document
    .querySelectorAll('[data-smoothr="pay"], [data-smoothr-pay]')
    .forEach(fn);
}

const sdkUrls = {
  stripe: 'https://js.stripe.com/v3/',
  authorizeNet: 'https://jstest.authorize.net/v1/Accept.js',
  nmi: 'https://secure.nmi.com/token/Collect.js'
};

const sdkGlobals = {
  stripe: 'Stripe',
  authorizeNet: 'Accept',
  nmi: 'CollectJS'
};

const gatewayModules = {
  stripe: () => import('./gateways/stripeGateway.js'),
  authorizeNet: () => import('./gateways/authorizeNet.js'),
  paypal: () => import('./gateways/paypal.js'),
  nmi: () => import('./gateways/nmiGateway.js'),
  segpay: () => import('./gateways/segpay.js')
};

async function init({ config, supabase, adapter } = {}) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    __checkoutInitialized = false;
  }
  if (__checkoutInitialized) return window.Smoothr?.checkout;

  const Sc = (globalThis.Sc = config || {});
  const globalConfig = config || {};

  try {
    mergeConfig({ ...config, supabase });
    await platformReady();

    const debug = getConfig().debug;
    if (debug) console.log('[Smoothr] init', config);

    let isSubmitting = false;
    const { log, warn, err, select, q } = checkoutLogger();

    const publicConfig = await loadPublicConfig(
      getConfig().storeId,
      getConfig().supabase
    );
    if (publicConfig) {
      mergeConfig(publicConfig);
    }

    log('SDK initialized');
    log('SMOOTHR_CONFIG', JSON.stringify(getConfig()));

    if (!getConfig().supabase && !supabase) {
      warn('Supabase client missing.');
    }

    let provider;
    try {
      const cfg = getConfig();
      provider = resolveGateway(cfg, cfg.settings);
    } catch (e) {
      warn('Gateway resolution failed:', e?.message || e);
      return;
    }
    if (!provider) {
      warn('No active payment gateway resolved. Aborting init.');
      return;
    }
    if (sdkUrls[provider]) {
      try {
        const timeout = provider === 'stripe' ? 10000 : undefined;
        await loadScriptOnce(sdkUrls[provider], {
          timeout,
          globalVar: sdkGlobals[provider]
        });
      } catch (e) {
        if (getConfig().debug) {
          const msg =
            provider === 'stripe'
              ? '[Smoothr Checkout] Failed to load Stripe SDK'
              : '[Smoothr Checkout] Failed to load gateway script';
          console.error(msg, e);
        }
        warn('Failed to load gateway SDK:', e?.message || e);
        return;
      }
    }

  const loadGateway = gatewayModules[provider];
  if (!loadGateway) throw new Error(`Unknown payment gateway: ${provider}`);
  const gateway = (await loadGateway()).default;
  log(`Using gateway: ${provider}`);

  // mount fields common to all gateways
  // wait for a checkout trigger; support legacy [data-smoothr-pay]
  let payButtons = document.querySelectorAll('[data-smoothr="pay"]');
  if (!payButtons.length) {
    await select('[data-smoothr-pay]');
    payButtons = document.querySelectorAll('[data-smoothr-pay]');
  } else {
    await select('[data-smoothr="pay"]');
  }

  if (debug) console.log('[Smoothr] Found pay buttons:', payButtons.length);
  if (!payButtons.length) {
    const path = window.location?.pathname || '';
    const isCheckoutPath = /checkout|cart/.test(path);
    if (debug) {
      warn('No checkout trigger found. Add a [data-smoothr="pay"] element or delay init.');
    } else if (isCheckoutPath) {
      console.warn(
        '[Smoothr Checkout]',
        'No checkout trigger found. Add a [data-smoothr="pay"] element or delay init.'
      );
    }
    return;
  }

  if (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    !document.querySelector('#smoothr-card-styles')
  ) {
    const style = document.createElement('style');
    style.id = 'smoothr-card-styles';
    style.textContent =
      '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:block;position:relative;}\niframe[data-accept-id]{display:block!important;}';
    document.head.appendChild(style);
  }

  // assign gateway methods to global namespace
  window.Smoothr = window.Smoothr || window.smoothr || {};
  window.smoothr = window.Smoothr;
  window.Smoothr.checkout = {
    ...(window.Smoothr.checkout || {}),
    version: 'dev6',
    ...gateway
  };

  __checkoutInitialized = true;

  const checkoutEl = payButtons[0];
  log('checkout trigger found', checkoutEl);

  const fields = collectFormFields(q);
  let { emailField } = fields;
  if (!emailField) emailField = await select('[data-smoothr-email]');
  const totalEl = await select('[data-smoothr-total]');

  if (typeof gateway.ready === 'function') {
    try {
      await Promise.race([
        Promise.resolve(gateway.ready()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]);
    } catch (_) {
      if (provider === 'stripe' && getConfig().debug) {
        console.error('[Smoothr Checkout] Stripe SDK timed out');
      }
      console.warn('[Smoothr Checkout] Gateway timed out');
      return;
    }
  }

  try {
    await gateway.mountCheckout(config);
  } catch (e) {
    if (provider === 'stripe' && getConfig().debug) {
      console.error('[Smoothr Checkout] Stripe mount failed', e);
    }
    warn('Mount failed:', e?.message || e);
    return;
  }

  if (!gateway.isMounted()) {
    warn('Gateway mount failed');
    return;
  }
  bindCardInputs();

  // NMI handles its own click flow
  if (provider === 'nmi') {
    log('Skipping shared click binding for NMI');
    return;
  }

  payButtons.forEach(btn => {
    const isForm = btn.tagName.toLowerCase() === 'form';
    const eventName = isForm ? 'submit' : 'click';
    btn.addEventListener(eventName, async e => {
      e.preventDefault();
      e.stopPropagation();

      const provider = getConfig().active_payment_gateway;

      if (isSubmitting) {
        warn('Checkout already in progress');
        return;
      }
      isSubmitting = true;
      forEachPayButton(disableButton);
      clearErrorMessages();
      log('[data-smoothr="pay"] triggered');

      const {
        email,
        first_name,
        last_name,
        shipping,
        billing,
        bill_first_name,
        bill_last_name
      } = collectFormData(fields, emailField);

      const validationErrors = validateFormData({ email, first_name, last_name, shipping });
      if (validationErrors.length) {
        showValidationErrors(validationErrors);
        forEachPayButton(enableButton);
        isSubmitting = false;
        return;
      }

      if (typeof gateway.ready === 'function') {
        try {
          await Promise.race([
            Promise.resolve(gateway.ready()),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
          ]);
        } catch (_) {
          console.warn('[Smoothr Checkout] Gateway timed out');
          showUserMessage('Payment system loading, please wait.', 'error');
          forEachPayButton(enableButton);
          isSubmitting = false;
          return;
        }
      }

      const cart = window.Smoothr.cart.getCart() || { items: [] };
      const items = Array.isArray(cart.items) ? cart.items : [];
      const total = Math.round(
        (window.Smoothr.cart.getTotal?.() || parseFloat(totalEl.textContent.replace(/[^0-9.]/g, '')) || 0) * 100
      );
      const cfg = getConfig();
      const currency = cfg.baseCurrency;
      const customer_id = window.smoothr.auth.user?.value?.id || null;
      const store_id = cfg.storeId;
      const platform = cfg.platform;

      const cartHash = await computeCartHash(items, total, email);
      const last = JSON.parse(localStorage.getItem('smoothr_last_submission') || '{}');
      if (last.hash === cartHash && last.success && Date.now() - last.timestamp < 60000) {
        showUserMessage("You've already submitted this order.", 'warning');
        forEachPayButton(enableButton);
        isSubmitting = false;
        return;
      }

      try {
        const { error: pmErr, payment_method } = await gateway.createPaymentMethod({ ...billing, email });
        if (pmErr || !payment_method) {
          const msg = getPaymentMethodErrorMessage(pmErr);
          showUserMessage(msg, 'error');
          throw new Error(msg);
        }

        const payload = constructPayload(provider, payment_method, {
          email,
          first_name,
          last_name,
          shipping,
          billing,
          bill_first_name,
          bill_last_name,
          cart: items,
          total,
          currency,
          customer_id,
          store_id,
          platform
        });

        if (getConfig().debug) window.__latestSmoothrPayload = payload;

        const { res, data: resp } = await gatewayDispatcher(
          provider,
          payload,
          payment_method,
          log,
          warn,
          err
        );
        if (!res.ok || !resp.success) {
          handleCheckoutError(res, resp, cartHash);
          return;
        }

        localStorage.setItem(
          'smoothr_last_submission',
          JSON.stringify({ hash: cartHash, success: true, timestamp: Date.now() })
        );
        showUserMessage('Order submitted!', 'success');
        handleCheckoutSuccess(resp);
      } catch (error) {
        console.error(error);
        localStorage.setItem(
          'smoothr_last_submission',
          JSON.stringify({ hash: cartHash, success: false, timestamp: Date.now() })
        );
      } finally {
        forEachPayButton(enableButton);
        isSubmitting = false;
      }
    });
  });
  log('pay button handlers attached');
  } catch (error) {
    const debug = getConfig().debug;
    if (debug) console.warn('[Smoothr Checkout] Initialization failed', error);
    return {};
  }
}

// collects form data, supports billing same-as-shipping
function collectFormData(fields, emailField) {
  const email = emailField?.value.trim() || '';
  const first_name = fields.firstName?.value.trim() || '';
  const last_name = fields.lastName?.value.trim() || '';
  const ship = {
    line1: fields.ship_line1?.value.trim() || '',
    line2: fields.ship_line2?.value.trim() || '',
    city: fields.ship_city?.value.trim() || '',
    state: fields.ship_state?.value.trim() || '',
    postal_code: fields.ship_postal?.value.trim() || '',
    country: fields.ship_country?.value.trim() || ''
  };
  const same = document.querySelector('[data-smoothr-billing-same-as-shipping]')?.checked;
  const shipping = { name: `${first_name} ${last_name}`, address: ship };
  let billing = {};
  let bill_first_name = '';
  let bill_last_name = '';
  if (same) {
    billing = { name: shipping.name, address: { ...ship } };
    bill_first_name = first_name;
    bill_last_name = last_name;
  } else {
    bill_first_name = fields.bill_first_name?.value.trim() || '';
    bill_last_name = fields.bill_last_name?.value.trim() || '';
    billing = {
      name: `${bill_first_name} ${bill_last_name}`.trim(),
      address: {
        line1: fields.bill_line1?.value.trim() || '',
        line2: fields.bill_line2?.value.trim() || '',
        city: fields.bill_city?.value.trim() || '',
        state: fields.bill_state?.value.trim() || '',
        postal_code: fields.bill_postal?.value.trim() || '',
        country: fields.bill_country?.value.trim() || ''
      }
    };
  }
  return { email, first_name, last_name, shipping, billing, bill_first_name, bill_last_name };
}

// simple validation
function validateFormData({ email, first_name, last_name, shipping }) {
  const errs = [];
  if (!email) errs.push({ field: 'email', message: 'Email required' });
  if (!first_name) errs.push({ field: 'first_name', message: 'First name required' });
  if (!last_name) errs.push({ field: 'last_name', message: 'Last name required' });
  const addr = shipping.address;
  if (!addr.line1) errs.push({ field: 'ship_line1', message: 'Street required' });
  if (!addr.city) errs.push({ field: 'ship_city', message: 'City required' });
  if (!addr.state) errs.push({ field: 'ship_state', message: 'State required' });
  if (!addr.postal_code) errs.push({ field: 'ship_postal', message: 'Postal required' });
  if (!addr.country) errs.push({ field: 'ship_country', message: 'Country required' });
  return errs;
}

function showValidationErrors(errors) {
  clearErrorMessages();
  errors.forEach(err => {
    const el = document.querySelector(`[data-smoothr-${err.field}]`);
    if (el) {
      el.classList.add('smoothr-error-field');
      const msg = document.createElement('div');
      msg.className = 'smoothr-error';
      msg.textContent = err.message;
      msg.style.color = '#dc3545';
      el.parentNode.insertBefore(msg, el.nextSibling);
    }
  });
  showUserMessage('Fix errors above.', 'error');
}

function clearErrorMessages() {
  document.querySelectorAll('.smoothr-error').forEach(e => e.remove());
  document.querySelectorAll('.smoothr-error-field').forEach(e => e.classList.remove('smoothr-error-field'));
  hideUserMessage();
}

function showUserMessage(text, type = 'info') {
  let box = document.querySelector('.smoothr-message');
  if (!box) {
    box = document.createElement('div');
    box.className = 'smoothr-message';
    box.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:12px;border-radius:4px;font-weight:500;max-width:300px;';
    document.body.appendChild(box);
  }
  const themes = {
    success: '#d4edda',
    error: '#f8d7da',
    warning: '#fff3cd',
    info: '#d1ecf1'
  };
  box.style.background = themes[type] || themes.info;
  box.textContent = text;
  if (type === 'success') setTimeout(hideUserMessage, 5000);
}

function hideUserMessage() {
  const box = document.querySelector('.smoothr-message');
  if (box) box.remove();
}

function getPaymentMethodErrorMessage(err) {
  if (!err) return 'Payment failed';
  const m = err.message || '';
  if (m.includes('card')) return 'Check your card number.';
  if (m.includes('expiry')) return 'Check your card expiry.';
  if (m.includes('cvv')) return 'Check your security code.';
  return 'Please check payment details.';
}

function handleCheckoutError(res, data, hash) {
  if (res.status === 409) showUserMessage('Order already submitted.', 'warning');
  else showUserMessage(data.error || 'Checkout failed', 'error');
  localStorage.setItem('smoothr_last_submission', JSON.stringify({ hash, success: false, timestamp: Date.now() }));
}

function handleCheckoutSuccess(resp) {
  localStorage.removeItem('smoothr_last_submission');
  const cfg = getConfig();
  if (cfg.successUrl) window.location.href = cfg.successUrl;
  window.dispatchEvent(new CustomEvent('smoothr:checkout:success', { detail: resp }));
}

export default init;
export { init };

