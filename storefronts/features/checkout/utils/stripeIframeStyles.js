export default function forceStripeIframeStyle(selector, element = null) {
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

        applyFocusStyles(iframe, container, element);

      }
      console.log(`[Smoothr Stripe] Forced iframe styles for ${selector}`);
      clearInterval(interval);
    } else if (++attempts >= 20) {
      clearInterval(interval);
    }
  }, 100);
}

export function initStripeStyles() {
  if (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    !document.querySelector('#smoothr-card-styles')
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
    console.log('[Stripe] Loading Google Font:', googleFontUrl);
    fonts = [{ cssSrc: googleFontUrl }];
  }
  return fonts;
}

export function elementStyleFromContainer(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return {};
  const cs = window.getComputedStyle(el);
  const style = {
    base: {
      fontSize: cs.fontSize,
      color: cs.color,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      lineHeight: cs.height // Set to container height to force full input height
    }
  };

  // Pull placeholder styles from the email input
  const emailEl = document.querySelector('[data-smoothr-email]');
  if (emailEl) {
    const placeholderCs = window.getComputedStyle(emailEl, '::placeholder');
    style.base['::placeholder'] = {
      color: placeholderCs.color || '#aab7c4', // Fallback to Stripe default
      fontWeight: placeholderCs.fontWeight || cs.fontWeight
    };
  } else {
    style.base['::placeholder'] = {
      color: '#aab7c4', // Default if no email input found
      fontWeight: cs.fontWeight
    };
  }

  console.log('[Stripe] element style from container', style);
  return style;
}


function applyFocusStyles(iframe, container, element) {

  const emailEl = document.querySelector('[data-smoothr-email]');
  if (!emailEl || !container || typeof window.getComputedStyle !== 'function') return;

  let focusBorder = '';
  let focusBoxShadow = '';
  let focusRadius = '';
  let blurBorder = '';
  let blurBoxShadow = '';
  let blurRadius = '';

  const previous = document.activeElement;
  const blurCs = window.getComputedStyle(emailEl);
  blurBorder = blurCs.border;
  blurBoxShadow = blurCs.boxShadow;
  blurRadius = blurCs.borderRadius;

  try {
    emailEl.focus();
    const cs = window.getComputedStyle(emailEl);
    focusBorder = cs.border;
    focusBoxShadow = cs.boxShadow;
    focusRadius = cs.borderRadius;
  } catch (_) {
    // noop
  } finally {
    previous?.focus?.();
    if (previous !== emailEl) emailEl.blur();
  }


  const onFocus = () => {
    container.style.border = focusBorder || blurBorder || '1px solid transparent';
    container.style.boxShadow = focusBoxShadow || blurBoxShadow || 'none';
    container.style.borderRadius = focusRadius || blurRadius || '';
  };

  const onBlur = () => {
    container.style.border = blurBorder || 'none';
    container.style.boxShadow = blurBoxShadow || 'none';
    container.style.borderRadius = blurRadius || '';
  };

  if (element && typeof element.on === 'function') {
    element.on('focus', onFocus);
    element.on('blur', onBlur);
  } else {
    iframe.addEventListener('focus', onFocus);
    iframe.addEventListener('blur', onBlur);
  }

}
