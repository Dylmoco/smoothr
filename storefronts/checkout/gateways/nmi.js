// NMI Gateway Logic
let hasMounted = false;
let isConfigured = false;
let isLocked = false;

// Shared post-success behavior
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';
import { resolveTokenizationKey } from '../providers/nmi.js';

// Entry point: call this with your tokenization key
export function initNMI(tokenizationKey) {
  mountNMIFields(tokenizationKey);
}

export async function mountNMI() {
  const tokenizationKey = await resolveTokenizationKey();
  if (tokenizationKey) {
    mountNMIFields(tokenizationKey);
  }
}

function mountNMIFields(tokenizationKey) {
  console.log('[NMI] Attempting to mount NMI fields...');
  if (hasMounted) {
    console.log('[NMI] NMI fields already mounted, skipping.');
    return;
  }
  hasMounted = true;

  const script = document.createElement('script');
  script.id = 'collectjs-script';
  script.src = 'https://secure.nmi.com/token/Collect.js';
  script.setAttribute('data-tokenization-key', tokenizationKey);
  console.log(
    '[NMI] Set data-tokenization-key on script tag:',
    tokenizationKey.substring(0, 8) + '…'
  );
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    console.log('[NMI] CollectJS script loaded.');
    configureCollectJS();
  };
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS script.');
  };
}

function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    console.error(
      '[NMI] CollectJS not ready or locked, delaying configuration.'
    );
    return setTimeout(configureCollectJS, 500);
  }
  isLocked = true;

  try {
    CollectJS.configure({
      variant: 'inline',
      paymentSelector: '[data-smoothr-pay]',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]' },
        ccexp:    { selector: '[data-smoothr-card-expiry]' },
        cvv:      { selector: '[data-smoothr-card-cvc]' }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available, setting handlers');
      },
      callback(response) {
        console.log('[NMI] Tokenization response:', response);
        if (!response.token) {
          console.log('[NMI] Failed:', response.reason);
          isLocked = false;
          return;
        }

        console.log('[NMI] Success, token:', response.token);
        console.log(
          '[NMI] Sending POST with store_id:',
          window.SMOOTHR_CONFIG.storeId
        );

        // Gather required form values
        const firstName  = document.querySelector('[data-smoothr-first-name]')?.value || '';
        const lastName   = document.querySelector('[data-smoothr-last-name]')?.value  || '';
        const email      = document.querySelector('[data-smoothr-email]')?.value      || '';
        const shipLine1  = document.querySelector('[data-smoothr-ship-line1]')?.value || '';
        const shipLine2  = document.querySelector('[data-smoothr-ship-line2]')?.value || '';
        const shipCity   = document.querySelector('[data-smoothr-ship-city]')?.value  || '';
        const shipState  = document.querySelector('[data-smoothr-ship-state]')?.value || '';
        const shipPostal = document.querySelector('[data-smoothr-ship-postal]')?.value|| '';
        const shipCountry= document.querySelector('[data-smoothr-ship-country]')?.value || '';

        const amountEl = document.querySelector('[data-smoothr-total]');
        const amount   = amountEl
          ? Math.round(parseFloat(amountEl.textContent.replace(/[^0-9.]/g, '')) * 100)
          : 0;
        const currency = window.SMOOTHR_CONFIG.baseCurrency || 'GBP';

        // Build cart payload
        const cartData  = window.Smoothr.cart.getCart() || {};
        const cartItems = Array.isArray(cartData.items) ? cartData.items : [];
        const cart = cartItems.map(item => ({
          product_id: item.id   || 'unknown',
          name:       item.name,
          quantity:   item.quantity,
          price:      Math.round((item.price ?? 0) * 100)
        }));
        if (cart.length === 0) {
          console.error('[NMI] Cart is empty');
          isLocked = false;
          return;
        }

        // Send to backend
        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_token: response.token,
            store_id:      window.SMOOTHR_CONFIG.storeId,
            first_name:    firstName,
            last_name:     lastName,
            email:         email,
            shipping: {
              name: `${firstName} ${lastName}`.trim(),
              address: {
                line1:       shipLine1,
                line2:       shipLine2,
                city:        shipCity,
                state:       shipState,
                postal_code: shipPostal,
                country:     shipCountry
              }
            },
            cart,
            total:    amount,
            currency: currency
          })
        })
          .then(res =>
            res.json().then(data => {
              console.log('[NMI] Backend response:', data);
              // Clear cart & redirect on success
              handleSuccessRedirect(res, data);
              isLocked = false;
            })
          )
          .catch(error => {
            console.error('[NMI] POST error:', error);
            isLocked = false;
          });
      }
    });

    isConfigured = true;
    console.log('[NMI] CollectJS configured successfully');
  } catch (error) {
    console.error('[NMI] Error configuring CollectJS:', error);
    isLocked = false;
  }
}
