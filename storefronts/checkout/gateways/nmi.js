// NMI Gateway Logic
let hasMounted = false;
let isConfigured = false;
let isLocked = false;

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
  console.log('[NMI] Set data-tokenization-key on script tag:', tokenizationKey.substring(0, 8) + '...');
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
    console.error('[NMI] CollectJS not ready or locked, delaying configuration.');
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
        cvv: { selector: '[data-smoothr-card-cvc]' }
      },
      fieldsAvailableCallback: function() {
        console.log('[NMI] Fields available, setting handlers');
      },
      callback: function(response) {
        console.log('[NMI] Tokenization response:', response);
        if (response.token) {
          console.log('[NMI] Success, token:', response.token);
          console.log('[NMI] Sending POST with store_id:', window.SMOOTHR_CONFIG.storeId);
          // Get values from data attributes
          const email = document.querySelector('[data-smoothr-email]')?.value || '';
          const phone = document.querySelector('[data-smoothr-phone]')?.value || '';
          const billFirst = document.querySelector('[data-smoothr-bill-first-name]')?.value || '';
          const billLast = document.querySelector('[data-smoothr-bill-last-name]')?.value || '';
          const billingAddress1 = document.querySelector('[data-smoothr-bill-line1]')?.value || '';
          const billingAddress2 = document.querySelector('[data-smoothr-bill-line2]')?.value || '';
          const billingCity = document.querySelector('[data-smoothr-bill-city]')?.value || '';
          const billingState = document.querySelector('[data-smoothr-bill-state]')?.value || '';
          const billingZip = document.querySelector('[data-smoothr-bill-postal]')?.value || '';
          const billingCountry = document.querySelector('[data-smoothr-bill-country]')?.value || '';
          const shipFirst = document.querySelector('[data-smoothr-first-name]')?.value || '';
          const shipLast = document.querySelector('[data-smoothr-last-name]')?.value || '';
          const shippingAddress1 = document.querySelector('[data-smoothr-ship-line1]')?.value || '';
          const shippingAddress2 = document.querySelector('[data-smoothr-ship-line2]')?.value || '';
          const shippingCity = document.querySelector('[data-smoothr-ship-city]')?.value || '';
          const shippingState = document.querySelector('[data-smoothr-ship-state]')?.value || '';
          const shippingZip = document.querySelector('[data-smoothr-ship-postal]')?.value || '';
          const shippingCountry = document.querySelector('[data-smoothr-ship-country]')?.value || '';
          const amountElement = document.querySelector('[data-smoothr-total]');
          const amount = amountElement ? parseFloat(amountElement.textContent.replace(/[^0-9.]/g, '')) : 0;
          const currency = window.SMOOTHR_CONFIG.baseCurrency || 'GBP';
          const orderId = 'smoothr-' + Date.now();
          const orderDescription = 'Smoothr Checkout Order';
          console.log('[NMI] SDK cart:', window.Smoothr.cart); // Log to debug
          const cartItems = window.Smoothr.cart.getCart() || []; // Call getCart to fetch items
          const cart = cartItems.map(item => ({
            product_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }));

          if (cart.length === 0) {
            console.error('[NMI] Cart is empty');
            return;
          }

          fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_token: response.token,
              store_id: window.SMOOTHR_CONFIG.storeId,
              first_name: shipFirst,
              last_name: shipLast,
              email: email,
              phone: phone,
              shipping: {
                name: `${shipFirst} ${shipLast}`.trim(),
                address: {
                  line1: shippingAddress1,
                  line2: shippingAddress2,
                  city: shippingCity,
                  state: shippingState,
                  postal_code: shippingZip,
                  country: shippingCountry
                }
              },
              billing: {
                name: `${billFirst} ${billLast}`.trim(),
                address: {
                  line1: billingAddress1,
                  line2: billingAddress2,
                  city: billingCity,
                  state: billingState,
                  postal_code: billingZip,
                  country: billingCountry
                }
              },
              cart: cart,
              total: amount,
              currency: currency,
              description: orderDescription
            })
          }).then(res => res.json()).then(data => console.log('[NMI] Backend response:', data))
          .catch(error => console.error('[NMI] POST error:', error));
        } else {
          console.log('[NMI] Failed:', response.reason);
        }
      }
    });
    isConfigured = true;
    console.log('[NMI] CollectJS configured successfully');
  } catch (error) {
    console.error('[NMI] Error configuring CollectJS:', error);
    isLocked = false;
  }
}