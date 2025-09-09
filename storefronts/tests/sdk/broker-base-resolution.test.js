import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
});

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.Smoothr;
});

describe('broker base resolution', () => {
  it('derives from data-config-url origin', async () => {
    const script = {
      id: 'smoothr-sdk',
      src: 'https://sdk.smoothr.io/smoothr-sdk.js',
      dataset: { configUrl: 'https://smoothr.vercel.app/api/config', storeId: 'store_test' }
    };
    const documentMock = {
      getElementById: id => (id === 'smoothr-sdk' ? script : null),
      currentScript: script,
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn()
    };
    global.window = { SMOOTHR_CONFIG: {}, document: documentMock, Smoothr: {}, smoothr: {} };
    global.document = documentMock;
    await import('../../smoothr-sdk.js');
    const { getBrokerBaseUrl } = await import('../../features/auth/init.js');
    expect(window.SMOOTHR_CONFIG.__brokerBase).toBe('https://smoothr.vercel.app');
    expect(getBrokerBaseUrl()).toBe('https://smoothr.vercel.app');
  });

  it('data-broker-origin overrides', async () => {
    const script = {
      id: 'smoothr-sdk',
      src: 'https://sdk.smoothr.io/smoothr-sdk.js',
      dataset: {
        configUrl: 'https://smoothr.vercel.app/api/config',
        brokerOrigin: 'https://broker.example.com',
        storeId: 'store_test'
      }
    };
    const documentMock = {
      getElementById: () => script,
      currentScript: script,
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn()
    };
    global.window = { SMOOTHR_CONFIG: {}, document: documentMock, Smoothr: {}, smoothr: {} };
    global.document = documentMock;
    await import('../../smoothr-sdk.js');
    const { getBrokerBaseUrl } = await import('../../features/auth/init.js');
    expect(window.SMOOTHR_CONFIG.__brokerBase).toBe('https://broker.example.com');
    expect(getBrokerBaseUrl()).toBe('https://broker.example.com');
  });

  it('falls back to script src origin and no supabase default', async () => {
    const script = {
      id: 'smoothr-sdk',
      src: 'https://cdn.example.com/sdk.js',
      dataset: { storeId: 'store_test' }
    };
    const documentMock = {
      getElementById: () => script,
      currentScript: script,
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn()
    };
    global.window = { SMOOTHR_CONFIG: {}, document: documentMock, Smoothr: {}, smoothr: {} };
    global.document = documentMock;
    await import('../../smoothr-sdk.js');
    const { getBrokerBaseUrl } = await import('../../features/auth/init.js');
    expect(window.SMOOTHR_CONFIG.__brokerBase).toBe('https://cdn.example.com');
    expect(getBrokerBaseUrl()).toBe('https://cdn.example.com');
    expect(window.SMOOTHR_CONFIG.__brokerBase).not.toMatch(/supabase\.co/);
  });
});
