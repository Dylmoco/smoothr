import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import RecoveryBridgePage from '../../pages/auth/recovery-bridge';

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
});
