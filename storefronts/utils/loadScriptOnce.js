import { getConfig } from '../features/config/globalConfig.js';

const scriptPromises = new Map();

export default function loadScriptOnce(src) {
  if (!src) return Promise.reject(new Error('Missing script URL'));
  if (scriptPromises.has(src)) return scriptPromises.get(src);

  const debug = typeof window !== 'undefined' && getConfig().debug;
  const warn = (...args) => debug && console.warn('[Smoothr Script]', ...args);

  const promise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${src}"]`);

    if (script && script.getAttribute('data-loaded') === 'true') {
      resolve();
      return;
    }

    let timeoutId;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (script) {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      }
    };

    const onLoad = () => {
      cleanup();
      script.setAttribute('data-loaded', 'true');
      resolve();
    };

    const onError = e => {
      cleanup();
      warn('Failed to load script', src, e?.message || e);
      reject(e || new Error(`Failed to load script: ${src}`));
    };

    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    timeoutId = setTimeout(() => {
      cleanup();
      warn('Script load timed out', src);
      reject(new Error(`Script load timed out: ${src}`));
    }, 15000);
  });

  scriptPromises.set(src, promise);
  return promise;
}
