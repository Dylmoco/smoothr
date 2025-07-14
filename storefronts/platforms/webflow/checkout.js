// Smoothr Checkout Script for Webflow

// Config and globals
const SMOOTHR_CONFIG = {
    storeId: 'a3fea30b-8a63-4a72-9040-6049d88545d0',
    platform: 'webflow-ecom',
    debug: true,
    rateSource: 'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates',
    baseCurrency: 'GBP',
    apiBase: 'https://smoothr.vercel.app',
    active_payment_gateway: 'nmi'
  };
  
  // Include nmi.js logic or assume it's loaded separately
  // For this replacement, assume mountNMIFields is available via window.Smoothr
  
  async function initCheckout() {
    console.log('[Smoothr Checkout] SDK initialized');
    console.log('[Smoothr Checkout] SMOOTHR_CONFIG', SMOOTHR_CONFIG);
  
    const gateway = SMOOTHR_CONFIG.active_payment_gateway;
    console.log('[Smoothr Checkout] Using gateway:', gateway);
  
    // Check for checkout elements
    console.log('[Smoothr Checkout] checkout trigger found', document.querySelector('[data-smoothr-checkout]'));
    // Other element checks...
  
    if (gateway === 'nmi') {
      try {
        // Assume tokenizationKey is fetched from Supabase here
        const tokenizationKey = await fetchTokenizationKey(); // Replace with your fetch logic
        console.log('[NMI] NMI tokenization key fetched:', tokenizationKey.substring(0, 8) + '...');
        window.Smoothr.mountNMIFields(tokenizationKey);
      } catch (error) {
        console.error('[Smoothr Checkout] Failed to mount gateway', error);
      }
    }
  
    // Bind submit button
    const payButton = document.querySelector('[data-smoothr-submit]'); // Assume your pay button attribute
    if (payButton) {
      payButton.addEventListener('click', handlePaymentSubmit);
    }
  }
  
  // Placeholder for fetching key from Supabase
  async function fetchTokenizationKey() {
    // Your Supabase fetch logic here
    return 'zW39fn-r7Y7eM-FztqsN-y4btas'; // Placeholder from logs, replace with real fetch
  }
  
  // Payment submit handler
  function handlePaymentSubmit() {
    console.log('Pay button clicked, starting tokenization check');
  
    if (typeof CollectJS.startTokenization !== 'function') {
      console.log('Tokenize not available, config failed');
      return; // Show user error if needed
    }
  
    try {
      CollectJS.startTokenization();
    } catch (error) {
      console.log('Tokenization error:', error);
      // Handle user-facing error
    }
  }
  
  // Run init on load
  document.addEventListener('DOMContentLoaded', initCheckout);