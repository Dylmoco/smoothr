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
  if (checkoutEl) {
    log('checkout trigger found', checkoutEl);
  } else {
    warn('missing [data-smoothr-pay]');
    return;
  }


  const block = checkoutEl.closest?.('[data-smoothr-product-id]') || document;
  const productId =
    checkoutEl.dataset?.smoothrProductId || block.dataset?.smoothrProductId;
  ({ q } = checkoutLogger(block));

  const fields = collectFormFields(q);
  let { emailField } = fields;
  if (!emailField) emailField = await select('[data-smoothr-email]');
  const totalEl = await select('[data-smoothr-total]');
  const paymentContainer = q('[data-smoothr-gateway]');
  const cardNumberEl = q('[data-smoothr-card-number]');
  const cardExpiryEl = q('[data-smoothr-card-expiry]');
  const cardCvcEl = q('[data-smoothr-card-cvc]');
  const postalEl = q('[data-smoothr-bill-postal]'); // Updated to match nmi.js
  const themeEl = document.querySelector('#smoothr-checkout-theme');
  const logFields = [
    ['[data-smoothr-email]', emailField?.value || ''],
    ['[data-smoothr-total]', totalEl?.textContent || ''],
    ['[data-smoothr-gateway]', paymentContainer ? 'found' : 'missing'],
    ['[data-smoothr-pay]', payButtons.length ? 'found' : 'missing'],
    ['[data-smoothr-card-number]', cardNumberEl ? 'found' : 'missing'],
    ['[data-smoothr-card-expiry]', cardExpiryEl ? 'found' : 'missing'],
    ['[data-smoothr-card-cvc]', cardCvcEl ? 'found' : 'missing'],
    ['[data-smoothr-bill-postal]', postalEl ? 'found' : 'missing'] // Updated log
  ];
  logFields.forEach(([name, val]) => log(`${name} = ${val}`));
  if (!emailField) warn('missing [data-smoothr-email]');
  if (!totalEl) warn('missing [data-smoothr-total]');
  log('no polling loops active');

  // Initialize payment gateway fields with retry
  let mountAttempts = 0;
  const maxAttempts = 1; // Limit to one retry
  while (mountAttempts < maxAttempts && !gateway.isMounted()) {
    log(`Attempting to mount gateway, attempt ${mountAttempts + 1}`);
    try {
      await gateway.mountCardFields();
    } catch (e) {
      warn('Mount attempt failed:', e.message);
    }
    mountAttempts++;
  }
  if (!gateway.isMounted()) {
    warn('Gateway failed to mount after retries');
    return;
  }
  bindCardInputs();

  const isForm = checkoutEl.tagName?.toLowerCase() === 'form';
  const eventName = isForm ? 'submit' : 'click';

  payButtons.forEach(btn => {
    btn.addEventListener(eventName, async event => {
      event.preventDefault();
      event.stopPropagation();
      if (isSubmitting) {
        warn('Checkout already in progress');
        return;
      }
      isSubmitting = true;
      disableButton(btn);
      log('[data-smoothr-pay] triggered');

    const email =
      emailField?.value?.trim() ||
      emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const first_name = fields.firstName?.value?.trim() || '';
    const last_name = fields.lastName?.value?.trim() || '';
    const line1 = fields.ship_line1?.value?.trim() || '';
    const line2 = fields.ship_line2?.value?.trim() || '';
    const city = fields.ship_city?.value?.trim() || '';
    const state = fields.ship_state?.value?.trim() || '';
    const postal_code = fields.ship_postal?.value?.trim() || '';
    const country = fields.ship_country?.value?.trim() || '';
    const shipping = {
      name: `${first_name} ${last_name}`,
      address: { line1, line2, city, state, postal_code, country }
    };

    const bill_first_name = fields.bill_first_name?.value?.trim() || '';
    const bill_last_name = fields.bill_last_name?.value?.trim() || '';
    const bill_line1 = fields.bill_line1?.value?.trim() || '';
    const bill_line2 = fields.bill_line2?.value?.trim() || '';
    const bill_city = fields.bill_city?.value?.trim() || '';
    const bill_state = fields.bill_state?.value?.trim() || '';
    const bill_postal = fields.bill_postal?.value?.trim() || '';
    const bill_country = fields.bill_country?.value?.trim() || '';
    const billing = {
      name: `${bill_first_name} ${bill_last_name}`.trim(),
      address: {
        line1: bill_line1,
        line2: bill_line2,
        city: bill_city,
        state: bill_state,
        postal_code: bill_postal,
        country: bill_country
      }
    };

    const Smoothr = window.Smoothr || window.smoothr;
    const cart = Smoothr?.cart?.getCart() || { items: [] };
    const total =
      Smoothr?.cart?.getTotal?.() ||
      parseInt((totalEl?.textContent || '0').replace(/[^0-9]/g, ''), 10) ||
      0;
    const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';
    const customer_id = window.smoothr?.auth?.user?.id || null;
    const store_id = window.SMOOTHR_CONFIG?.storeId;
    const platform = window.SMOOTHR_CONFIG?.platform;

    if (!email || !first_name || !last_name || !total) {
      warn('Missing required fields; aborting checkout');
      enableButton(btn);
      isSubmitting = false;
      return;
    }

    const cartHash = await computeCartHash(cart.items, total, email);
    const lastHash = localStorage.getItem('smoothr_last_cart_hash');
    if (cartHash === lastHash) {
      enableButton(btn);
      isSubmitting = false;
      alert("You’ve already submitted this cart. Please wait or modify your order.");
      return;
    }

    if (!gateway.ready()) {
      err('Payment gateway not ready');
      enableButton(btn);
      isSubmitting = false;
      return;
    }

    try {
      const billing_details = { ...billing, email };
      const { error: pmError, payment_method } =
        await gateway.createPaymentMethod(billing_details);

      const token = payment_method;
      console.log('[AuthorizeNet] ✅ Got payment method:', token);
      if (
        provider === 'authorizeNet' &&
        (!token?.dataDescriptor || !token?.dataValue)
      ) {
        alert('Invalid payment details. Please try again.');
        enableButton(btn);
        isSubmitting = false;
        return;
      }
      if (!token || pmError) {
        err('Failed to create payment method', { error: pmError, payment_method: token });
        enableButton(btn);
        isSubmitting = false;
        return;
      }

      const payload = constructPayload(provider, token, {
        email,
        first_name,
        last_name,
        shipping,
        billing,
        bill_first_name,
        bill_last_name,
        cart: cart.items,
        total,
        currency,
        customer_id,
        store_id,
        platform
      });

      if (window.SMOOTHR_CONFIG?.debug) {
        window.__latestSmoothrPayload = payload;
      }
      console.log('[Smoothr Checkout] Submitting payload:', payload);

      const { res, data } = await gatewayDispatcher(
        provider,
        payload,
        token,
        log,
        warn,
        err
      );

      if (!res || !res.ok || !data.success) {
        err('Checkout failed');
        if (!hasShownCheckoutError) {
          alert('Failed to start checkout');
          hasShownCheckoutError = true;
        }
        return; // Don't save hash on fail
      }

      // Save hash only on success
      localStorage.setItem('smoothr_last_cart_hash', cartHash);
      // Clear hash on success for immediate re-buy
      localStorage.removeItem('smoothr_last_cart_hash');
    } catch (error) {
      console.error(error);
      err(`❌ ${error.message}`);
      if (!hasShownCheckoutError) {
        alert('Failed to start checkout');
        hasShownCheckoutError = true;
      }
    } finally {
      enableButton(btn);
      isSubmitting = false;
      log('submit handler complete');
    }
    });
  });
  log(`${eventName} handler attached`);
}

// Remove these platform-agnostic auto-bindings; adapter handles it now