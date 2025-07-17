// ─── Dynamic Asset Loader for Country & Phone Fields ────────────────────────────
// Dynamically inject CSS files
function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// Dynamically inject JS files with callback
function loadScript(src, cb) {
  const s = document.createElement('script');
  s.src = src;
  s.onload = cb;
  document.head.appendChild(s);
}

// Inject Choices.js & intl-tel-input CSS
loadCSS('https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.min.css');

// Load Choices.js → intl-tel-input → intl-tel-input utils → initialize
loadScript('https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js', () => {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js', () => {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js', initializePickers);
  });
});

// Initialize both plugins on Webflow’s checkout fields
function initializePickers() {
  const countryEl = document.querySelector('select[name="shipping[country]"]');
  if (countryEl) {
    new window.Choices(countryEl, { searchEnabled: true, shouldSort: false });
  }

  const phoneEl = document.querySelector('input[name="shipping[phone]"]');
  if (phoneEl) {
    window.intlTelInput(phoneEl, {
      separateDialCode: true,
      initialCountry: 'gb',
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
    });
  }
}
