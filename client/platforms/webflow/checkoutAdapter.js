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


// ─── Utilities ───────────────────────────────────────────────────────────────────
// Try to read default country from the page’s <html lang="xx-YY">
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


// ─── Initialize all three pickers & auto-select ─────────────────────────────────
function initializePickers() {
  const defaultCountry = detectCountryFromLang();

  // gather our three selects
  const selects = [
    document.querySelector('select[name="shipping[country]"]'),
    document.querySelector('select[name="billing[country]"]'),
    document.querySelector('select[name="phone[country]"]')
  ].filter(Boolean);

  // turn them into searchable dropdowns
  selects.forEach(sel => {
    new window.Choices(sel, {
      searchEnabled: true,
      shouldSort: false,
      placeholderValue: 'Search…'
    });
  });

  // helper to apply default by ISO code
  function applyDefault(iso) {
    selects.forEach(sel => {
      if (sel.name === 'phone[country]') {
        // phone select has values like "GB|+44"
        const match = Array.from(sel.options)
          .find(o => o.value.split('|')[0] === iso);
        if (match) sel.value = match.value;
      } else {
        // billing/shipping country have plain ISO values
        if (sel.querySelector(`option[value="${iso}"]`)) {
          sel.value = iso;
        }
      }
    });
  }

  // run immediately or via Geo-IP
  if (defaultCountry) {
    applyDefault(defaultCountry);
  } else {
    geoLookup(applyDefault);
  }

  // finally, init intl-tel-input on your phone **input**
  const phoneInput = document.querySelector('input[name="shipping[phone]"]');
  if (phoneInput) {
    window.intlTelInput(phoneInput, {
      separateDialCode: true,
      initialCountry: 'auto',
      geoIpLookup: geoLookup,
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
    });
  }
}
