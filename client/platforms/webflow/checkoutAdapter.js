// ─── Dynamic Asset Loader for Country & Phone Fields ────────────────────────────
function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src, cb) {
  const s = document.createElement('script');
  s.src = src;
  s.onload = cb;
  document.head.appendChild(s);
}

// inject the CSS
loadCSS('https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css');
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.min.css');

// load the scripts in sequence, then defer initialization until DOMContentLoaded
loadScript('https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js', () => {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js', () => {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js', () => {
      document.addEventListener('DOMContentLoaded', initializePickers);
    });
  });
});

// ─── Utilities ───────────────────────────────────────────────────────────────────
function detectCountryFromLang() {
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.includes('-')) {
    return htmlLang.split('-')[1].toUpperCase();
  }
  return null;
}

function geoLookup(callback) {
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => callback(data.country_code || 'GB'))
    .catch(() => callback('GB'));
}

// ─── Bootstrap & Initialize all pickers & auto-select ───────────────────────────
function bootstrap(iso) {
  const shippingSelect = document.querySelector('select[name="shipping[country]"]');
  const billingSelect  = document.querySelector('select[name="billing[country]"]');
  const phoneSelect    = document.querySelector('select[name="phone[country]"]');
  const selects = [shippingSelect, billingSelect, phoneSelect].filter(Boolean);

  // set each <select> to the detected ISO
  selects.forEach(sel => {
    if (sel.name === 'phone[country]') {
      const match = Array.from(sel.options).find(o => o.value.split('|')[0] === iso);
      if (match) sel.value = match.value;
    } else if (sel.querySelector(`option[value="${iso}"]`)) {
      sel.value = iso;
    }
  });

  // initialize Choices.js on the selects
  selects.forEach(sel => {
    new window.Choices(sel, {
      searchEnabled: true,
      shouldSort: false,
      placeholderValue: 'Search…'
    });
  });

  // initialize intl-tel-input on the phone input
  const phoneInput = document.querySelector('input[name="shipping[phone]"]');
  if (phoneInput) {
    window.intlTelInput(phoneInput, {
      separateDialCode: true,
      initialCountry: iso.toLowerCase(),
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
    });
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────────
function initializePickers() {
  // Always force Geo-IP lookup for country detection
  geoLookup(bootstrap);
}
