// NMI Gateway Logic
let hasMounted = false;
let isConfigured = false;
let isLocked = false;

// Import the shared redirect helper
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

export function initNMI(tokenizationKey) {
  mountNMIFields(tokenizationKey);
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
    setTimeout(configureCollectJS, 500);
    return;
  }
  isLocked = true;

  try {
    CollectJS.configure({
      variant: 'inline',
      paymentSelector: '[data-smoothr-pay]',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]' },
        ccexp: { selector: '[data-smoothr-card-expiry]' },
        cvv: { selector: '[data-smoothr-card-cvc]' },
      },
      fieldsAvailableCallback: function () {
        console.log('[NMI] Fields available, setting handlers');
      },
      callback: function (response) {
        console.log('[NMI] Tokenization response:', response);
        if (response.token) {
          console.log('[NMI] Success, token:', response.token);
          console.log(
            '[NMI] Sending POST with store_id:',
            window.SMOOTHR_CONFIG.storeId
          );
          // Gather form values…
          const email =
            document.querySelector('[data-smoothr-email]')?.value || '';
          /* … all your other selectors … */
          const amountElement = document.querySelector('[data-smoothr-total]');
          const amount = amountElement
            ? parseFloat(
                amountElement.textContent.replace(/[^0-9.]/g, '')
              ) * 100
            : 0;
          const currency = window.SMOOTHR_CONFIG.baseCurrency || 'GBP';
          const cartData = window.Smoothr.cart.getCart() || {};
          const cartItems = Array.isArray(cartData.items)
            ? cartData.items
            : [];
          const cart = cartItems.map((item) => ({
            product_id: item.id || 'unknown',
            name: item.name,
            quantity: item.quantity,
            price: item.price * 100,
          }));

          if (cart.length === 0) {
            console.error('[NMI] Cart is empty');
            return;
          }

          // Post to your API, then invoke shared redirect on success
          fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_token: response.token,
              store_id: window.SMOOTHR_CONFIG.storeId,
              /* … rest of payload … */
              cart,
              total: amount,
              currency,
            }),
          })
            .then((res) =>
              res.json().then((data) => {
                console.log('[NMI] Backend response:', data);
                // Shared cart-clear + redirect logic
                handleSuccessRedirect(res, data);
              })
            )
            .catch((error) =>
              console.error('[NMI] POST error:', error)
            );
        } else {
          console.log('[NMI] Failed:', response.reason);
        }
      },
    });
    isConfigured = true;
    console.log('[NMI] CollectJS configured successfully');
  } catch (error) {
    console.error('[NMI] Error configuring CollectJS:', error);
    isLocked = false;
  }
}
