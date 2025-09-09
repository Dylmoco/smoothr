import { describe, it, expect, vi } from 'vitest';

async function run(domains: { live_domain: string | null; store_domain: string | null }) {
  vi.resetModules();
  const supabaseAdmin = {
    from(table: string) {
      if (table === 'customers')
        return { upsert: vi.fn().mockResolvedValue({}) } as any;
      if (table === 'stores')
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: domains }),
                } as any;
              },
            } as any;
          },
        } as any;
      return {} as any;
    },
  } as any;
  const supabaseAnonServer = {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1', email: 'u@example.com', user_metadata: {}, app_metadata: {} } }, error: null }),
    },
  } as any;
  vi.doMock('../lib/supabaseAdmin.ts', () => ({
    getSupabaseAdmin: () => supabaseAdmin,
    getSupabaseAnonServer: () => supabaseAnonServer,
  }));
  const { default: handler } = await import('../pages/api/auth/session-sync.ts');
    const req: any = {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://example.com' },
      body: 'store_id=s1&access_token=token',
    };
  const res: any = {
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.data = data;
      return this;
    },
    end() {
      this.ended = true;
    },
  };
  await handler(req, res);
  return res;
}

describe('session-sync form redirect', () => {
  it('redirects to live domain origin', async () => {
    const res = await run({ live_domain: 'https://shop.example', store_domain: 'https://store.example' });
    expect(res.statusCode).toBe(303);
    expect(res.headers.Location).toBe('https://shop.example');
  });
  it('falls back to store domain', async () => {
    const res = await run({ live_domain: null, store_domain: 'https://store.example' });
    expect(res.headers.Location).toBe('https://store.example');
  });
  it('defaults to / when no domains set', async () => {
    const res = await run({ live_domain: null, store_domain: null });
    expect(res.headers.Location).toBe('/');
  });
});

describe('session-sync CORS', () => {
  it('responds to preflight', async () => {
    vi.resetModules();
    const { default: handler } = await import('../pages/api/auth/session-sync.ts');
    const req: any = { method: 'OPTIONS', headers: {} };
    const res: any = {
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) {
        this.headers[k] = v;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      end() {
        this.ended = true;
      },
    };
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    expect(res.headers['Access-Control-Allow-Headers']).toBe('authorization, content-type');
  });

  it('includes CORS headers on POST', async () => {
    const res = await run({ live_domain: null, store_domain: null });
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    expect(res.headers['Access-Control-Allow-Headers']).toBe('authorization, content-type');
  });
});
