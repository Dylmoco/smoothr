import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDomStub } from '../utils/dom-stub';

let loadScriptMock;
let stripeCtor;
let elementsCreate;

vi.mock('../../utils/loadScriptOnce.js', () => ({
  default: (...args) => loadScriptMock(...args)
}));

vi.mock('../../features/checkout/utils/stripeIframeStyles.js', () => ({
  default: vi.fn(),
  initStripeStyles: vi.fn(),
  getFonts: vi.fn(() => []),
  elementStyleFromContainer: vi.fn(() => ({}))
}));

vi.mock('../../core/credentials.js', () => ({
  getGatewayCredential: vi.fn(async () => ({ publishable_key: 'pk_test' }))
}));

describe('stripe gateway singleton', () => {
    let realDocument;
    beforeEach(() => {
      vi.resetModules();
      loadScriptMock = vi.fn(() => Promise.resolve());
      elementsCreate = vi.fn(() => ({ mount: vi.fn() }));
      const stripeInstance = { elements: vi.fn(() => ({ create: elementsCreate })) };
      stripeCtor = vi.fn(() => stripeInstance);
      global.window = {
        SMOOTHR_CONFIG: { storeId: 'store-1', active_payment_gateway: 'stripe' },
        location: { search: '' }
      };
      realDocument = global.document;
      global.document = createDomStub({
        querySelector: vi.fn(sel => {
          const el = { getBoundingClientRect: () => ({ width: 20 }), offsetParent: {}, dataset: {} };
          const map = {
            '[data-smoothr-card-number]': el,
            '[data-smoothr-card-expiry]': el,
            '[data-smoothr-card-cvc]': el,
            '#smoothr-checkout-theme': null
          };
          return map[sel] || null;
        }),
        activeElement: null,
        addEventListener: vi.fn()
      });
      global.Stripe = stripeCtor;
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it('only loads Stripe and script once when mounted twice', async () => {
    const { mountCheckout } = await import('../../features/checkout/gateways/stripeGateway.js');
    await mountCheckout();
    await mountCheckout();
    expect(stripeCtor).toHaveBeenCalledTimes(1);
    expect(loadScriptMock).toHaveBeenCalledTimes(1);
  });
});
