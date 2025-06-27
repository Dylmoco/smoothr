export async function initCheckout() {
  let block = document.querySelector('[data-smoothr-checkout]');
  if (!block) {
    block = document.querySelector('.smoothr-checkout');
  }
  if (!block) return;

  const productId = block.dataset.smoothrProductId;
  const emailField = block.querySelector('[data-smoothr-email]');
  const totalEl = block.querySelector('[data-smoothr-total]');
  const paymentContainer = block.querySelector('[data-smoothr-gateway]');
  const submitBtn = block.querySelector('[data-smoothr-submit]');

  const total = parseInt((totalEl?.textContent || '0').replace(/[^0-9]/g, ''), 10) || 0;

  // TODO: Support multiple gateways besides Stripe
  const stripePk = window.SMOOTHR_CONFIG?.stripeKey || window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripe = Stripe(stripePk);

  const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
  console.log('🌐 creating PaymentIntent via', `${apiBase}/api/checkout/stripe`);
  const initRes = await fetch(`${apiBase}/api/checkout/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: total, product_id: productId })
  });

  const { client_secret } = await initRes.json();
  console.log('🔑 client_secret:', client_secret);
  if (!initRes.ok || !client_secret) {
    console.error('❌ Missing client_secret; aborting checkout init');
    return;
  }

  const elements = stripe.elements({ clientSecret: client_secret });
  const paymentElement = elements.create('payment');
  console.log('🧱 Mounting Stripe Elements...');
  console.log('📦 Mount target:', paymentContainer);
  if (paymentContainer) {
    paymentElement.mount(paymentContainer);
    console.log('✅ Stripe Elements mounted');

    submitBtn?.addEventListener('click', async () => {
      submitBtn.disabled = true;
      console.log('🚀 submit triggered');
      try {
        await elements.submit();
        console.log('🧱 elements.submit() called before confirmPayment');
        const email = emailField?.value || '';
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
        console.log('✅ submit handler complete');
      }
    });
    console.log('🖱️ Submit handler attached');
  } else {
    console.error('❌ Cannot mount Stripe: [data-smoothr-gateway] not found.');
  }
}

document.addEventListener('DOMContentLoaded', initCheckout);
