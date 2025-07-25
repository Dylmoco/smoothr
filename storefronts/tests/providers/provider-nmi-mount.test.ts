import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mountNMI: any;
let ready: any;
let getCredMock: any;
let appendChildSpy: any;
let getComputedStyleSpy: any;
let scriptPromise: Promise<any>;
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

  let resolveScript;
  scriptPromise = new Promise(r => (resolveScript = r));

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

  vi.mock('../../checkout/getPublicCredential.js', () => ({
    getPublicCredential: getCredMock
  }));

  window.SMOOTHR_CONFIG = { storeId: 'store-1', active_payment_gateway: 'nmi' } as any;

  const mod = await import('../../checkout/gateways/nmi.js');
  mountNMI = mod.mountNMI;
  ready = mod.ready;
});

afterEach(() => {
  appendChildSpy?.mockRestore();
  getComputedStyleSpy?.mockRestore();
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
    mountCallback?.();
    await vi.runAllTimersAsync();
    await scriptPromise;
    await vi.runAllTimersAsync();
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
    await vi.runAllTimersAsync();
    expect(ready()).toBe(true);
  });
});
