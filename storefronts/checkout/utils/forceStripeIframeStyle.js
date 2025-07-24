export default function forceStripeIframeStyle(selector) {
  if (typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe) {
      const cs = container ? window.getComputedStyle(container) : null;
      iframe.style.width = '100%';
      iframe.style.minWidth = '100%';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      if (cs) {
        iframe.style.height = cs.height || '100%';
        if (cs.minHeight && cs.minHeight !== '0px') iframe.style.minHeight = cs.minHeight;
        if (cs.maxHeight && cs.maxHeight !== 'none') iframe.style.maxHeight = cs.maxHeight;
      } else {
        iframe.style.height = '100%';
      }
      if (container) {
        container.style.width = '100%';
        container.style.minWidth = '100%';
        if (cs) {
          container.style.height = cs.height;
          if (cs.minHeight && cs.minHeight !== '0px') container.style.minHeight = cs.minHeight;
          if (cs.maxHeight && cs.maxHeight !== 'none') container.style.maxHeight = cs.maxHeight;
        }
        if (
          typeof window !== 'undefined' &&
          window.getComputedStyle(container).position === 'static'
        ) {
          container.style.position = 'relative';
        }
      }
      console.log(`[Smoothr Stripe] Forced iframe styles for ${selector}`);
      clearInterval(interval);
    } else if (++attempts >= 20) {
      clearInterval(interval);
    }
  }, 100);
}
