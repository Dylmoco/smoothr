import { describe, it, beforeEach, expect, vi } from 'vitest';

let mergeConfigMock;

describe('cart feature init', () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.il = {};
    mergeConfigMock = vi.fn();
    vi.doMock('../../features/cart/addToCart.js', () => ({ bindAddToCartButtons: vi.fn() }));
    vi.doMock('../../features/cart/renderCart.js', () => ({ renderCart: vi.fn(), bindRemoveFromCartButtons: vi.fn() }));
    let cfg = { debug: false };
    vi.doMock('../../features/config/globalConfig.js', () => ({
      mergeConfig: vi.fn(obj => { mergeConfigMock(obj); Object.assign(cfg, obj); }),
      getConfig: vi.fn(() => cfg)
    }));
    global.window = {};
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
  });

  it('initializes cart and merges config', async () => {
    const { init } = await import('../../features/cart/init.js');
    await init({ storeId: '1' });
    expect(mergeConfigMock).toHaveBeenCalled();
    expect(global.window.Smoothr.cart).toBeDefined();
  });
});

