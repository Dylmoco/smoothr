import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { __setSupabaseReadyForTests } from '../../smoothr-sdk.mjs';

const invokeMock = vi.fn();
const ensureMock = vi.fn();

vi.mock('../../../supabase/client/browserClient.js', () => ({
  ensureSupabaseSessionAuth: ensureMock,
}));

vi.mock('../../features/config/globalConfig.js', () => ({
  getConfig: () => ({ storeId: 'store-1' })
}));

describe('credential helper', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    ensureMock.mockReset();
    __setSupabaseReadyForTests({ functions: { invoke: invokeMock } });
  });

  afterEach(() => {
    __setSupabaseReadyForTests(null);
  });

  it('invokes edge function with store id and gateway', async () => {
    invokeMock.mockResolvedValue({
      data: {
        publishable_key: 'pk',
        tokenization_key: 'tok',
        api_login_id: 'api'
      },
      error: null
    });

    const { getGatewayCredential } = await import('../../core/credentials.js');
    const res = await getGatewayCredential('stripe');

    expect(invokeMock).toHaveBeenCalledWith('get_gateway_credentials', {
      body: { store_id: 'store-1', gateway: 'stripe' }
    });
    expect(res).toEqual({
      publishable_key: 'pk',
      tokenization_key: 'tok',
      api_login_id: 'api'
    });
  });

  it('returns empty credentials on error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('fail') });

    const { getGatewayCredential } = await import('../../core/credentials.js');
    const res = await getGatewayCredential('stripe');

    expect(res).toEqual({
      publishable_key: null,
      tokenization_key: null,
      api_login_id: null
    });
  });
});
