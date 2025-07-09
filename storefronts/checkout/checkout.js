import supabase from '../../supabase/supabaseClient.js';

const gatewayLoaders = {
  stripe: () => import('./gateways/stripe.js'),
  authorizeNet: () => import('./gateways/authorizeNet.js'),
  paypal: () => import('./gateways/paypal.js'),
  nmi: () => import('./gateways/nmi.js'),
  segpay: () => import('./gateways/segpay.js')
};

async function getPublicCredential(storeId, integrationId) {
  if (!storeId || !integrationId) return null;
  try {
    const { data, error } = await supabase
      .from('store_integrations')
      .select('api_key, settings')
      .eq('store_id', storeId)
      .eq('provider', integrationId)
      .maybeSingle();
    if (error) {
      console.warn('[Smoothr Checkout] Credential lookup failed:', error.message || error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[Smoothr Checkout] Credential fetch error:', e?.message || e);
    return null;
  }
}

async function getActivePaymentGateway(log, warn) {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.active_payment_gateway) return cfg.active_payment_gateway;
  const storeId = cfg.storeId;
  if (!storeId) {
    warn('Store ID missing; defaulting to stripe');
    return 'stripe';
  }
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('settings')
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return 'stripe';
    }
    const gateway = data?.settings?.active_payment_gateway;
    if (!gateway) {
      warn('active_payment_gateway missing; defaulting to stripe');
      return 'stripe';
    }
    return gateway;
  } catch (e) {
    warn('Gateway lookup failed:', e?.message || e);
    return 'stripe';
  }
}

