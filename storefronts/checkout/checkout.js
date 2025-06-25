export function initCheckout() {
  const block = document.querySelector('.smoothr-checkout');
  if (!block) return;

  const productId = block.dataset.smoothrProductId;
  const emailField = block.querySelector('.smoothr-field-email');
  const totalEl = block.querySelector('.smoothr-total');
  const paymentContainer = block.querySelector('.smoothr-payment-element');
  const submitBtn = block.querySelector('.smoothr-submit');

  const total = parseInt((totalEl?.textContent || '0').replace(/[^0-9]/g, ''), 10) || 0;

  // TODO: Support multiple gateways besides Stripe
  const stripePk = window.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripe = Stripe(stripePk);
  const elements = stripe.elements();
  const paymentElement = elements.create('payment');
  paymentElement.mount(paymentContainer);

  submitBtn?.addEventListener('click', async () => {
    submitBtn.disabled = true;
    const email = emailField?.value || '';
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, email, product_id: productId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      const { client_secret } = data;
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: client_secret,
        confirmParams: { receipt_email: email }
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
