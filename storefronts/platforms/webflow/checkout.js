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
          fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_token: response.token })
          }).then(res => res.json()).then(data => console.log('[NMI] Backend response:', data));
        } else {
          console.log('[NMI] Failed:', response.reason);
        }
        isLocked = false;
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

  const payButton = document.querySelector('[data-smoothr-checkout]');
  if (payButton) {
    payButton.addEventListener('click', handlePaymentSubmit);
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

// Payment submit handler
function handlePaymentSubmit(event) {
  event.preventDefault();
  console.log('[Smoothr Checkout] Pay div clicked, starting tokenization check');

  if (!isConfigured || typeof CollectJS.startTokenization !== 'function') {
    console.log('[Smoothr Checkout] Tokenize not available, config failed');
    return;
  }

  try {
    CollectJS.startTokenization();
  } catch (error) {
    console.log('[Smoothr Checkout] Tokenization error:', error);
  }
}

// Run init on load
document.addEventListener('DOMContentLoaded', initCheckout);