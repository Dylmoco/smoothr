let stripeFieldsMounted = false;
let stripeMountAttempts = 0;
let stripe;
let elements;

function initStripeElements() {
  const stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
  if (!stripeKey) return;

  const numberTarget = document.querySelector('[data-smoothr-card-number]');
  const expiryTarget = document.querySelector('[data-smoothr-card-expiry]');
  const cvcTarget = document.querySelector('[data-smoothr-card-cvc]');

  if (!numberTarget || !expiryTarget || !cvcTarget) {
    if (stripeMountAttempts < 5) {
      stripeMountAttempts++;
      setTimeout(initStripeElements, 200);
    }
    return;
  }

  if (!stripe) {
    stripe = Stripe(stripeKey);
    elements = stripe.elements();
  }

  console.log('[Smoothr Checkout] Mounting Stripe card fields...');
  const numberElement = elements.create('cardNumber');
  const expiryElement = elements.create('cardExpiry');
  const cvcElement = elements.create('cardCvc');

  numberElement.mount(numberTarget);
  console.log('[Smoothr Checkout] Stripe mounted into card-number');
  expiryElement.mount(expiryTarget);
  cvcElement.mount(cvcTarget);

  stripeFieldsMounted = true;
}

export async function initCheckout() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
  const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);
  const err = (...args) => debug && console.error('[Smoothr Checkout]', ...args);

  log('SDK initialized');
  log('SMOOTHR_CONFIG', JSON.stringify(window.SMOOTHR_CONFIG));

  const stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
  log(`stripeKey: ${stripeKey}`);
  if (!stripeKey) {
    warn('❌ Failed at Stripe Key Check: missing key');
    console.log('[Smoothr Checkout] No Stripe key provided');
    return;
  }

  log('Stripe key confirmed');

  let stripeReady = false;
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

  // TODO: Support multiple gateways besides Stripe
  const stripePk = stripeKey;
  log('Stripe PK loaded', stripePk);

  if (!stripeFieldsMounted) {
    initStripeElements();
  }

  submitBtn?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    submitBtn.disabled = true;
    log('[data-smoothr-submit] clicked');

    const email =
      emailField?.value?.trim() || emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const total =
      parseInt((totalEl?.textContent || '0').replace(/[^0-9]/g, ''), 10) || 0;

    if (!email) {
      warn('Missing email; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    if (!total) {
      warn('Missing amount; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
    const payload = { amount: total, product_id: productId, email };
    log('payload', payload);
    log('POST', `${apiBase}/api/checkout/stripe`);
    const initRes = await fetch(`${apiBase}/api/checkout/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const resBody = await initRes.clone().json().catch(() => ({}));
    log('fetch response', initRes.status, resBody);
    if (initRes.status === 405) {
      warn('method not allowed; used', 'POST');
    }

    const { client_secret } = resBody;
    log('client_secret', client_secret);
    if (!initRes.ok || !client_secret) {
      err('\u274C Failed at API fetch: missing client_secret');
      if (!hasShownCheckoutError) {
        alert('Failed to start checkout');
        hasShownCheckoutError = true;
      }
      submitBtn.disabled = false;
      return;
    }

    elements = stripe.elements({ clientSecret: client_secret });
    const paymentElement = elements.create('payment');
    log('mounting Stripe Elements');
    log('mount target', paymentContainer);
    if (paymentContainer) {

      paymentElement.mount(paymentContainer);
      stripeReady = true;
      log('Stripe Elements mounted');

      if (!stripeReady) {
        console.warn(
          '[Smoothr Checkout] Stripe not ready. Blocking premature submit.'
        );
        submitBtn.disabled = false;
        return;
      }

      try {
        await elements.submit();
        log('elements.submit() called before confirmPayment');
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret: client_secret,
          confirmParams: {
            return_url: `${window.location.origin}/checkout-success`
          }
        });

        if (error) {
          err(`\u274C Failed at confirmPayment: ${error.message}`);
          if (!hasShownCheckoutError) {
            alert('Failed to start checkout');
            hasShownCheckoutError = true;
          }
        } else {
          log('tokenization success');
          block.innerHTML = '<p>Payment successful!</p>';
        }
      } catch (err) {
        err(`\u274C Failed at confirmPayment: ${err.message}`);
        if (!hasShownCheckoutError) {
          alert('Failed to start checkout');
          hasShownCheckoutError = true;
        }
      } finally {
        submitBtn.disabled = false;
        log('submit handler complete');
      }
    } else {
      err('\u274C Failed at mount: [data-smoothr-gateway] not found');
      if (!hasShownCheckoutError) {
        alert('Failed to start checkout');
        hasShownCheckoutError = true;
      }
      submitBtn.disabled = false;
    }
  });
  log('submit handler attached');
}

document.addEventListener('DOMContentLoaded', initCheckout);
