let hasMounted = false;
let isConfigured = false;
let isLocked = false;

function mountNMIFields(tokenizationKey) {
  console.log('Attempting to mount NMI fields...');
  if (hasMounted) {
    console.log('NMI fields already mounted, skipping.');
    return;
  }
  hasMounted = true;

  if (document.getElementById('collectjs-script')) {
    console.log('CollectJS already loaded, skipping script append.');
    configureCollectJS(tokenizationKey);
    return;
  }

  const script = document.createElement('script');
  script.id = 'collectjs-script';
  script.src = 'https://secure.nmi.com/token/Collect.js';
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    console.log('CollectJS script loaded.');
    configureCollectJS(tokenizationKey);
  };

  script.onerror = () => {
    console.error('Failed to load CollectJS script.');
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
          console.log('Fields available, setting handlers');
          // Add any blur/focus/validate handlers here if needed
        },
        callback: function(response) {
          console.log('Tokenization response:', response);
          if (response.token) {
            isConfigured = true;
            console.log('Configure success, token:', response.token);
          } else {
            console.log('Configure failed:', response.reason);
          }
          isLocked = false;
        }
      });
    } catch (error) {
      console.error('Error configuring CollectJS:', error);
      isLocked = false;
    }
  }, 500); // Debounce for DOM stability
}

// Export or use as needed
window.Smoothr = window.Smoothr || {};
window.Smoothr.mountNMIFields = mountNMIFields;