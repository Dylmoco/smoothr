import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../../lib/supabaseAdmin', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('../../../shared/auth/resolveRecoveryDestination', () => ({ resolveRecoveryDestination: vi.fn() }));

import RecoveryBridgePage, { getServerSideProps } from '../../pages/auth/recovery-bridge';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { resolveRecoveryDestination } from '../../../shared/auth/resolveRecoveryDestination';

async function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  return { container, root };
}

describe('recovery bridge', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.location.hash = '';
  });
  it('forwards hash to origin when only orig provided', async () => {
    window.location.hash = '#access_token=tok&type=recovery';
    const { container, root } = await render(
      <RecoveryBridgePage
        redirect="https://shop.example/auth/reset"
        error={null}
        auto={null}
        brokerHost={null}
        storeName="Demo"
        storeId="s1"
      />
    );
    await act(async () => { await Promise.resolve(); });
    const anchor = container.querySelector('a') as HTMLAnchorElement;
    expect(anchor.href).toBe('https://shop.example/auth/reset#access_token=tok&type=recovery&store_id=s1');
    root.unmount();
  });

  it('renders error when destination missing', async () => {
    const { container, root } = await render(
      <RecoveryBridgePage
        redirect={null}
        error="NO_DESTINATION"
        auto={null}
        brokerHost={null}
        storeName={null}
        storeId="s1"
        requestId="req1"
      />
    );
    expect(container.textContent).toMatch(/store domain/);
    expect(container.textContent).toMatch(/req1/);
    root.unmount();
  });

  it('forwards to auth_reset_url when present (hash preserved)', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                store_domain: 'client.com',
                live_domain: 'client.com',
                store_name: 'Client',
                auth_reset_url: 'https://client.com/fr/reset-password',
              },
            }),
          }),
        }),
      }),
    });
    resolveRecoveryDestination.mockReturnValue({ type: 'ok', origin: 'https://client.com' });
    const { props } = (await getServerSideProps({
      query: { store_id: 's1' },
      req: { headers: {} },
    } as any)) as any;
    window.location.hash = '#access_token=tok&type=recovery';
    const { container, root } = await render(<RecoveryBridgePage {...props} />);
    await act(async () => { await Promise.resolve(); });
    const anchor = container.querySelector('a') as HTMLAnchorElement;
    expect(anchor.href).toBe(
      'https://client.com/fr/reset-password#access_token=tok&type=recovery&store_id=s1'
    );
    root.unmount();
  });

  it('falls back to platform route when auth_reset_url absent', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                store_domain: 'client.com',
                live_domain: 'client.com',
                store_name: 'Client',
              },
            }),
          }),
        }),
      }),
    });
    resolveRecoveryDestination.mockReturnValue({ type: 'ok', origin: 'https://client.com' });
    const { props } = (await getServerSideProps({
      query: { store_id: 's1' },
      req: { headers: {} },
    } as any)) as any;
    window.location.hash = '#access_token=tok&type=recovery';
    const { container, root } = await render(<RecoveryBridgePage {...props} />);
    await act(async () => { await Promise.resolve(); });
    const anchor = container.querySelector('a') as HTMLAnchorElement;
    expect(anchor.href).toBe(
      'https://client.com/auth/reset#access_token=tok&type=recovery&store_id=s1'
    );
    root.unmount();
  });

  it('rejects auth_reset_url with mismatched host', async () => {
    getSupabaseAdmin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                store_domain: 'client.com',
                store_name: 'Client',
                auth_reset_url: 'https://evil.com/reset',
              },
            }),
          }),
        }),
      }),
    });
    resolveRecoveryDestination.mockReturnValue({ type: 'ok', origin: 'https://client.com' });
    const { props } = (await getServerSideProps({
      query: { store_id: 's1' },
      req: { headers: {} },
    } as any)) as any;
    expect(props.redirect).toBeNull();
    expect(props.error).toBe('INVALID_RESET_URL');
    const { container, root } = await render(<RecoveryBridgePage {...props} />);
    expect(container.textContent).toMatch(/Recovery paused/);
    root.unmount();
  });
});
