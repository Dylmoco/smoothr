// NMI Gateway Logic
let hasMounted = false;
let isConfigured = false;
let isLocked = false;

export async function mountCardFields() {
  console.log('[NMI] Mounting fields...');
  if (hasMounted) return;
  const tokenizationKey = await getTokenizationKey(); // Fetch key if needed
  if (!tokenizationKey) {
    console.error('[NMI] No key');
    return;
  }
  mountNMIFields(tokenizationKey);
}

async function getTokenizationKey() {
  // Add logic to fetch from Supabase like Stripe does
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  if (!storeId) return null;
  try {
    const { data } = await supabase
      .from('store_integrations')
      .select('settings')
      .eq('store_id', storeId)
      .eq('provider', 'nmi')
      .single();
    return data?.settings?.tokenization_key || '';
  } catch (e) {
    console.error('[NMI] Key fetch failed:', e);
    return null;
  }
}

function mountNMIFields(tokenizationKey) {
  if (hasMounted) return;
  hasMounted = true;
  const script = document.createElement('script');
  script.id = 'collectjs-script';
  script.src = 'https://secure.nmi.com/token/Collect.js';
  script.setAttribute('data-tokenization-key', tokenizationKey);
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => configureCollectJS();
  script.onerror = () => console.error('[NMI] Script load failed');
}

function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
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
      fieldsAvailableCallback: () => console.log('[NMI] Fields ready'),
      callback: (response) => {} // Empty; handled in createPaymentMethod
    });
    isConfigured = true;
  } catch (error) {
    console.error('[NMI] Config error:', error);
    isLocked = false;
  }
}

export function isMounted() {
  return hasMounted && isConfigured;
}

export function ready() {
  return isConfigured && typeof CollectJS !== 'undefined';
}

export async function createPaymentMethod(billing_details) {
  if (!ready()) return { error: { message: 'NMI not ready' }, payment_method: null };
  return new Promise((resolve) => {
    const callback = (response) => {
      if (response.token) {
        resolve({ error: null, payment_method: { token: response.token } });
      } else {
        resolve({ error: { message: response.reason || 'Failed' }, payment_method: null });
      }
    };
    CollectJS.configure({ ...CollectJS.config, callback });
    CollectJS.startPayment();
  });
}

export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};