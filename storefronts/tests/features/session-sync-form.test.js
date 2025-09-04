import { describe, it, expect, vi } from 'vitest';
import { createDomStub } from '../utils/dom-stub';

describe('sessionSyncAndEmit form fallback', () => {
  it('creates and submits session-sync form when fetch fails', async () => {
    vi.resetModules();
    const formObj = { appendChild: vi.fn(), submit: vi.fn(), style: {} };
    const doc = createDomStub({
      createElement: vi.fn(tag => {
        if (tag === 'form') return formObj;
        return { appendChild: vi.fn(), style: {}, setAttribute: vi.fn(), type: '', name: '', value: '' };
      }),
      body: { appendChild: vi.fn() },
    });
    const realDoc = global.document;
    const realWin = global.window;
    const realFetch = global.fetch;
    global.document = doc;
    global.window = { document: doc, Smoothr: {}, SMOOTHR_CONFIG: { store_id: 'store_test', storeId: 'store_test' } };
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'));

    const { sessionSyncAndEmit } = await import('../../features/auth/init.js');
    await sessionSyncAndEmit('tok');

    expect(formObj.submit).toHaveBeenCalledTimes(1);
    expect(formObj.action.endsWith('/api/auth/session-sync')).toBe(true);

    global.document = realDoc;
    global.window = realWin;
    global.fetch = realFetch;
  });
});
