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

import { getPublicCredential } from './getPublicCredential.js';
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
  let { log, warn, err, select, q } = checkoutLogger();

  log('SDK initialized');
  log('SMOOTHR_CONFIG', JSON.stringify(window.SMOOTHR_CONFIG));

  const provider = await getActivePaymentGateway(log, warn);
  const loader = gatewayLoaders[provider];
  if (!loader) {
    throw new Error(`Unknown payment gateway: ${provider}`);
  }
  const gateway = (await loader()).default;
  log(`Using gateway: ${provider}`);

  // If NMI, skip shared click binding; NMI handles its own flow
  if (provider === 'nmi') {
    return;
  }

  window.Smoothr = window.Smoothr || window.smoothr || {};
  window.smoothr = window.Smoothr;
  window.Smoothr.checkout = {
    ...(window.Smoothr.checkout || {}),
    version: 'dev6',
    ...gateway
  };

  if (provider === 'stripe') {
    let stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
    if (!stripeKey) {
      const storeId = window.SMOOTHR_CONFIG?.storeId;
      const cred = await getPublicCredential(storeId, 'stripe');
      stripeKey = cred?.api_key || cred?.settings?.publishable_key || '';
      if (stripeKey) window.SMOOTHR_CONFIG.stripeKey = stripeKey;
    }
    log(`stripeKey: ${stripeKey}`);
    if (!stripeKey) {
      warn('❌ Failed at Stripe Key Check: missing key');
      console.log('[Smoothr Checkout] No Stripe key provided');
      return;
    }
    log('Stripe key confirmed');
  }

  let hasShownCheckoutError = false;

  const checkoutEl = await select('[data-smoothr-pay]');
  if (!checkoutEl) {
    warn('missing [data-smoothr-pay]');
    return;
  }
  log('checkout trigger found', checkoutEl);

  const block = checkoutEl.closest?.('[data-smoothr-product-id]') || document;
  const productId = checkoutEl.dataset?.smoothrProductId || block.dataset?.smoothrProductId;
  ({ q } = checkoutLogger(block));

  const fields = collectFormFields(q);
  let { emailField } = fields;
  if (!emailField) emailField = await select('[data-smoothr-email]');
  const totalEl = await select('[data-smoothr-total]');
  const paymentContainer = q('[data-smoothr-gateway]');
  const cardNumberEl = q('[data-smoothr-card-number]');
  const cardExpiryEl = q('[data-smoothr-card-expiry]');
  const cardCvcEl = q('[data-smoothr-card-cvc]');
  const postalEl = q('[data-smoothr-bill-postal]');
  const logFields = [
    ['[data-smoothr-email]', emailField?.value || ''],
    ['[data-smoothr-total]', totalEl?.textContent || ''],
    ['[data-smoothr-gateway]', paymentContainer ? 'found' : 'missing'],
    ['[data-smoothr-pay]', payButtons.length ? 'found' : 'missing'],
    ['[data-smoothr-card-number]', cardNumberEl ? 'found' : 'missing'],
    ['[data-smoothr-card-expiry]', cardExpiryEl ? 'found' : 'missing'],
    ['[data-smoothr-card-cvc]', cardCvcEl ? 'found' : 'missing'],
    ['[data-smoothr-bill-postal]', postalEl ? 'found' : 'missing']
  ];
  logFields.forEach(([name, val]) => log(`${name} = ${val}`));

  if (!emailField) warn('missing [data-smoothr-email]');
  if (!totalEl) warn('missing [data-smoothr-total]');
  log('no polling loops active');

  let mountAttempts = 0;
  const maxAttempts = 1;
  while (mountAttempts < maxAttempts && !gateway.isMounted()) {
    log(`Attempting to mount gateway, attempt ${mountAttempts + 1}`);
    try { await gateway.mountCardFields(); } catch (e) { warn('Mount attempt failed:', e.message); }
    mountAttempts++;
  }
  if (!gateway.isMounted()) { warn('Gateway failed to mount after retries'); return; }
  bindCardInputs();

  const isForm = checkoutEl.tagName?.toLowerCase() === 'form';
  const eventName = isForm ? 'submit' : 'click';

  payButtons.forEach(btn => {
    btn.addEventListener(eventName, async event => {
      event.preventDefault(); event.stopPropagation();
      if (isSubmitting) { warn('Checkout already in progress'); return; }
      isSubmitting = true; forEachPayButton(disableButton);
      clearErrorMessages(); log('[data-smoothr-pay] triggered');
      const formData = collectFormData(fields, emailField);
      const validationErrors = validateFormData(formData);
      if (validationErrors.length) { showValidationErrors(validationErrors); forEachPayButton(enableButton); isSubmitting = false; return; }

      const { email, first_name, last_name, shipping, billing, bill_first_name, bill_last_name } = formData;
      const Smoothr = window.Smoothr || window.smoothr;
      const cart = Smoothr?.cart?.getCart() || { items: [] };
      const total = Smoothr?.cart?.getTotal?.() || parseInt((totalEl?.textContent||'0').replace(/[^0-9]/g,''),10)||0;
      const currency = window.SMOOTHR_CONFIG?.baseCurrency||'USD';
      const customer_id = window.smoothr?.auth?.user?.id||null;
      const store_id = window.SMOOTHR_CONFIG?.storeId;
      const platform = window.SMOOTHR_CONFIG?.platform;

      const cartHash = await computeCartHash(cart.items, total, email);
      const lastSubmission = JSON.parse(localStorage.getItem('smoothr_last_submission')||'{}');
      if (lastSubmission.hash===cartHash&&lastSubmission.success&&(Date.now()-lastSubmission.timestamp<60000)){
        showUserMessage("You've already submitted this order. Please check your email for confirmation.",'warning');
        forEachPayButton(enableButton); isSubmitting=false; return;
      }

      if (!gateway.ready()){
        showUserMessage('Payment system is loading. Please wait and try again.','error');
        forEachPayButton(enableButton); isSubmitting=false; return;
      }

      try {
        const billing_details={...billing,email};
        const { error: pmError, payment_method } = await gateway.createPaymentMethod(billing_details);
        const token = payment_method;
        if(pmError||!token){
          const errorMessage = getPaymentMethodErrorMessage(pmError, provider);
          showUserMessage(errorMessage, 'error'); forEachPayButton(enableButton); isSubmitting=false; return;
        }
        const { res,data } = await gatewayDispatcher(provider, constructPayload(provider, token, { email, first_name, last_name, shipping, billing, bill_first_name, bill_last_name, cart:cart.items, total, currency, customer_id, store_id, platform }), token, log, warn, err);
        if(!res||!res.ok||!data.success){ handleCheckoutError(res,data,cartHash); return; }
        localStorage.setItem('smoothr_last_submission',JSON.stringify({hash:cartHash,success:true,timestamp:Date.now()}));
        showUserMessage('Order submitted successfully!','success');
        handleCheckoutSuccess(data);
      } catch(error){
        console.error(error); err(`❌ ${error.message}`);
        if(error.message.includes('network')) showUserMessage('Network error. Check connection and try again.','error');
        else if(error.message.includes('payment')) showUserMessage('Payment processing error. Verify payment details.','error');
        else showUserMessage('An error occurred. Please try again.','error');
        localStorage.setItem('smoothr_last_submission',JSON.stringify({hash:cartHash,success:false,timestamp:Date.now()}));
      } finally {
        forEachPayButton(enableButton); isSubmitting=false; log('submit handler complete');
      }
    });
  });
  log(`${eventName} handler attached`);
}

