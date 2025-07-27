let stylesApplied = false;  

export function forceAuthorizeInputStyle(selector) {  
  if (typeof document === 'undefined') return;  
  const container = document.querySelector(selector);  
  if (!container) return;  

  // Use MutationObserver to detect input addition  
  const observer = new MutationObserver((mutations) => {  
    for (const mutation of mutations) {  
      if (mutation.type === 'childList') {  
        const input = container.querySelector('input');  
        if (input) {  
          applyStylesToInput(container, input);  
          observer.disconnect();  
          return;  
        }  
      }  
    }  
  });  

  observer.observe(container, { childList: true, subtree: true });  

  // Fallback interval  
  let attempts = 0;  
  const interval = setInterval(() => {  
    const input = container?.querySelector('input');  
    if (input) {  
      applyStylesToInput(container, input);  
      clearInterval(interval);  
      observer.disconnect();  
    } else if (++attempts >= 20) {  
      clearInterval(interval);  
      observer.disconnect();  
    }  
  }, 100);  
}  

function applyStylesToInput(container, input) {  
  input.style.width = '100%';  
  input.style.minWidth = '100%';  
  input.style.height = '100%';  
  input.style.minHeight = '100%';  
  input.style.boxSizing = 'border-box';  
  input.style.display = 'block';  
  input.style.opacity = '1';  
  container.style.width = '100%';  
  container.style.minWidth = '100%';  
  container.style.padding = '0';  
  if (window.getComputedStyle(container).position === 'static') {  
    container.style.position = 'relative';  
  }  
  console.log(`[Smoothr AuthorizeNet] Forced input styles for ${container.getAttribute('data-smoothr-card-number') || container.getAttribute('data-smoothr-card-expiry') || container.getAttribute('data-smoothr-card-cvc')}`);  
}  

export function applyAcceptStyles() {  
  if (stylesApplied || typeof document === 'undefined') return;  
  const selectors = [  
    '[data-smoothr-card-number]',  
    '[data-smoothr-card-expiry]',  
    '[data-smoothr-card-cvc]'  
  ];  
  selectors.forEach(forceAuthorizeInputStyle);  
  stylesApplied = true;  
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
    .smoothr-accept-field {
      border: none;
    }
    .smoothr-accept-field::placeholder {
      color: ${placeholderColor};
      font-weight: ${placeholderFontWeight};
    }
    .smoothr-accept-field:focus {
      outline: none;
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
    padding: cs.padding,
    margin: '0',  
    width: '100%',  
    height: '100%',  
    boxSizing: 'border-box',  
    borderRadius: cs.borderRadius  
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

  // Copy classes from email input to card inputs for inherited styles  
  const emailEl = document.querySelector('[data-smoothr-email]');  
  if (emailEl) {  
    const emailClasses = emailEl.className.split(' ');  
    [numInput, expInput, cvcInput].forEach(input => {  
      if (input) {  
        emailClasses.forEach(cls => input.classList.add(cls));  
      }  
    });  
  }  

  console.log('[Authorize.Net] cardNumber style', numStyle);  
  console.log('[Authorize.Net] cardExpiry style', expStyle);  
  console.log('[Authorize.Net] cardCVC style', cvcStyle);  

  return { numStyle, expStyle, cvcStyle };  
}  