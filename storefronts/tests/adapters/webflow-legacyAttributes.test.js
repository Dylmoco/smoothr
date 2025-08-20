import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../adapters/webflow/currencyDomAdapter.js', () => ({
  initCurrencyDom: vi.fn(),
}));

import { initAdapter } from '../../adapters/webflow.js';

describe('webflow adapter legacy attribute normalization', () => {
  let elements;

  beforeEach(() => {
    elements = {};
    const createEl = (legacyAttr, existing) => {
      const attrs = { [legacyAttr]: '' };
      if (existing !== undefined) attrs['data-smoothr'] = existing;
      return {
        attributes: attrs,
        getAttribute(attr) {
          return this.attributes[attr];
        },
        setAttribute(attr, val) {
          this.attributes[attr] = String(val);
        },
        hasAttribute(attr) {
          return attr in this.attributes;
        },
      };
    };

    elements.pay = createEl('data-smoothr-pay');
    elements.add = createEl('data-smoothr-add');
    elements.addExisting = createEl('data-smoothr-add', 'existing');
    elements.remove = createEl('data-smoothr-remove');
    elements.login = createEl('data-smoothr-login');
    elements.logout = createEl('data-smoothr-logout');
    elements.currency = createEl('data-smoothr-currency');
    elements.signup = createEl('data-smoothr-signup');
    elements.passwordReset = createEl('data-smoothr-password-reset');
    elements.passwordResetConfirm = createEl(
      'data-smoothr-password-reset-confirm'
    );

    const selectorMap = {
      '[data-smoothr-pay]': [elements.pay],
      '[data-smoothr-add]': [elements.add, elements.addExisting],
      '[data-smoothr-remove]': [elements.remove],
      '[data-smoothr-login]': [elements.login],
      '[data-smoothr-logout]': [elements.logout],
      '[data-smoothr-currency]': [elements.currency],
      '[data-smoothr-signup]': [elements.signup],
      '[data-smoothr-password-reset]': [elements.passwordReset],
      '[data-smoothr-password-reset-confirm]': [
        elements.passwordResetConfirm,
      ],
    };

    global.document = {
      readyState: 'complete',
      querySelectorAll: vi.fn((sel) => selectorMap[sel] || []),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete global.document;
  });

  it('normalizes legacy attributes on domReady', async () => {
    const { domReady } = initAdapter({});
    await domReady();

    expect(elements.pay.attributes['data-smoothr']).toBe('pay');
    expect(elements.add.attributes['data-smoothr']).toBe('add-to-cart');
    expect(elements.remove.attributes['data-smoothr']).toBe('remove-from-cart');
    expect(elements.login.attributes['data-smoothr']).toBe('login');
    expect(elements.logout.attributes['data-smoothr']).toBe('logout');
    expect(elements.currency.attributes['data-smoothr']).toBe('currency');
    expect(elements.signup.attributes['data-smoothr']).toBe('signup');
    expect(elements.passwordReset.attributes['data-smoothr']).toBe(
      'password-reset'
    );
    expect(
      elements.passwordResetConfirm.attributes['data-smoothr']
    ).toBe('password-reset-confirm');
    expect(elements.addExisting.attributes['data-smoothr']).toBe('existing');
  });
});

