export async function initCheckout() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('smoothr:checkout', ...args);
  const warn = (...args) => console.warn('smoothr:checkout', ...args);
  const err = (...args) => console.error('smoothr:checkout', ...args);

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
  log('parsed inputs', {
    productId,
    emailField,
    totalEl,
    paymentContainer,
    submitBtn,
    cardNumberEl,
    cardExpiryEl,
    cardCvcEl,
    postalEl,
    theme: !!themeEl
  });
  log('no polling loops active');

  // TODO: Support multiple gateways besides Stripe
  const stripePk =
    window.SMOOTHR_CONFIG?.stripeKey || window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripe = Stripe(stripePk);
  log('Stripe PK loaded', stripePk);

  submitBtn?.addEventListener('click', async () => {
    submitBtn.disabled = true;
    log('submit clicked');

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
    log('POST', `${apiBase}/api/checkout/stripe`, payload);
    const initRes = await fetch(`${apiBase}/api/checkout/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const resBody = await initRes.clone().json().catch(() => ({}));
    log('response', initRes.status, resBody);
    if (initRes.status === 405) {
      warn('method not allowed; used', 'POST');
    }

    const { client_secret } = resBody;
    log('client_secret', client_secret);
    if (!initRes.ok || !client_secret) {
      err('Missing client_secret; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    const elements = stripe.elements({ clientSecret: client_secret });
    const paymentElement = elements.create('payment');
    log('mounting Stripe Elements');
    log('mount target', paymentContainer);
    if (paymentContainer) {
      paymentElement.mount(paymentContainer);
      log('Stripe Elements mounted');

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
          err('tokenization failed', error);
        } else {
          log('tokenization success');
          block.innerHTML = '<p>Payment successful!</p>';
        }
      } catch (err) {
        err(err);
      } finally {
        submitBtn.disabled = false;
        log('submit handler complete');
      }
    } else {
      err('Cannot mount Stripe: [data-smoothr-gateway] not found.');
      submitBtn.disabled = false;
    }
  });
  log('submit handler attached');
}

document.addEventListener('DOMContentLoaded', initCheckout);
