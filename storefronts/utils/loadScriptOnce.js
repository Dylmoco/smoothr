export function loadScriptOnce(src, globalCheck) {
  if (globalCheck && window[globalCheck]) {
    return Promise.resolve(window[globalCheck]);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve(window[globalCheck]);
      } else {
        existing.addEventListener('load', () => resolve(window[globalCheck]));
        existing.addEventListener('error', reject);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve(window[globalCheck]);
    });

    script.addEventListener('error', reject);

    document.head.appendChild(script);
  });
}
