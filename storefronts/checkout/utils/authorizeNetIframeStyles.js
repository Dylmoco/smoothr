import computedInputStyle from './computedInputStyle.js';

let iframeStylesApplied = false;

export function forceAuthorizeIframeStyle(selector) {
  if (typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '100%';
      iframe.style.minWidth = '100%';
      iframe.style.height = '100%';
      iframe.style.minHeight = '100%';
      iframe.style.boxSizing = 'border-box';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      if (container) {
        container.style.width = '100%';
        container.style.minWidth = '100%';
        if (
          typeof window !== 'undefined' &&
          window.getComputedStyle(container).position === 'static'
        ) {
          container.style.position = 'relative';
        }
      }
      console.log(`[Smoothr AuthorizeNet] Forced iframe styles for ${selector}`);
      clearInterval(interval);
    } else if (++attempts >= 20) {
      clearInterval(interval);
    }
  }, 100);
}

export function applyAcceptIframeStyles() {
  if (iframeStylesApplied || typeof document === 'undefined') return;
  const selectors = [
    '[data-smoothr-card-number]',
    '[data-smoothr-card-expiry]',
    '[data-smoothr-card-cvc]'
  ];
  selectors.forEach(forceAuthorizeIframeStyle);
  iframeStylesApplied = true;
}

export function initAuthorizeStyles() {
  if (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    !document.querySelector('#smoothr-card-styles') // Reuse ID or change if needed
  ) {
    const style = document.createElement('style');
    style.id = 'smoothr-card-styles';
    style.textContent =
      '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:block;position:relative;}\niframe[data-accept-id]{display:block!important;}';
    document.head.appendChild(style);
  }
}

export function getFonts() {
  const sourceEl = document.querySelector('[data-smoothr-email]') || document.querySelector('[data-smoothr-card-number]');
  let fonts = [];
  if (sourceEl) {
    const cs = window.getComputedStyle(sourceEl);
    const fontFamily = cs.fontFamily.split(',')[0].trim().replace(/"/g, '');
    const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    console.log('[AuthorizeNet] Loading Google Font:', googleFontUrl);
    fonts = [{ cssSrc: googleFontUrl }];
  }
  return fonts;
}

export function elementStyleFromContainer(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return {};
  const cs = window.getComputedStyle(el);
  const style = {
    fontSize: cs.fontSize,
    color: cs.color,
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    height: cs.height, // To match container height
    bgColor: cs.backgroundColor,
  };

  // Pull placeholder styles from the email input
  const emailEl = document.querySelector('[data-smoothr-email]');
  let placeholderColor = '#aab7c4';
  let placeholderFontWeight = cs.fontWeight;
  if (emailEl) {
    const placeholderCs = window.getComputedStyle(emailEl, '::placeholder');
    placeholderColor = placeholderCs.color || '#aab7c4';
    placeholderFontWeight = placeholderCs.fontWeight || cs.fontWeight;
  }

  style.placeholderColor = placeholderColor;

  console.log('[AuthorizeNet] element style from container', style);
  return style;
}

export function getAuthorizeNetStyles(num, exp, cvc) {
  const numStyle = elementStyleFromContainer(num);
  const expStyle = elementStyleFromContainer(exp);
  const cvcStyle = elementStyleFromContainer(cvc);

  // Combine into one style object for Authorize.Net API (take from num as primary, average if needed)
  const combinedStyle = {
    bgColor: numStyle.bgColor,
    fontFamily: numStyle.fontFamily,
    fontSize: numStyle.fontSize,
    fontWeight: numStyle.fontWeight,
    color: numStyle.color,
    placeholderColor: numStyle.placeholderColor,
    height: numStyle.height, // Use number height for all, or adjust per field if API allows per-field
  };

  console.log('[Authorize.Net] combined style', combinedStyle);

  return JSON.stringify(combinedStyle); // Return stringified for settingValue in API
}