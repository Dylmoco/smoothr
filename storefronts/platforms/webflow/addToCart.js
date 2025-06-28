export function initCartBindings() {
  console.log('🧩 initCartBindings loaded and executing');
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart?.addItem) {
    console.warn('smoothr:addToCart cart module not found');
    return;
  }

  const buttons = document.querySelectorAll('[data-smoothr-add]');
  console.log(
    `smoothr:addToCart found ${buttons.length} [data-smoothr-add] elements`
  );

  if (buttons.length === 0) {
    console.warn('smoothr:addToCart no buttons found; retrying...');
    setTimeout(initCartBindings, 500);
    return;
  }

  buttons.forEach(btn => {
    console.log('🔗 binding [data-smoothr-add] button', btn);
    if (btn.__smoothrBound) return;
    btn.__smoothrBound = true;

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🛒 Add to cart clicked:', btn);
      try {
        const rawPrice = btn.getAttribute('data-product-price') || '0';
        const price = Math.round(parseFloat(rawPrice) * 100);
        const product_id = btn.getAttribute('data-product-id');
        const name = btn.getAttribute('data-product-name');
        const options = btn.getAttribute('data-product-options');
        const isSubscription =
          btn.getAttribute('data-product-subscription') === 'true';

        if (!product_id || !name || isNaN(price)) {
          console.warn('🧨 Missing required cart attributes on:', btn);
          return;
        }

        Smoothr.cart.addItem({
          product_id,
          name,
          price,
          quantity: 1,
          options: options ? JSON.parse(options) : undefined,
          isSubscription
        });
        if (typeof window.renderCart === 'function') {
          console.log('🧼 Calling renderCart() to update UI');
          window.renderCart();
        } else {
          console.warn('⚠️ renderCart not found');
        }
      } catch (err) {
        console.error('smoothr:addToCart failed', err);
      }
    });
  });
}

export function initAddToCart() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartBindings);
  } else {
    initCartBindings();
  }
}

if (typeof window !== 'undefined') {
  initAddToCart();
}
