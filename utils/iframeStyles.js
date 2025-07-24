export default function forceStripeIframeStyle(selector, attempts = 20, interval = 100) {
  if (typeof document === 'undefined') return;
  let count = 0;
  const timer = setInterval(() => {
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe && container) {
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      let height = container.offsetHeight;
      if (height < 5) {
        const scroll = container.scrollHeight;
        if (scroll > height) height = scroll;
        if (height < 5) {
          const stored = parseFloat(container.style.minHeight);
          if (!Number.isNaN(stored) && stored > 0) height = stored;
        }
      }
      iframe.style.height = height + 'px';
      iframe.style.border = 'none';
      iframe.style.background = 'transparent';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'flex-start';
      container.style.width = '100%';
      container.style.minWidth = '100%';
      if (window.getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      clearInterval(timer);
    } else if (++count >= attempts) {
      clearInterval(timer);
    }
  }, interval);
}
