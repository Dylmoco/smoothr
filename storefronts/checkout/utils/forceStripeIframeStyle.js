export default function forceStripeIframeStyle(selector) {
  if (typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe && container) {
      iframe.style.width = '100%';
      iframe.style.minWidth = '100%';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';

      // Measure the real box height (includes padding)
      const fullHeight = container.scrollHeight;
      // Enforce container height
      container.style.height = `${fullHeight}px`;
      container.style.minHeight = `${fullHeight}px`;
      // Make the iframe fill it
      iframe.style.height = '100%';

      container.style.width = '100%';
      container.style.minWidth = '100%';
      if (
        typeof window !== 'undefined' &&
        window.getComputedStyle(container).position === 'static'
      ) {
        container.style.position = 'relative';
      }
      if (window.SMOOTHR_CONFIG?.debug) {
        console.log(`[Smoothr Stripe] Forced iframe styles for ${selector}`);
      }
      clearInterval(interval);
    } else if (++attempts >= 20) {
      clearInterval(interval);
    }
  }, 100);
}
