import { describe, it, expect, beforeEach, vi } from 'vitest';

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
  default: { createClient: createClientMock },
}));

import { getSupabaseClient } from '../../../supabase/client/browserClient.js';
import { __setSupabaseReadyForTests } from '../../smoothr-sdk.mjs';

describe('supabase browser client singleton', () => {
  beforeEach(() => {
    global.window = global.window || {};
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        setSession: vi.fn().mockResolvedValue({}),
        signInWithOAuth: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    };
    createClientMock.mockReturnValue(client);
    __setSupabaseReadyForTests(client);
    delete window.Smoothr.__supabase;
  });

  it('resolves same client across calls', async () => {
    const client1 = await getSupabaseClient();
    const client2 = await getSupabaseClient();
    expect(client1).toBe(client2);
  });
});

