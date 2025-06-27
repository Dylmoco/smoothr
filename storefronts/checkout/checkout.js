export function initCheckout() {
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
  const stripePk = window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripe = Stripe(stripePk);

  submitBtn?.addEventListener('click', async () => {
    submitBtn.disabled = true;
    const email = emailField?.value || '';
    try {
      const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
      const res = await fetch(`${apiBase}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, email, product_id: productId })
      });

      const { client_secret } = await res.json();
      if (!res.ok || !client_secret) throw new Error('Missing client_secret');

      const elements = stripe.elements({ clientSecret: client_secret });
      const paymentElement = elements.create('payment');
      if (paymentContainer) {
        paymentElement.mount(paymentContainer);
      } else {
        console.warn('Payment container not found, skipping mount');
      }

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
    }
  });
}

document.addEventListener('DOMContentLoaded', initCheckout);