function collectFormData(fields, emailField) {
  const email = emailField?.value?.trim() || emailField?.getAttribute('data-smoothr-email')?.trim() || '';
  const first_name = fields.firstName?.value?.trim() || '';
  const last_name = fields.lastName?.value?.trim() || '';
  const line1 = fields.ship_line1?.value?.trim() || '';
  const line2 = fields.ship_line2?.value?.trim() || '';
  const city = fields.ship_city?.value?.trim() || '';
  const state = fields.ship_state?.value?.trim() || '';
  const postal_code = fields.ship_postal]?.value?.trim() || '';
  const country = fields.ship_country?.value?.trim() || '';

  // Handle "same as shipping" checkbox
  const sameBilling = document.querySelector('[data-smoothr-billing-same-as-shipping]')?.checked;

  const shipping = {
    name: `${first_name} ${last_name}`,
    address: { line1, line2, city, state, postal_code, country }
  };

  let billing;
  if (sameBilling) {
    billing = {
      name: `${first_name} ${last_name}`.trim(),
      address: { ...shipping.address }
    };
  } else {
    const bill_line1 = fields.bill_line1]?.value]?.trim() || '';
    const bill_line2 = fields.bill_line2]?.value]?.trim() || '';
    const bill_city = fields.bill_city]?.value]?.trim() || '';
    const bill_state = fields.bill_state]?.value]?.trim() || '';
    const bill_postal = fields.bill_postal]?.value]?.trim() || '';
    const bill_country = fields.bill_country]?.value]?.trim() || '';
    billing = {
      name: `${fields.bill_first_name]?.value]?.trim() || ''} ${fields.bill_last_name]?.value]?.trim() || ''}`.trim(),
      address: { line1: bill_line1, line2: bill_line2, city: bill_city, state: bill_state, postal_code: bill_postal, country: bill_country }
    };
  }

  const bill_first_name = sameBilling ? first_name : fields.bill_first_name]?.value]?.trim() || '';
  const bill_last_name = sameBilling ? last_name : fields.bill_last_name]?.value]?.trim() || '';

  return {
    email,
    first_name,
    last_name,
    shipping,
    billing,
    bill_first_name,
    bill_last_name
  };
}

