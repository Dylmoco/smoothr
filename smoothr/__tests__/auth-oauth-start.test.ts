import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('oauth-start api', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proj.supabase.co';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://smoothr.vercel.app';
    process.env.SESSION_SYNC_ALLOWED_ORIGINS = 'foo.example';
  });

  it('sets cookie and redirects to supabase', async () => {
    const supabaseAdmin = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: {} }),
                } as any;
              },
            } as any;
          },
        } as any;
      },
    } as any;
    vi.doMock('../lib/supabaseAdmin.ts', () => ({
      getSupabaseAdmin: () => supabaseAdmin,
    }));
    const { default: handler } = await import('../pages/api/auth/oauth-start.ts');
    const req: any = {
      method: 'GET',
      headers: {},
      query: { provider: 'google', store_id: 'store_test', orig: 'https://foo.example' },
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
      end() {
        this.ended = true;
      },
      json(d: any) {
        this.data = d;
        return this;
      },
    };
    await handler(req, res);
    expect(res.statusCode).toBe(302);
    expect(res.headers['Set-Cookie']).toMatch(/smoothr_oauth_ctx=/);
    expect(res.headers.Location).toBe(
      'https://proj.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fsmoothr.vercel.app%2Fauth%2Fcallback'
    );
  });
});
