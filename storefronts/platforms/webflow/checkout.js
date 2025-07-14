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

  if (document.getElementById('collectjs-script')) {
    console.log('[NMI] CollectJS already loaded, skipping script append.');
    configureCollectJS(tokenizationKey);
    return;
  }

  const script = document.createElement('script');
  script.id = 'collectjs-script';
  script.src = 'https://secure.nmi.com/token/Collect.js';
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    console.log('[NMI] CollectJS script loaded.');
    configureCollectJS(tokenizationKey);
  };

  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS script.');
  };
}

function configureCollectJS(tokenizationKey) {
  if (isLocked) return;
  isLocked = true;

  setTimeout(() => {
    try {
      CollectJS.configure({
        tokenizationKey: tokenizationKey,
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
            isConfigured = true;
            console.log('[NMI] Success, token:', response.token);
            // Send token to backend
          } else {
            console.log('[NMI] Failed:', response.reason);
          }
          isLocked = false;
        }
      });
    } catch (error) {
      console.error('[NMI] Error configuring CollectJS:', error);
      isLocked = false;
    }
  }, 500);
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

// Fetch key from Supabase using client
async function fetchTokenizationKey(storeId) {
  const supabaseUrl = 'https://lpuqrzvokroazwlricgn.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXFyenZva3JvYXp3bHJpY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTM2MzQsImV4cCI6MjA2NTI4OTYzNH0.bIItSJMzdx9BgXm5jOtTFI03yq94CLVHepiPQ0Xl_lU'; // Your anon key
  const supabaseClient = new SupabaseClient(supabaseUrl, anonKey);
  const { data, error } = await supabaseClient
    .from('store_integrations')
    .select('tokenization_key')
    .eq('store_id', storeId)
    .eq('provider', 'nmi')
    .single();

  if (error) {
    throw new Error(`Supabase query error: ${error.message}`);
  }
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

  if (typeof CollectJS.startTokenization !== 'function') {
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