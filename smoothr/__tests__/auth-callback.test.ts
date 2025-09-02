import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

let handleAuthCallback: any;

describe('oauth callback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('sets session and posts to session-sync', async () => {
    const setSession = vi.fn().mockResolvedValue({ data: { session: { user: { user_metadata: { store_id: 'store_test' } } } } });
    vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { setSession } }) }));
    const formChildren: any[] = [];
    const formSubmit = vi.fn();
    const form = { method: '', action: '', appendChild: (c: any) => formChildren.push(c), submit: formSubmit } as any;
    const createElement = vi.fn((tag: string) => {
      if (tag === 'form') return form;
      return { type: '', name: '', value: '' } as any;
    });
    (global as any).window = {
      location: { hash: '#access_token=tok&refresh_token=ref', pathname: '/auth/callback', search: '' },
      history: { replaceState: vi.fn() },
      document: { createElement, body: { appendChild: vi.fn() }, cookie: `smoothr_oauth_ctx=${encodeURIComponent(JSON.stringify({ store_id: 'store_test', orig: 'https://foo.example' }))}` },
      SMOOTHR_CONFIG: {}
    };
    ({ handleAuthCallback } = await import('../pages/auth/callback.tsx'));
    await handleAuthCallback(window);
    expect(setSession).toHaveBeenCalledWith({ access_token: 'tok', refresh_token: 'ref' });
    expect(window.history.replaceState).toHaveBeenCalled();
    expect(form.action).toBe('/api/auth/session-sync');
    const store = formChildren.find((f: any) => f.name === 'store_id');
    const token = formChildren.find((f: any) => f.name === 'access_token');
    expect(store.value).toBe('store_test');
    expect(token.value).toBe('tok');
    expect(formSubmit).toHaveBeenCalled();
  });

  it('renders error when tokens missing', async () => {
    vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { setSession: vi.fn() } }) }));
    (global as any).window = {
      location: { hash: '', pathname: '/auth/callback', search: '' },
      history: { replaceState: vi.fn() },
      document: { createElement: vi.fn(), body: { appendChild: vi.fn() }, cookie: '' },
      SMOOTHR_CONFIG: {}
    };
    const mod = await import('../pages/auth/callback.tsx');
    const Page = mod.default;
    const root = document.createElement('div');
    document.body.appendChild(root);
    const { createRoot } = await import('react-dom/client');
    const { act } = await import('react-dom/test-utils');
    await act(() => {
      createRoot(root).render(React.createElement(Page));
    });
    expect(root.textContent).toContain('Something went wrong');
  });
});
