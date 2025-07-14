// Smoothr Checkout Script for Webflow with integrated NMI

// Integrated NMI logic
let hasMounted = false;
let isConfigured = false;
let isLocked = false;

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
          const billFirst = document.querySelector('[data-smoothr-bill-first-name]')?.value || '';
          const billLast = document.querySelector('[data-smoothr-bill-last-name]')?.value || '';
          const billingName = `${billFirst} ${billLast}`.trim();
          const billingAddress1 = document.querySelector('[data-smoothr-bill-line1]')?.value || '';
          const billingAddress2 = document.querySelector('[data-smoothr-bill-line2]')?.value || '';
          const billingCity = document.querySelector('[data-smoothr-bill-city]')?.value || '';
          const billingState = document.querySelector('[data-smoothr-bill-state]')?.value || '';
          const billingZip = document.querySelector('[data-smoothr-bill-postal]')?.value || '';
          const billingCountry = document.querySelector('[data-smoothr-bill-country]')?.value || '';
          const shipFirst = document.querySelector('[data-smoothr-first-name]')?.value || '';
          const shipLast = document.querySelector('[data-smoothr-last-name]')?.value || '';
          const shippingName = `${shipFirst} ${shipLast}`.trim();
          const shippingAddress1 = document.querySelector('[data-smoothr-ship-line1]')?.value || '';
          const shippingAddress2 = document.querySelector('[data-smoothr-ship-line2]')?.value || '';
          const shippingCity = document.querySelector('[data-smoothr-ship-city]')?.value || '';
          const shippingState = document.querySelector('[data-smoothr-ship-state]')?.value || '';
          const shippingZip = document.querySelector('[data-smoothr-ship-postal]')?.value || '';
          const shippingCountry = document.querySelector('[data-smoothr-ship-country]')?.value || '';
          const amountElement = document.querySelector('[data-smoothr-total]');
          const amount = amountElement ? parseFloat(amountElement.textContent.replace(/[^0-9.]/g, '')) : 0;
          const currency = window.SMOOTHR_CONFIG.baseCurrency || 'GBP';

          fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_token: response.token,
              store_id: window.SMOOTHR_CONFIG.storeId,
              amount: amount,
              currency: currency,
              email: email,
              billing_firstname: billFirst,
              billing_lastname: billLast,
              billing_address1: billingAddress1,
              billing_address2: billingAddress2,
              billing_city: billingCity,
              billing_state: billingState,
              billing_zip: billingZip,
              billing_country: billingCountry,
              shipping_firstname: shipFirst,
              shipping_lastname: shipLast,
              shipping_address1: shippingAddress1,
              shipping_address2: shippingAddress2,
              shipping_city: shippingCity,
              shipping_state: shippingState,
              shipping_zip: shippingZip,
              shipping_country: shippingCountry
              // Add phone if you have data-smoothr-phone
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

async function initCheckout() {
  if (!window.SMOOTHR_CONFIG) {
    console.error('[Smoothr Checkout] Config not found');
    return;
  }
  console.log('[Smoothr Checkout] SDK initialized');
  console.log('[Smoothr Checkout] SMOOTHR_CONFIG', window.SMOOTHR_CONFIG);

  const gateway = window.SMOOTHR_CONFIG.active_payment_gateway;
  console.log('[Smoothr Checkout] Using gateway:', gateway);

  console.log('[Smoothr Checkout] checkout trigger found', document.querySelector('[data-smoothr-checkout]'));

  if (gateway === 'nmi') {
    try {
      const tokenizationKey = await fetchTokenizationKey(window.SMOOTHR_CONFIG.storeId);
      console.log('[NMI] NMI tokenization key fetched:', tokenizationKey.substring(0, 8) + '...');
      mountNMIFields(tokenizationKey);
    } catch (error) {
      console.error('[Smoothr Checkout] Failed to mount gateway', error);
    }
  }

  const payButton = document.querySelector('[data-smoothr-pay]');
  if (payButton) {
    console.log('[Smoothr Checkout] Pay div found and bound');
  } else {
    console.warn('[Smoothr Checkout] Pay div not found');
  }
}

// Fetch key via Next.js API to bypass RLS
async function fetchTokenizationKey(storeId) {
  const apiBase = window.SMOOTHR_CONFIG.apiBase;
  const response = await fetch(`${apiBase}/api/get-payment-key?storeId=${storeId}&provider=nmi`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`API fetch error: ${response.status}`);
  }
  const data = await response.json();
  if (data && data.tokenization_key) {
    return data.tokenization_key;
  } else {
    throw new Error('No NMI key found');
  }
}

// Run init on load
document.addEventListener('DOMContentLoaded', initCheckout);