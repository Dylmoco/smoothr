import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../shared/supabase/serverClient', () => {
  
  const maybeSingle = vi.fn(async () => ({
    data: { settings: { client_key: 'client', api_login_id: 'id' } },
    error: null
  }));
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ select }));
  return { supabase: { from } };
});

let createPaymentMethod;
let mountCardFields;
let computedStyle;
let originalGetComputedStyle;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  window.SMOOTHR_CONFIG = { storeId: 'store-1', debug: true };

  ['card-number', 'card-expiry', 'card-cvc'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    document.body.appendChild(div);
  });

  const first = document.createElement('input');
  first.setAttribute('data-smoothr-bill-first-name', '');
  first.value = 'Jane';
  document.body.appendChild(first);

  const last = document.createElement('input');
  last.setAttribute('data-smoothr-bill-last-name', '');
  last.value = 'Doe';
  document.body.appendChild(last);

  const mod = await import('../../checkout/gateways/authorizeNet.js');
  createPaymentMethod = mod.createPaymentMethod;
  mountCardFields = mod.mountCardFields;

  window.Accept = { configure: vi.fn(), dispatchData: vi.fn() };

  const style = {
    fontSize: '16px',
    fontFamily: 'Arial',
    color: '#000000',
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '5px',
    borderRadius: '3px',
    width: '100px',
    height: '20px',
    lineHeight: '24px',
    letterSpacing: '1px',
    textAlign: 'left',
    fontWeight: '400',
    fontStyle: 'normal',
    boxSizing: 'border-box'
  };
  computedStyle = {
    input: { ...style },
    '::placeholder': { color: '#888888' }
  };
  originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = vi.fn((el, pseudo) => {
    if (pseudo === '::placeholder') return { color: '#888888' };
    return style;
  });
});

afterEach(() => {
  window.getComputedStyle = originalGetComputedStyle;
  delete window.Accept;
});

describe('authorizeNet mountCardFields', () => {
  it('configures Accept.js with computed styles', async () => {
    await mountCardFields();
    expect(window.Accept.configure).toHaveBeenCalled();
    const config = window.Accept.configure.mock.calls[0][0];
    expect(config.paymentFields.cardNumber.style).toEqual(computedStyle);
    expect(config.paymentFields.expiry.style).toEqual(computedStyle);
    expect(config.paymentFields.cvv.style).toEqual(computedStyle);
  });

  it('applies iframe styles using getComputedStyle after mount', async () => {
    vi.useFakeTimers();
    await mountCardFields();

    const width = '80px';
    const height = '40px';
    const boxSizing = 'border-box';
    window.getComputedStyle = vi.fn(() => {
      const style = { width, height, boxSizing };
      Object.defineProperty(style, 'getPropertyValue', {
        value: prop => style[prop],
        enumerable: false
      });
      Object.defineProperty(style, Symbol.iterator, {
        enumerable: false,
        value: function* () {
          for (const key of Object.keys(style)) yield key;
        }
      });
      return style;
    });

    ['cardNumber', 'expiry', 'cvv'].forEach(name => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('data-accept-id', '');
      iframe.name = name;
      document.body.appendChild(iframe);
    });

    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const frame = document.querySelector('iframe[data-accept-id][name=cardNumber]');
    expect(frame.style.width).toBe(width);
    expect(frame.style.height).toBe(height);
    expect(frame.style.boxSizing).toBe(boxSizing);
  });
});

describe('authorizeNet createPaymentMethod', () => {
  beforeEach(async () => {
    await mountCardFields();
    document.querySelector('[data-smoothr-card-number] input').value = '4111111111111111';
    document.querySelector('[data-smoothr-card-expiry] input').value = '12/29';
    document.querySelector('[data-smoothr-card-cvc] input').value = '123';
  });

  it('returns opaqueData on successful dispatch', async () => {
    const dataDescriptor = 'desc';
    const dataValue = 'val';
    window.Accept.dispatchData = vi.fn((sd, cb) => {
      cb({ opaqueData: { dataDescriptor, dataValue }, messages: { resultCode: 'Ok' } });
    });

    const res = await createPaymentMethod();

    expect(res).toEqual({ error: null, payment_method: { dataDescriptor, dataValue } });
  });
});
