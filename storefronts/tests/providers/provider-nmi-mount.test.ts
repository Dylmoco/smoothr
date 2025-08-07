import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mountNMI: any;
let ready: any;
let getCredMock: any;
let appendChildSpy: any;
let getComputedStyleSpy: any;
let scriptPromise: Promise<any>;
let resolveScript: any;
let consoleErrorSpy: any;
let mountCallback: Function | null = null;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  getComputedStyleSpy = vi
    .spyOn(window, 'getComputedStyle')
    .mockReturnValue({
      fontFamily: 'Arial, sans-serif',
      fontWeight: '400',
      color: '#000',
      fontSize: '16px',
      fontStyle: 'normal',
      letterSpacing: '0px',
      lineHeight: 'normal',
      textAlign: 'left',
      opacity: '1'
    } as any);
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  const wrapper = document.createElement('div');
  ['card-number', 'card-expiry', 'card-cvc', 'bill-postal'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    if (attr === 'card-expiry') {
      const input = document.createElement('input');
      div.appendChild(input);
    }
    wrapper.appendChild(div);
  });
  document.body.appendChild(wrapper);

  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'loading'
  });
  vi.spyOn(document, 'addEventListener').mockImplementation((evt, cb) => {
    if (evt === 'DOMContentLoaded') mountCallback = cb;
  });

  scriptPromise = new Promise(r => (resolveScript = r));

  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(el => {
    const tag = (el as HTMLElement).tagName;
    if (tag === 'SCRIPT') {
      window.CollectJS = { configure: vi.fn(), tokenize: vi.fn() } as any;
      setTimeout(() => {
        el.dispatchEvent(new Event('load'));
        resolveScript(el);
      });
      return el;
    }
    if (tag === 'LINK') {
      return el;
    }
    return HTMLElement.prototype.appendChild.call(document.head, el);
  });

  getCredMock = vi.fn(async () => ({ tokenization_key: 'tok_key' }));

  vi.mock('../../features/checkout/getPublicCredential.js', () => ({
    getPublicCredential: getCredMock
  }));

  window.SMOOTHR_CONFIG = { storeId: 'store-1', active_payment_gateway: 'nmi' } as any;

  const mod = await import('../../features/checkout/gateways/nmiGateway.js');
  mountNMI = mod.mountNMI;
  ready = mod.ready;
});

afterEach(() => {
  vi.useRealTimers();
  appendChildSpy?.mockRestore();
  getComputedStyleSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
  window.CollectJS = undefined as any;
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'complete'
  });
  (document.addEventListener as any).mockRestore?.();
  mountCallback = null;
});

describe('mountNMI', () => {
  async function triggerMount() {
    const p = mountCallback ? mountCallback() : mountNMI();
    await vi.runAllTimersAsync();
    await scriptPromise;
    await vi.runAllTimersAsync();
    return p;
  }

  it('loads tokenization key and injects script', { timeout: 20000 }, async () => {
    await triggerMount();
    await vi.runAllTimersAsync();
    expect(getCredMock).toHaveBeenCalledWith('store-1', 'nmi', 'nmi');
    const script = await scriptPromise;
    expect(script.getAttribute('data-tokenization-key')).toBe('tok_key');
  });

  it('reports ready when CollectJS is configured', { timeout: 20000 }, async () => {
    await triggerMount();
    await expect(ready()).resolves.toBeUndefined();
    expect(window.CollectJS.configure).toHaveBeenCalled();
  });

  it('rejects and logs error if CollectJS fails to load', { timeout: 20000 }, async () => {
    window.SMOOTHR_CONFIG.debug = true as any;
    appendChildSpy.mockImplementation(el => {
      const tag = (el as HTMLElement).tagName;
      if (tag === 'SCRIPT') {
        setTimeout(() => {
          el.dispatchEvent(new Event('load'));
          resolveScript(el);
        });
        return el;
      }
      if (tag === 'LINK') {
        return el;
      }
      return HTMLElement.prototype.appendChild.call(document.head, el);
    });

    const readyPromise = mountNMI();
    const expectation = expect(readyPromise).rejects.toThrow('CollectJS failed to load');
    await vi.runAllTimersAsync();
    await scriptPromise;
    await vi.advanceTimersByTimeAsync(15000);
    await expectation;
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
