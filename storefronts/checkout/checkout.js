// checkout.js

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

import bindCardInputs from './utils/inputFormatters.js';
import checkoutLogger from './utils/checkoutLogger.js';
import getActivePaymentGateway from './utils/resolveGateway.js';
import collectFormFields from './utils/collectFormFields.js';
import constructPayload from './utils/constructPayload.js';
import gatewayDispatcher from './utils/gatewayDispatcher.js';
import {
  computeCartHash,
  disableButton,
  enableButton
} from './utils/cartHash.js';

function forEachPayButton(fn) {
  document.querySelectorAll('[data-smoothr-pay]').forEach(fn);
}

const gatewayLoaders = {
  stripe: () => import('./gateways/stripe.js'),
  authorizeNet: () => import('./gateways/authorizeNet.js'),
  paypal: () => import('./gateways/paypal.js'),
  nmi: () => import('./gateways/nmi.js'),
  segpay: () => import('./gateways/segpay.js')
};

export async function initCheckout(config) {
  if (window.__SMOOTHR_CHECKOUT_INITIALIZED__) return;
  window.__SMOOTHR_CHECKOUT_INITIALIZED__ = true;
  console.log('[Smoothr] initCheckout', config);

  const payButtons = document.querySelectorAll('[data-smoothr-pay]');
  console.log('[Smoothr] Found pay buttons:', payButtons.length);

  if (window.__SMOOTHR_CHECKOUT_BOUND__) return;
  window.__SMOOTHR_CHECKOUT_BOUND__ = true;

  let isSubmitting = false;
  const { log, warn, err, select, q } = checkoutLogger();

  log('SDK initialized');
  log('SMOOTHR_CONFIG', JSON.stringify(window.SMOOTHR_CONFIG));

  const provider = await getActivePaymentGateway(log, warn);
  const loader = gatewayLoaders[provider];
  if (!loader) throw new Error(`Unknown payment gateway: ${provider}`);
  const gateway = (await loader()).default;
  log(`Using gateway: ${provider}`);

  // assign gateway methods to global namespace
  window.Smoothr = window.Smoothr || window.smoothr || {};
  window.smoothr = window.Smoothr;
  window.Smoothr.checkout = {
    ...(window.Smoothr.checkout || {}),
    version: 'dev6',
    ...gateway
  };

  // mount fields common to all gateways
  const checkoutEl = await select('[data-smoothr-pay]');
  if (!checkoutEl) {
    warn(
      'No checkout trigger found. Add a [data-smoothr-pay] element or delay initCheckout.'
    );
    window.__SMOOTHR_CHECKOUT_INITIALIZED__ = false;
    window.__SMOOTHR_CHECKOUT_BOUND__ = false;
    if (!window.__SMOOTHR_CHECKOUT_RETRY__) {
      window.__SMOOTHR_CHECKOUT_RETRY__ = true;
      setTimeout(() => initCheckout(config), 100);
    }
    return;
  }
  log('checkout trigger found', checkoutEl);

  const fields = collectFormFields(q);
  let { emailField } = fields;
  if (!emailField) emailField = await select('[data-smoothr-email]');
  const totalEl = await select('[data-smoothr-total]');

  // attempt to mount card fields (for non-NMI gateways too)
  let attempts = 0;
  while (attempts < 2 && !gateway.isMounted()) {
    try {
      await gateway.mountCardFields();
    } catch (e) {
      warn('Mount failed:', e.message);
    }
    attempts++;
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

  const isForm = checkoutEl.tagName.toLowerCase() === 'form';
  const eventName = isForm ? 'submit' : 'click';

  payButtons.forEach(btn => {
    btn.addEventListener(eventName, async e => {
      e.preventDefault();
      e.stopPropagation();

      if (isSubmitting) {
        warn('Checkout already in progress');
        return;
      }
      isSubmitting = true;
      forEachPayButton(disableButton);
      clearErrorMessages();
      log('[data-smoothr-pay] triggered');

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

      const cart = window.Smoothr.cart.getCart() || { items: [] };
      const items = Array.isArray(cart.items) ? cart.items : [];
      const total = Math.round(
        (window.Smoothr.cart.getTotal?.() || parseFloat(totalEl.textContent.replace(/[^0-9.]/g, '')) || 0) * 100
      );
      const currency = window.SMOOTHR_CONFIG.baseCurrency;
      const customer_id = window.smoothr.auth.user?.value?.id || null;
      const store_id = window.SMOOTHR_CONFIG.storeId;
      const platform = window.SMOOTHR_CONFIG.platform;

      const cartHash = await computeCartHash(items, total, email);
      const last = JSON.parse(localStorage.getItem('smoothr_last_submission') || '{}');
      if (last.hash === cartHash && last.success && Date.now() - last.timestamp < 60000) {
        showUserMessage("You've already submitted this order.", 'warning');
        forEachPayButton(enableButton);
        isSubmitting = false;
        return;
      }

      if (!gateway.ready()) {
        showUserMessage('Payment system loading, please wait.', 'error');
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

        if (window.SMOOTHR_CONFIG.debug) window.__latestSmoothrPayload = payload;

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
  log(`${eventName} handler attached`);
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
  if (window.SMOOTHR_CONFIG.successUrl) window.location.href = window.SMOOTHR_CONFIG.successUrl;
  window.dispatchEvent(new CustomEvent('smoothr:checkout:success', { detail: resp }));
}
