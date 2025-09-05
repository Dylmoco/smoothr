import { describe, it, expect, vi, beforeEach } from 'vitest';

let handleAuthCallback: any;

describe('oauth callback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('posts strict message and closes in popup mode', async () => {
    const postMessage = vi.fn();
    const close = vi.fn();
    (global as any).window = {
      location: { hash: '#access_token=tok', pathname: '/auth/callback', search: '', replace: vi.fn() },
      history: { replaceState: vi.fn() },
      document: {
        cookie: `smoothr_oauth_ctx=${encodeURIComponent(JSON.stringify({ store_id: 'store_test', orig: 'https://foo.example' }))}`,
        documentElement: { style: {} },
        createElement: vi.fn(),
        body: { appendChild: vi.fn() }
      },
      opener: { postMessage },
      close,
    } as any;
    ({ handleAuthCallback } = await import('../pages/auth/callback.tsx'));
    const result = handleAuthCallback(window);
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'smoothr:auth', ok: true, access_token: 'tok', store_id: 'store_test' },
      'https://foo.example'
    );
    expect(close).toHaveBeenCalled();
    expect(window.document.documentElement.style.visibility).toBe('hidden');
    expect(result.ok).toBe(true);
  });

  it('closes without message when origin missing', async () => {
    const postMessage = vi.fn();
    const close = vi.fn();
    (global as any).window = {
      location: { hash: '#access_token=tok', pathname: '/auth/callback', search: '', replace: vi.fn() },
      history: { replaceState: vi.fn() },
      document: {
        cookie: `smoothr_oauth_ctx=${encodeURIComponent(JSON.stringify({ store_id: 'store_test' }))}`,
        documentElement: { style: {} },
        createElement: vi.fn(),
        body: { appendChild: vi.fn() }
      },
      opener: { postMessage },
      close,
    } as any;
    ({ handleAuthCallback } = await import('../pages/auth/callback.tsx'));
    const result = handleAuthCallback(window);
    expect(postMessage).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(window.document.documentElement.style.visibility).toBe('hidden');
    expect(result.ok).toBe(false);
  });

  it('submits hidden form in redirect mode', async () => {
    const formChildren: any[] = [];
    const formSubmit = vi.fn();
    const form = { method: '', action: '', style: {}, appendChild: (c: any) => formChildren.push(c), submit: formSubmit } as any;
    const createElement = vi.fn((tag: string) => {
      if (tag === 'form') return form;
      return { type: '', name: '', value: '' } as any;
    });
    (global as any).window = {
      location: { hash: '#access_token=tok', pathname: '/auth/callback', search: '', replace: vi.fn() },
      history: { replaceState: vi.fn() },
      document: {
        cookie: `smoothr_oauth_ctx=${encodeURIComponent(JSON.stringify({ store_id: 'store_test', orig: 'https://foo.example' }))}`,
        documentElement: { style: {} },
        createElement,
        body: { appendChild: vi.fn() }
      },
    } as any;
    ({ handleAuthCallback } = await import('../pages/auth/callback.tsx'));
    const result = handleAuthCallback(window);
    const store = formChildren.find((c: any) => c.name === 'store_id');
    const token = formChildren.find((c: any) => c.name === 'access_token');
    expect(store.value).toBe('store_test');
    expect(token.value).toBe('tok');
    expect(form.action).toBe('/api/auth/session-sync');
    expect(formSubmit).toHaveBeenCalled();
    expect(window.document.documentElement.style.visibility).toBe('hidden');
    expect(result.ok).toBe(true);
  });
});

