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

export function getAuthorizeNetStyles(num, exp, cvc) {
  const numStyle = computedInputStyle(num);
  const expStyle = computedInputStyle(exp);
  const cvcStyle = computedInputStyle(cvc);

  const numInput = num?.querySelector('input');
  const expInput = exp?.querySelector('input');
  const cvcInput = cvc?.querySelector('input');

  if (numInput) Object.assign(numInput.style, numStyle.input);
  if (expInput) Object.assign(expInput.style, expStyle.input);
  if (cvcInput) Object.assign(cvcInput.style, cvcStyle.input);

  console.log('[Authorize.Net] cardNumber style', numStyle);
  console.log('[Authorize.Net] cardExpiry style', expStyle);
  console.log('[Authorize.Net] cardCVC style', cvcStyle);

  return { numStyle, expStyle, cvcStyle };
}
