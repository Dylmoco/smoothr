import { vi } from 'vitest';

export function createDomStub(overrides: Record<string, any> = {}) {
  const stub = {
    querySelector: vi.fn(() => null),
    getElementById: vi.fn((id: string) =>
      id === 'smoothr-sdk'
        ? {
            dataset: { storeId: '00000000-0000-0000-0000-000000000000' },
            getAttribute: vi.fn((name: string) =>
              name === 'data-store-id'
                ? '00000000-0000-0000-0000-000000000000'
                : null
            ),
          }
        : null
    ),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: vi.fn((selector: string) =>
      selector === '[data-smoothr="pay"]' ? [{ dataset: {} }] : []
    ),
    createElement: vi.fn(() => ({ style: {} })),
    head: { appendChild: vi.fn() },
    body: {},
  };
  return { ...stub, ...overrides };
}

export default createDomStub;
