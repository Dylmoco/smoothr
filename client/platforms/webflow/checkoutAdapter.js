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

// ─── Utility: detect default country from Webflow settings ──────────────────────────
// Try to read default country from the site's HTML lang (e.g. "en-GB")
function detectCountryFromLang() {
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.includes('-')) {
    return htmlLang.split('-')[1].toUpperCase();
  }
  return null;
}

// Geo-IP fallback: fetch visitor country code via ipapi.co
function geoLookup(callback) {
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => callback(data.country_code || 'GB'))
    .catch(() => callback('GB'));
}

// Initialize both plugins on Webflow’s checkout fields
function initializePickers() {
  const defaultCountry = detectCountryFromLang();
  // COUNTRY SELECT
  const countryEl = document.querySelector('select[name="shipping[country]"]');
  if (countryEl) {
    const initChoices = () => {
      // pre-select either the lang-based or geoIP country
      if (defaultCountry) {
        countryEl.value = defaultCountry;
      }
      new window.Choices(countryEl, { searchEnabled: true, shouldSort: false });
    };
    if (defaultCountry) {
      initChoices();
    } else {
      geoLookup(countryCode => {
        countryEl.value = countryCode;
        initChoices();
      });
    }
  }

  // PHONE INPUT
  const phoneEl = document.querySelector('input[name="shipping[phone]"]');
  if (phoneEl) {
    window.intlTelInput(phoneEl, {
      separateDialCode: true,
      initialCountry: defaultCountry ? defaultCountry.toLowerCase() : 'auto',
      geoIpLookup: geoLookup,
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
    });
  }
}
