// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

const scriptEl = document.currentScript || document.getElementById('smoothr-sdk');
const storeId =
  scriptEl?.dataset?.storeId || scriptEl?.getAttribute?.('data-store-id') || null;

if (!scriptEl || !storeId) {
  console.warn(
    '[Smoothr SDK] initialization aborted: #smoothr-sdk script element not found or data-store-id missing'
  );
} else {
  const base = document.currentScript
    ? new URL(document.currentScript.src).origin
    : 'https://smoothr-admin.vercel.app';
  const configUrl =
    document.currentScript?.dataset?.configUrl || new URL('/api/config', base);

  const Smoothr = (window.Smoothr = window.Smoothr || {});
  window.smoothr = window.smoothr || Smoothr;

  Smoothr.ready = fetch(`${configUrl}?store_id=${storeId}`)
    .then(res => res.json())
    .catch(() => ({ public_settings: {}, active_payment_gateway: null }));

  (async () => {
    const fetched = await Smoothr.ready;
    const existing = Smoothr.config || {};
    Smoothr.config = { ...existing, ...fetched };

    try {
      await import('storefronts/features/auth/init.js');
    } catch (err) {
      console.warn('[Smoothr SDK] Auth init failed', err);
    }

    const hasCheckoutTrigger = document.querySelector('[data-smoothr="pay"]');
    if (hasCheckoutTrigger) {
      try {
        await import('storefronts/features/checkout/init.js');
      } catch (err) {
        console.warn('[Smoothr SDK] Checkout init failed', err);
      }
    } else {
      console.warn(
        '[Smoothr SDK] No checkout triggers found, skipping checkout initialization'
      );
    }

    const hasCartTrigger =
      document.querySelector('[data-smoothr="add-to-cart"]') ||
      document.querySelector('[data-smoothr-total]') ||
      document.querySelector('[data-smoothr-cart]');

    if (hasCartTrigger) {
      try {
        await import('storefronts/features/cart/index.js');
      } catch (err) {
        console.warn('[Smoothr SDK] Cart init failed', err);
      }
    } else {
      console.warn(
        '[Smoothr SDK] No cart triggers found, skipping cart initialization'
      );
    }
  })();
}
