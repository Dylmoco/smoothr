let iframeStylesApplied = false;  

export function forceAuthorizeIframeStyle(selector) {  
  if (typeof document === 'undefined') return;  
  const container = document.querySelector(selector);  
  if (!container) return;  

  // Use MutationObserver to detect iframe addition  
  const observer = new MutationObserver((mutations) => {  
    for (const mutation of mutations) {  
      if (mutation.type === 'childList') {  
        const iframe = container.querySelector('iframe');  
        if (iframe) {  
          applyStylesToIframe(container, iframe);  
          observer.disconnect(); // Stop observing once applied  
          return;  
        }  
      }  
    }  
  });  

  observer.observe(container, { childList: true, subtree: true });  

  // Fallback interval in case observer misses it  
  let attempts = 0;  
  const interval = setInterval(() => {  
    const iframe = container?.querySelector('iframe');  
    if (iframe) {  
      applyStylesToIframe(container, iframe);  
      clearInterval(interval);  
      observer.disconnect();  
    } else if (++attempts >= 20) {  
      clearInterval(interval);  
      observer.disconnect();  
    }  
  }, 100);  
}  

function applyStylesToIframe(container, iframe) {  
  iframe.style.width = '100%';  
  iframe.style.minWidth = '100%';  
  iframe.style.height = '100%';  
  iframe.style.minHeight = '100%';  
  iframe.style.boxSizing = 'border-box';  
  iframe.style.display = 'block';  
  iframe.style.opacity = '1';  
  container.style.width = '100%';  
  container.style.minWidth = '100%';  
  if (window.getComputedStyle(container).position === 'static') {  
    container.style.position = 'relative';  
  }  
  console.log(`[Smoothr AuthorizeNet] Forced iframe styles for ${container.getAttribute('data-smoothr-card-number') || container.getAttribute('data-smoothr-card-expiry') || container.getAttribute('data-smoothr-card-cvc')}`);  
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
    !document.querySelector('#smoothr-card-styles')  
  ) {  
    const style = document.createElement('style');  
    style.id = 'smoothr-card-styles';  
    style.textContent =  
      '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:block;position:relative;padding:0 !important;}\niframe[data-accept-id]{display:block!important;}';  
    document.head.appendChild(style);  
  }  

  // Add placeholder styles  
  const emailEl = document.querySelector('[data-smoothr-email]');  
  let placeholderColor = '#aab7c4';  
  let placeholderFontWeight = 'normal';  
  if (emailEl) {  
    const placeholderCs = window.getComputedStyle(emailEl, '::placeholder');  
    placeholderColor = placeholderCs.color || '#aab7c4';  
    placeholderFontWeight = placeholderCs.fontWeight || 'normal';  
  }  
  const placeholderStyle = document.createElement('style');  
  placeholderStyle.textContent = `  
    .smoothr-accept-field::placeholder {  
      color: ${placeholderColor};  
      font-weight: ${placeholderFontWeight};  
    }  
    .smoothr-accept-field:focus {  
      outline: none;  
      border: none;  
    }  
    [data-smoothr-card-number]:focus-within,  
    [data-smoothr-card-expiry]:focus-within,  
    [data-smoothr-card-cvc]:focus-within {  
      outline: 2px solid orange; /* Adjust color/thickness as needed */  
      border-radius: inherit;  
    }  
  `;  
  document.head.appendChild(placeholderStyle);  
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
    lineHeight: cs.lineHeight,  
    backgroundColor: cs.backgroundColor,  
    border: 'none',  
    padding: cs.padding,  
    margin: '0',  
    width: '100%',  
    height: '100%',  
    boxSizing: 'border-box'  
  };  

  console.log('[AuthorizeNet] element style from container', style);  
  return style;  
}  

export function getAuthorizeNetStyles(num, exp, cvc) {  
  const numStyle = elementStyleFromContainer(num);  
  const expStyle = elementStyleFromContainer(exp);  
  const cvcStyle = elementStyleFromContainer(cvc);  

  const numInput = num?.querySelector('input');  
  const expInput = exp?.querySelector('input');  
  const cvcInput = cvc?.querySelector('input');  

  if (numInput) Object.assign(numInput.style, numStyle);  
  if (expInput) Object.assign(expInput.style, expStyle);  
  if (cvcInput) Object.assign(cvcInput.style, cvcStyle);  

  console.log('[Authorize.Net] cardNumber style', numStyle);  
  console.log('[Authorize.Net] cardExpiry style', expStyle);  
  console.log('[Authorize.Net] cardCVC style', cvcStyle);  

  return { numStyle, expStyle, cvcStyle };  
}  