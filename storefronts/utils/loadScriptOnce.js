import { getConfig } from '../features/config/globalConfig.js';

const scriptPromises = new Map();

export default function loadScriptOnce(src, opts = {}) {
  if (!src) return Promise.reject(new Error('Missing script URL'));
  const { attrs = {}, timeout = 15000 } = opts || {};
  if (scriptPromises.has(src)) return scriptPromises.get(src);

  const debug = typeof window !== 'undefined' && getConfig().debug;

  const promise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${src}"]`);

    if (script && script.getAttribute('data-loaded') === 'true') {
      // ensure attributes are applied even if already loaded
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== undefined) script.setAttribute(k, String(v));
      });
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
      if (debug) console.warn(`[Smoothr] Failed to load ${src}`);
      scriptPromises.delete(src);
      reject(e || new Error(`Failed to load script: ${src}`));
    };

    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== undefined) script.setAttribute(k, String(v));
      });
      document.head.appendChild(script);
    } else {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== undefined) script.setAttribute(k, String(v));
      });
    }

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    timeoutId = setTimeout(() => {
      cleanup();
      if (debug) console.warn(`[Smoothr] Script load timed out ${src}`);
      scriptPromises.delete(src);
      reject(new Error(`Script load timed out: ${src}`));
    }, timeout);
  });

  scriptPromises.set(src, promise);
  return promise;
}
