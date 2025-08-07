import { getConfig } from '../features/config/globalConfig.js';

const scriptPromises = new Map();

export default function loadScriptOnce(src, opts = {}) {
  if (!src) return Promise.reject(new Error('Missing script URL'));
  const {
    attrs = {},
    timeout = 15000,
    retries = 1,
    retryDelay = 1000
  } = opts || {};
  if (scriptPromises.has(src)) return scriptPromises.get(src);

  const debug = typeof window !== 'undefined' && getConfig().debug;

  const attemptLoad = attempt =>
    new Promise((resolve, reject) => {
      let script = document.querySelector(`script[src="${src}"]`);

      if (script && script.getAttribute('data-loaded') === 'true') {
        Object.entries(attrs).forEach(([k, v]) => {
          if (v !== undefined) script.setAttribute(k, String(v));
        });
        resolve();
        return;
      }

      if (script) script.remove();

      script = document.createElement('script');
      script.src = src;
      script.async = true;
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== undefined) script.setAttribute(k, String(v));
      });
      document.head.appendChild(script);

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
        reject(e || new Error(`Failed to load script: ${src}`));
      };

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Script load timed out: ${src}`));
      }, timeout);
    }).catch(err => {
      if (attempt < retries) {
        if (debug) console.warn(`[Smoothr] Retry loading ${src} (${attempt + 1}/${retries + 1})`);
        return new Promise(res => setTimeout(res, retryDelay)).then(() =>
          attemptLoad(attempt + 1)
        );
      }
      if (debug) console.warn(`[Smoothr] Failed to load ${src}`);
      scriptPromises.delete(src);
      throw err;
    });

  const promise = attemptLoad(0);
  scriptPromises.set(src, promise);
  return promise;
}
