export function initAdapter(config) {
  // Placeholder for future Webflow-specific setup using `config` if needed.
  return {
    domReady: () =>
      new Promise(resolve => {
        if (document.readyState !== 'loading') resolve();
        else document.addEventListener('DOMContentLoaded', resolve, { once: true });
      })
  };
}