function validateFormData(formData) {
  const errors = [];
  if (!formData.email) errors.push({ field: 'email', message: 'Email is required' });
  if (!formData.first_name) errors.push({ field: 'first_name', message: 'First name is required' });
  if (!formData.last_name) errors.push({ field: 'last_name', message: 'Last name is required' });
  if (!formData.shipping.address.line1) errors.push({ field: 'ship_line1', message: 'Street address is required' });
  if (!formData.shipping.address.city) errors.push({ field: 'ship_city', message: 'City is required' });
  if (!formData.shipping.address.state) errors.push({ field: 'ship_state', message: 'State is required' });
  if (!formData.shipping.address.postal_code) errors.push({ field: 'ship_postal', message: 'Postal code is required' });
  if (!formData.shipping.address.country) errors.push({ field: 'ship_country', message: 'Country is required' });
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  return errors;
}

function showValidationErrors(errors) {
  document.querySelectorAll('.smoothr-error').forEach(el => el.remove());

  errors.forEach(error => {
    const field = document.querySelector(`[data-smoothr-${error.field}]`);
    if (field) {
      field.classList.add('smoothr-error-field');
      const errorEl = document.createElement('div');
      errorEl.className = 'smoothr-error';
      errorEl.textContent = error.message;
      errorEl.style.color = '#dc3545';
      errorEl.style.fontSize = '0.875rem';
      errorEl.style.marginTop = '0.25rem';
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
  });

  showUserMessage('Please fix the errors above and try again.', 'error');
}

function clearErrorMessages() {
  document.querySelectorAll('.smoothr-error').forEach(el => el.remove());
  document.querySelectorAll('.smoothr-error-field').forEach(el => el.classList.remove('smoothr-error-field'));
  hideUserMessage();
}

function showUserMessage(message, type = 'info') {
  let messageContainer = document.querySelector('.smoothr-message');
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.className = 'smoothr-message';
    messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(messageContainer);
  }

  const colors = {
    success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
    error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
    warning: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
    info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
  };

  const color = colors[type] || colors.info;
  messageContainer.style.backgroundColor = color.bg;
  messageContainer.style.color = color.text;
  messageContainer.style.border = `1px solid ${color.border}`;
  messageContainer.textContent = message;
  messageContainer.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => hideUserMessage(), 5000);
  }
}

function hideUserMessage() {
  const messageContainer = document.querySelector('.smoothr-message');
  if (messageContainer) {
    messageContainer.style.display = 'none';
  }
}

function getPaymentMethodErrorMessage(error, provider) {
  if (!error) return 'Payment method creation failed. Please try again.';
  const message = error.message || error.code || '';
  if (message.includes('card_number')) return 'Please check your card number and try again.';
  if (message.includes('expiry') || message.includes('exp_')) return 'Please check your card expiry date.';
  if (message.includes('cvc') || message.includes('cvv')) return 'Please check your security code.';
  if (message.includes('postal') || message.includes('zip')) return 'Please check your postal code.';
  if (message.includes('declined')) return 'Your card was declined. Please try a different payment method.';
  if (message.includes('insufficient')) return 'Insufficient funds. Please try a different payment method.';
  return 'Please check your payment details and try again.';
}

function handleCheckoutError(res, data, cartHash) {
  const errorMessage = data?.error || 'Checkout failed';

  if (res.status === 409) {
    showUserMessage('This order was already submitted. Please check your email for confirmation.', 'warning');
  } else if (res.status === 400) {
    if (errorMessage.
