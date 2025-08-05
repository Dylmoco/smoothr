import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let styleSpy = vi.fn();

vi.mock('../../features/checkout/utils/authorizeNetIframeStyles.js', async () => {
  const actual = await vi.importActual('../../features/checkout/utils/authorizeNetIframeStyles.js');
  return {
    ...actual,
    forceAuthorizeInputStyle: (...args) => styleSpy(...args),
    applyAcceptStyles: () => {
      ['[data-smoothr-card-number]', '[data-smoothr-card-expiry]', '[data-smoothr-card-cvc]'].forEach(s => styleSpy(s));
    }
  };
});

vi.mock('../../features/supabaseClient.js', () => {
  const maybeSingle = vi.fn(async () => ({
    data: { settings: { client_key: 'client', api_login_id: 'id' } },
    error: null
  }));
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ select }));
  return { supabase: { from }, ensureSupabaseSessionAuth: vi.fn() };
});

let createPaymentMethod;
let mountCardFields;
let computedStyle;
let originalGetComputedStyle;

beforeEach(async () => {
  vi.resetModules();
  styleSpy = vi.fn();
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

  const email = document.createElement('input');
  email.setAttribute('data-smoothr-email', '');
  email.className = 'email-field';
  document.body.appendChild(email);

  const mod = await import('../../features/checkout/gateways/authorizeNet.js');
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
  it('injects inputs inheriting styles and classes', async () => {
    await mountCardFields();
    expect(window.Accept.configure).not.toHaveBeenCalled();
    const numInput = document.querySelector('[data-smoothr-card-number] input');
    const expInput = document.querySelector('[data-smoothr-card-expiry] input');
    const cvcInput = document.querySelector('[data-smoothr-card-cvc] input');

    [numInput, expInput, cvcInput].forEach(input => {
      expect(input).toBeTruthy();
      expect(input.classList.contains('smoothr-accept-field')).toBe(true);
      expect(input.classList.contains('email-field')).toBe(true);
      expect(input.style.fontSize).toBe('16px');
    });
  });

  it('forces iframe styles after mount', async () => {
    const p = mountCardFields();
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(500);
    await p;
    vi.useRealTimers();
    expect(styleSpy).toHaveBeenCalledWith('[data-smoothr-card-number]');
    expect(styleSpy).toHaveBeenCalledWith('[data-smoothr-card-expiry]');
    expect(styleSpy).toHaveBeenCalledWith('[data-smoothr-card-cvc]');
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