export async function computeCartHash(cart, total, email) {
  const normalized = [...cart]
    .map(item => ({ id: item.product_id, qty: item.quantity }))
    .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  const input = `${email}-${total}-${JSON.stringify(normalized)}`;
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function initCheckout() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
  const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);
  const err = (...args) => debug && console.error('[Smoothr Checkout]', ...args);

  log('SDK initialized');
  log('SMOOTHR_CONFIG', JSON.stringify(window.SMOOTHR_CONFIG));

  const provider = await getActivePaymentGateway(log, warn);
  let loader = gatewayLoaders[provider];
  if (!loader) {
    warn(`Unknown payment gateway: ${provider}; falling back to stripe`);
    loader = gatewayLoaders.stripe;
  }
  const gateway = (await loader()).default;
  log(`Using gateway: ${provider}`);

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

  let block = document.querySelector('[data-smoothr-checkout]');
  if (!block) {
    block = document.querySelector('.smoothr-checkout');
  }
  if (block) {
    log('form detected', block);
  } else {
    log('checkout form not found');
    return;
  }

  const productId = block.dataset.smoothrProductId;
  const emailField = block.querySelector('[data-smoothr-email]');
  const totalEl = block.querySelector('[data-smoothr-total]');
  const paymentContainer = block.querySelector('[data-smoothr-gateway]');
  const submitBtn = block.querySelector('[data-smoothr-submit]');
  const cardNumberEl = block.querySelector('[data-smoothr-card-number]');
  const cardExpiryEl = block.querySelector('[data-smoothr-card-expiry]');
  const cardCvcEl = block.querySelector('[data-smoothr-card-cvc]');
  const postalEl = block.querySelector('[data-smoothr-postal]');
  const themeEl = document.querySelector('#smoothr-checkout-theme');
  const fields = [
    ['[data-smoothr-email]', emailField?.value || ''],
    ['[data-smoothr-total]', totalEl?.textContent || ''],
    ['[data-smoothr-gateway]', paymentContainer ? 'found' : 'missing'],
    ['[data-smoothr-submit]', submitBtn ? 'found' : 'missing'],
    ['[data-smoothr-card-number]', cardNumberEl ? 'found' : 'missing'],
    ['[data-smoothr-card-expiry]', cardExpiryEl ? 'found' : 'missing'],
    ['[data-smoothr-card-cvc]', cardCvcEl ? 'found' : 'missing'],
    ['[data-smoothr-postal]', postalEl ? 'found' : 'missing']
  ];
  fields.forEach(([name, val]) => log(`${name} = ${val}`));
  if (!emailField) warn('missing [data-smoothr-email]');
  if (!totalEl) warn('missing [data-smoothr-total]');
  log('no polling loops active');

  // Initialize payment gateway fields
  gateway.mountCardFields();

  submitBtn?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    submitBtn.disabled = true;
    log('[data-smoothr-submit] clicked');

    const email =
      emailField?.value?.trim() ||
      emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const first_name =
      block.querySelector('[data-smoothr-first-name]')?.value?.trim() || '';
    const last_name =
      block.querySelector('[data-smoothr-last-name]')?.value?.trim() || '';
    const line1 =
      block.querySelector('[data-smoothr-ship-line1]')?.value?.trim() || '';
    const line2 =
      block.querySelector('[data-smoothr-ship-line2]')?.value?.trim() || '';
    const city =
      block.querySelector('[data-smoothr-ship-city]')?.value?.trim() || '';
    const state =
      block.querySelector('[data-smoothr-ship-state]')?.value?.trim() || '';
    const postal_code =
      block.querySelector('[data-smoothr-ship-postal]')?.value?.trim() || '';
    const country =
      block.querySelector('[data-smoothr-ship-country]')?.value?.trim() || '';
    const shipping = {
      name: `${first_name} ${last_name}`,
      address: { line1, line2, city, state, postal_code, country }
    };

    const bill_first_name =
      block.querySelector('[data-smoothr-bill-first-name]')?.value?.trim() || '';
    const bill_last_name =
      block.querySelector('[data-smoothr-bill-last-name]')?.value?.trim() || '';
    const bill_line1 =
      block.querySelector('[data-smoothr-bill-line1]')?.value?.trim() || '';
    const bill_line2 =
      block.querySelector('[data-smoothr-bill-line2]')?.value?.trim() || '';
    const bill_city =
      block.querySelector('[data-smoothr-bill-city]')?.value?.trim() || '';
    const bill_state =
      block.querySelector('[data-smoothr-bill-state]')?.value?.trim() || '';
    const bill_postal =
      block.querySelector('[data-smoothr-bill-postal]')?.value?.trim() || '';
    const bill_country =
      block.querySelector('[data-smoothr-bill-country]')?.value?.trim() || '';
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
      submitBtn.disabled = false;
      return;
    }

    const cartHash = await computeCartHash(cart.items, total, email);
    const lastHash = localStorage.getItem('smoothr_last_cart_hash');
    if (cartHash === lastHash) {
      submitBtn.disabled = false;
      alert("You’ve already submitted this cart. Please wait or modify your order.");
      return;
    }
    localStorage.setItem('smoothr_last_cart_hash', cartHash);

    if (!gateway.isMounted()) await gateway.mountCardFields();
    if (!gateway.ready()) {
      err('Payment gateway not ready');
      submitBtn.disabled = false;
      return;
    }

    try {
      const billing_details = { ...billing, email };
      const { error: pmError, payment_method, paymentMethod } =
        await gateway.createPaymentMethod(billing_details);

      const token = payment_method || paymentMethod;
      if (pmError || !token) {
        err(`\u274C Failed to create payment method: ${pmError?.message}`);
        submitBtn.disabled = false;
        return;
      }

      const payload = {
        email,
        first_name,
        last_name,
        shipping,
        billing,
        cart: cart.items,
        total,
        currency,
        customer_id,
        store_id,
        platform
      };

      if (provider === 'stripe') {
        payload.payment_method = token.id;
      } else if (provider === 'authorizeNet') {
        payload.payment_method = token;
      } else if (provider === 'nmi') {
        Object.assign(payload, token);
      } else {
        payload.payment_method = token.id;
      }

      if (debug) {
        window.__latestSmoothrPayload = payload;
        console.log('[Smoothr Checkout] Submitting payload:', window.__latestSmoothrPayload);
      }
      const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
      log('POST', `${apiBase}/api/checkout/${provider}`);
      const res = await fetch(`${apiBase}/api/checkout/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.clone().json().catch(() => ({}));
      log('fetch response', res.status, data);
      if (res.ok && data.success) {
        Smoothr?.cart?.clearCart?.();
        window.location.href = '/checkout-success';
      } else {
        err('Checkout failed');
        if (!hasShownCheckoutError) {
          alert('Failed to start checkout');
          hasShownCheckoutError = true;
        }
      }
    } catch (error) {
      err(`\u274C ${error.message}`);
      if (!hasShownCheckoutError) {
        alert('Failed to start checkout');
        hasShownCheckoutError = true;
      }
    } finally {
      submitBtn.disabled = false;
      log('submit handler complete');
    }
  });
  log('submit handler attached');
}

document.addEventListener('DOMContentLoaded', initCheckout);
if (document.readyState !== 'loading') {
  initCheckout();
}
