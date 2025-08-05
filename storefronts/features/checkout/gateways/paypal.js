import { getPublicCredential } from '../getPublicCredential.js';
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';
import { disableButton, enableButton } from '../utils/cartHash.js';

let mounted = false;
let isSubmitting = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', reject);
    document.head.appendChild(script);
  });
}

export function initPayPal(opts) {
  console.log('[Smoothr][PayPal] initPayPal called with', opts);
  return mountCardFields(opts);
}

export async function mountCardFields() {
  if (mounted) return;
  const container = document.querySelector('[data-smoothr-pay]');
  if (!container) return;
  mounted = true;

  // prevent default Smoothr click handler
  container.addEventListener('click', e => e.stopImmediatePropagation(), true);

  const storeId = window.SMOOTHR_CONFIG?.storeId;
  const cred = await getPublicCredential(storeId, 'paypal');
  const clientId = cred?.settings?.client_id || cred?.api_key || '';
  if (!clientId) {
    console.warn('[Smoothr PayPal] Missing client_id');
    return;
  }

  await loadScript(`https://www.paypal.com/sdk/js?client-id=${clientId}`);

  const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';

  const paypalButtons = window.paypal.Buttons({
      createOrder: async () => {
        const q = s => document.querySelector(s);
      const totalEl = q('[data-smoothr-total]');
      const total =
        window.Smoothr?.cart?.getTotal?.() ||
        parseInt(totalEl?.textContent?.replace(/[^0-9]/g, '') || '0', 10) ||
        0;
      const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';
      const res = await fetch(`${apiBase}/api/checkout/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency, store_id: storeId })
      });
      const data = await res.json();
      return data.id;
    },
    onApprove: async data => {
      const q = s => document.querySelector(s);
      const first = q('[data-smoothr-first-name]')?.value?.trim() || '';
      const last = q('[data-smoothr-last-name]')?.value?.trim() || '';
      const email = q('[data-smoothr-email]')?.value?.trim() || '';
      const shipping = {
        name: `${first} ${last}`.trim(),
        address: {
          line1: q('[data-smoothr-ship-line1]')?.value?.trim() || '',
          line2: q('[data-smoothr-ship-line2]')?.value?.trim() || '',
          city: q('[data-smoothr-ship-city]')?.value?.trim() || '',
          state: q('[data-smoothr-ship-state]')?.value?.trim() || '',
          postal_code: q('[data-smoothr-ship-postal]')?.value?.trim() || '',
          country: q('[data-smoothr-ship-country]')?.value?.trim() || ''
        }
      };
      const billing = {
        name: `${q('[data-smoothr-bill-first-name]')?.value?.trim() || ''} ${
          q('[data-smoothr-bill-last-name]')?.value?.trim() || ''
        }`.trim(),
        address: {
          line1: q('[data-smoothr-bill-line1]')?.value?.trim() || '',
          line2: q('[data-smoothr-bill-line2]')?.value?.trim() || '',
          city: q('[data-smoothr-bill-city]')?.value?.trim() || '',
          state: q('[data-smoothr-bill-state]')?.value?.trim() || '',
          postal_code: q('[data-smoothr-bill-postal]')?.value?.trim() || '',
          country: q('[data-smoothr-bill-country]')?.value?.trim() || ''
        }
      };

      const cart = window.Smoothr?.cart?.getCart()?.items || [];
      const totalEl = q('[data-smoothr-total]');
      const total =
        window.Smoothr?.cart?.getTotal?.() ||
        parseInt(totalEl?.textContent?.replace(/[^0-9]/g, '') || '0', 10) ||
        0;
      const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';

      const payload = {
        orderID: data.orderID,
        store_id: storeId,
        email,
        first_name: first,
        last_name: last,
        shipping,
        billing,
        cart,
        total,
        currency,
        customer_id: window.smoothr?.auth?.user?.value?.id || null,
        platform: window.SMOOTHR_CONFIG?.platform
      };

      const res = await fetch(`${apiBase}/api/checkout/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.clone().json().catch(() => ({}));
      handleSuccessRedirect(res, result);
    },
      onError: err => console.error('[Smoothr PayPal]', err)
    });

  document.querySelectorAll('[data-smoothr-pay]').forEach(el => {
    paypalButtons.render(el);
  });

  // --- Hosted Fields Integration ---
  // After the Buttons render, check if the HostedFields API is available.
  if (window.paypal?.HostedFields) {
    // Reuse the same createOrder logic used for the Buttons
    const createOrder = paypalButtons?.fundingSource
      ? paypalButtons.createOrder
      : async () => {
          const q = s => document.querySelector(s);
          const totalEl = q('[data-smoothr-total]');
          const total =
            window.Smoothr?.cart?.getTotal?.() ||
            parseInt(totalEl?.textContent?.replace(/[^0-9]/g, '') || '0', 10) ||
            0;
          const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';
          const res = await fetch(`${apiBase}/api/checkout/paypal/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total, currency, store_id: storeId })
          });
          const data = await res.json();
          return data.id;
        };

    // Hosted Fields selectors - support both cvc and cvv naming
    const selectors = {
      number: '[data-smoothr-card-number]',
      expiry: '[data-smoothr-card-expiry]',
      cvv: '[data-smoothr-card-cvc], [data-smoothr-card-cvv]'
    };
    // Diagnostic: log counts of each selector
    console.log(
      '[Smoothr][PayPal] HostedFields selectors counts:',
      'number=', document.querySelectorAll(selectors.number).length,
      'expiry=', document.querySelectorAll(selectors.expiry).length,
      'cvv=', document.querySelectorAll(selectors.cvv).length
    );

    // Mount Hosted Fields into the generic Smoothr selectors
    window.paypal.HostedFields.render({
      createOrder,
      styles: { input: { 'font-size': '16px' } },
      fields: {
        number: { selector: selectors.number },
        expirationDate: { selector: selectors.expiry },
        cvv: { selector: selectors.cvv }
      }
    })
      .then(hostedFields => {
        // Attach click handlers to any element with [data-smoothr-pay]
        document.querySelectorAll('[data-smoothr-pay]').forEach(btn => {
          btn.addEventListener('click', async ev => {
            ev.preventDefault();
            if (isSubmitting) return;
            isSubmitting = true;
            disableButton(btn);
            try {
              const payload = await hostedFields.submit({ contingency: '3D_SECURE' });
              const res = await fetch(`${apiBase}/api/checkout/paypal/capture-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store_id: storeId, orderID: payload.orderId })
              });
              const json = await res.json();
              handleSuccessRedirect(null, json);
            } catch (err) {
              console.error('[Smoothr PayPal]', err);
            } finally {
              isSubmitting = false;
              enableButton(btn);
            }
          });
        });
      })
      .catch(err => console.error('[Smoothr PayPal]', err));
  }
}

export function isMounted() {
  return mounted;
}

export function ready() {
  return !!window.paypal;
}

export async function createPaymentMethod() {
  return { payment_method: { id: 'paypal' } };
}

export default {
  initPayPal,
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};
