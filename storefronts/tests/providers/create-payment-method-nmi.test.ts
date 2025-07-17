import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let createPaymentMethod: any;

function setupDom() {
  document.body.innerHTML = '';
  const num = document.createElement('div');
  num.setAttribute('data-smoothr-card-number', '');
  const numInput = document.createElement('input');
  numInput.setAttribute('data-collect', 'cardNumber');
  num.appendChild(numInput);

  const exp = document.createElement('div');
  exp.setAttribute('data-smoothr-card-expiry', '');
  exp.setAttribute('data-tokenization-key', 'tok_key');
  const expVisible = document.createElement('input');
  expVisible.setAttribute('data-smoothr-expiry-visible', '');
  expVisible.value = '12/34';
  exp.appendChild(expVisible);
  const expMonth = document.createElement('input');
  expMonth.setAttribute('data-collect', 'expMonth');
  exp.appendChild(expMonth);
  const expYear = document.createElement('input');
  expYear.setAttribute('data-collect', 'expYear');
  exp.appendChild(expYear);

  const cvc = document.createElement('div');
  cvc.setAttribute('data-smoothr-card-cvc', '');
  const cvcInput = document.createElement('input');
  cvcInput.setAttribute('data-collect', 'cvv');
  cvc.appendChild(cvcInput);

  document.body.appendChild(num);
  document.body.appendChild(exp);
  document.body.appendChild(cvc);
}

beforeEach(async () => {
  vi.resetModules();
  setupDom();
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'loading'
  });
  const addSpy = vi.spyOn(document, 'addEventListener').mockImplementation(() => {});
  window.SMOOTHR_CONFIG = { debug: true } as any;
  window.CollectJS = { tokenize: vi.fn() } as any;
  const mod = await import('../../checkout/gateways/nmi.js');
  createPaymentMethod = mod.createPaymentMethod;
  addSpy.mockRestore();
});

afterEach(() => {
  delete (window as any).CollectJS;
  delete (window as any).SMOOTHR_CONFIG;
  document.body.innerHTML = '';
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: 'complete'
  });
});

describe('createPaymentMethod nmi', () => {
  it('returns stubbed result regardless of CollectJS response', async () => {
    const res = await createPaymentMethod();
    expect(res).toEqual({
      error: { message: 'use CollectJS callback' },
      payment_method: null
    });
    expect((window.CollectJS.tokenize as any)).not.toHaveBeenCalled();
  });

  it('ignores CollectJS errors and returns stubbed result', async () => {
    (window.CollectJS.tokenize as any).mockImplementation((_d, cb) => cb({ error: 'bad card' }));
    const res = await createPaymentMethod();
    expect(res).toEqual({
      error: { message: 'use CollectJS callback' },
      payment_method: null
    });
    expect((window.CollectJS.tokenize as any)).not.toHaveBeenCalled();
  });

  it('handles missing tokenize function', async () => {
    delete (window.CollectJS as any).tokenize;
    const res = await createPaymentMethod();
    expect(res).toEqual({
      error: { message: 'use CollectJS callback' },
      payment_method: null
    });
  });
});
