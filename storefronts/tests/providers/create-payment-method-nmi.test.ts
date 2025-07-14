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
  window.SMOOTHR_CONFIG = { debug: true } as any;
  window.CollectJS = { tokenize: vi.fn(), startTokenization: vi.fn() } as any;
  const mod = await import('../../checkout/gateways/nmi.js');
  createPaymentMethod = mod.createPaymentMethod;
});

afterEach(() => {
  delete (window as any).CollectJS;
  delete (window as any).SMOOTHR_CONFIG;
  document.body.innerHTML = '';
});

describe('createPaymentMethod nmi', () => {
  it('resolves token on success', async () => {
    const payment_token = 'tok_123';
    (window.CollectJS.tokenize as any).mockImplementation((_d, cb) => cb({ token: payment_token }));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await createPaymentMethod();
    expect(res).toEqual({ error: null, payment_method: { payment_token } });
    expect(logSpy).toHaveBeenCalled();
    expect((window.CollectJS.startTokenization as any)).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('returns error object on failure', async () => {
    (window.CollectJS.tokenize as any).mockImplementation((_d, cb) => cb({ error: 'bad card' }));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await createPaymentMethod();
    expect(res).toEqual({ error: { message: 'bad card' }, payment_method: null });
    expect(logSpy).toHaveBeenCalled();
    expect((window.CollectJS.startTokenization as any)).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('handles missing startTokenization function', async () => {
    delete (window.CollectJS as any).startTokenization;
    const res = await createPaymentMethod();
    expect(res.error?.message).toBe('Tokenize not available');
  });
});
