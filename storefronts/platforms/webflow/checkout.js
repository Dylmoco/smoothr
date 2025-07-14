// Smoothr Checkout Script for Webflow with integrated NMI

const SMOOTHR_CONFIG = {
    storeId: 'a3fea30b-8a63-4a72-9040-6049d88545d0',
    platform: 'webflow-ecom',
    debug: true,
    rateSource: 'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates',
    baseCurrency: 'GBP',
    apiBase: 'https://smoothr.vercel.app',
    active_payment_gateway: 'nmi'
  };
  
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
              // Here, send the token to your backend for payment
              // e.g., fetch('/api/checkout/nmi', { method: 'POST', body: JSON.stringify({ payment_token: response.token, ...other data }) })
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
    console.log('[Smoothr Checkout] SDK initialized');
    console.log('[Smoothr Checkout] SMOOTHR_CONFIG', SMOOTHR_CONFIG);
  
    const gateway = SMOOTHR_CONFIG.active_payment_gateway;
    console.log('[Smoothr Checkout] Using gateway:', gateway);
  
    // Element checks
    console.log('[Smoothr Checkout] checkout trigger found', document.querySelector('[data-smoothr-checkout]'));
    // Add other checks as in your original code...
  
    if (gateway === 'nmi') {
      try {
        const tokenizationKey = await fetchTokenizationKey(SMOOTHR_CONFIG.storeId);
        console.log('[NMI] NMI tokenization key fetched:', tokenizationKey.substring(0, 8) + '...');
        mountNMIFields(tokenizationKey);
      } catch (error) {
        console.error('[Smoothr Checkout] Failed to mount gateway', error);
      }
    }
  
    // Bind pay button (assume your button has id or attribute like data-smoothr-submit="pay")
    const payButton = document.querySelector('[data-smoothr-submit]') || document.getElementById('pay-button');
    if (payButton) {
      payButton.addEventListener('click', handlePaymentSubmit);
    } else {
      console.warn('[Smoothr Checkout] Pay button not found');
    }
  }
  
  // Fetch key from Supabase (adjust if your original fetch is different)
  async function fetchTokenizationKey(storeId) {
    // This is a placeholder - replace with your actual Supabase fetch code
    // Example using fetch to Supabase REST
    const supabaseUrl = 'https://lpuqrzvokroazwlricgn.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXFyenZva3JvYXp3bHJpY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTM2MzQsImV4cCI6MjA2NTI4OTYzNH0.bIItSJMzdx9BgXm5jOtTFI03yq94CLVHepiPQ0Xl_lU'; // Get this from your Supabase dashboard, it's public
    const response = await fetch(`${supabaseUrl}/rest/v1/store_integrations?provider=eq.nmi&select=tokenization_key`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    const data = await response.json();
    if (data && data[0]) {
      return data[0].tokenization_key;
    } else {
      throw new Error('No NMI key found');
    }
  }
  
  // Payment submit handler
  function handlePaymentSubmit(event) {
    event.preventDefault();
    console.log('[Smoothr Checkout] Pay button clicked, starting tokenization check');
  
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