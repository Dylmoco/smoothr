import { describe, it, expect, beforeEach, vi } from 'vitest';

const getSessionMock = vi.fn();

vi.mock('../../../supabase/browserClient.js', () => ({
  default: { auth: { getSession: getSessionMock }, supabaseUrl: 'https://supabase.test' }
}));

vi.mock('../../features/config/globalConfig.js', () => ({
  getConfig: () => ({ storeId: 'store-1' })
}));

describe('credential helper', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  });

  it('sends anonymous headers for guest session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ publishable_key: 'pk' }) });
    global.fetch = fetchMock;

    const { getGatewayCredential } = await import('../../core/credentials.js');
    await getGatewayCredential('stripe');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://supabase.test/functions/v1/get_gateway_credentials');
    expect(opts.headers).toEqual({
      'Content-Type': 'application/json',
      apikey: 'anon',
      Authorization: 'Bearer anon'
    });
    expect(opts.body).toBe(JSON.stringify({ store_id: 'store-1', gateway: 'stripe' }));
  });

  it('includes bearer token when session exists', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ publishable_key: 'pk' }) });
    global.fetch = fetchMock;

    const { getGatewayCredential } = await import('../../core/credentials.js');
    await getGatewayCredential('stripe');

    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer token-123');
  });

  it('returns empty credentials on non-200 response', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'fail' })
    });
    global.fetch = fetchMock;

    const { getGatewayCredential } = await import('../../core/credentials.js');
    const res = await getGatewayCredential('stripe');
    expect(res).toEqual({
      publishable_key: null,
      tokenization_key: null,
      hosted_fields: null,
      active: false
    });
  });

  it.each([
    ['stripe', { publishable_key: null }, '[Smoothr] Missing publishable_key in credentials response'],
    ['nmi', { tokenization_key: null }, '[Smoothr] Missing tokenization_key in credentials response'],
    [
      'authorizeNet',
      { hosted_fields: {} },
      '[Smoothr] Missing client key in credentials response'
    ]
  ])('logs missing key only once for %s', async (gateway, response, message) => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });
    global.fetch = fetchMock;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getGatewayCredential } = await import('../../core/credentials.js');
    await getGatewayCredential(gateway);
    await getGatewayCredential(gateway);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(message);
  });
});
