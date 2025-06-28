export async function initCheckout() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  let block = document.querySelector('[data-smoothr-checkout]');
  if (!block) {
    block = document.querySelector('.smoothr-checkout');
  }
  if (!block) return;

  const productId = block.dataset.smoothrProductId;
  const emailField = block.querySelector('[data-smoothr-email]');
  const amountEl = document.querySelector('[data-smoothr-total], [data-smoothr-price]');
  const paymentContainer = block.querySelector('[data-smoothr-gateway]');
  const submitBtn = block.querySelector('[data-smoothr-submit]');

  const stripePk =
    window.SMOOTHR_CONFIG?.stripeKey || window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripe = Stripe(stripePk);

  submitBtn?.addEventListener('click', async () => {
    submitBtn.disabled = true;
    if (debug) console.log('🚀 submit triggered');

    const email =
      emailField?.value?.trim() || emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const rawAmount =
      amountEl?.getAttribute('data-smoothr-total') ||
      amountEl?.getAttribute('data-smoothr-price') ||
      '';
    const parsed = parseFloat(rawAmount);
    const total = isNaN(parsed) ? 0 : Math.round(parsed * 100);

    if (!email) {
      console.warn('⚠️ Missing email; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    if (!total) {
      console.warn('⚠️ Missing amount; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
    if (debug)
      console.log(
        '🌐 creating PaymentIntent via',
        `${apiBase}/api/checkout/stripe`
      );
    const initRes = await fetch(`${apiBase}/api/checkout/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, product_id: productId, email })
    });

    const { client_secret } = await initRes.json();
    if (debug) console.log('🔑 client_secret:', client_secret);
    if (!initRes.ok || !client_secret) {
      console.error('❌ Missing client_secret; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    const elements = stripe.elements({ clientSecret: client_secret });
    const paymentElement = elements.create('payment');
    if (debug) console.log('🧱 Mounting Stripe Elements...');
    if (debug) console.log('📦 Mount target:', paymentContainer);
    if (paymentContainer) {
      paymentElement.mount(paymentContainer);
      if (debug) console.log('✅ Stripe Elements mounted');

      try {
        await elements.submit();
        if (debug) console.log('🧱 elements.submit() called before confirmPayment');
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret: client_secret,
          confirmParams: {
            return_url: `${window.location.origin}/checkout-success`
          }
        });

        if (error) {
          console.error(error);
        } else {
          block.innerHTML = '<p>Payment successful!</p>';
        }
      } catch (err) {
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        if (debug) console.log('✅ submit handler complete');
      }
    } else {
      console.error('❌ Cannot mount Stripe: [data-smoothr-gateway] not found.');
      submitBtn.disabled = false;
    }
  });
  if (debug) console.log('🖱️ Submit handler attached');
}

document.addEventListener('DOMContentLoaded', initCheckout);
