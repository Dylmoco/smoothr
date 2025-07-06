import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let handleRequest: (req: Request) => Promise<Response>;
let createClientMock: any;
let insertOrderMock: any;
let insertCustomerMock: any;
let maybeSingleMock: any;

async function loadModule() {
  const mod = await import('./webflow-order-handler/index.ts');
  handleRequest = mod.handleRequest;
}

describe('webflow-order-handler', () => {
  beforeEach(async () => {
    insertOrderMock = vi.fn().mockResolvedValue({ error: null });
    insertCustomerMock = vi.fn().mockResolvedValue({ data: { id: 'cust-1' }, error: null });
    maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });

    const customersBuilder = {
      select: vi.fn(() => customersBuilder),
      eq: vi.fn(() => customersBuilder),
      maybeSingle: maybeSingleMock,
      insert: insertCustomerMock,
    } as any;

    const ordersBuilder = { insert: insertOrderMock } as any;

    createClientMock = vi.fn(() => ({
      from: vi.fn((table: string) => (table === 'customers' ? customersBuilder : ordersBuilder))
    }));
    (globalThis as any).Deno = {
      env: {
        get: (key: string) => {
          if (key === 'SUPABASE_URL') return 'https://example.supabase.co';
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-key';
          return undefined;
        }
      },
      serve: vi.fn()
    };
    vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));
    await loadModule();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete (globalThis as any).Deno;
  });

  it('returns 405 for non-POST requests', async () => {
    const res = await handleRequest(new Request('https://example.com', { method: 'GET' }));
    expect(res.status).toBe(405);
  });

  it('inserts order and returns success', async () => {
    const payload = {
      orderId: '1',
      customerInfo: { email: 'user@example.com' },
      lineItems: [{ id: 'a' }],
      total: 10,
      siteId: 'site',
      createdOn: '2024-01-01T00:00:00.000Z'
    };
    const res = await handleRequest(new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }));
    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-key',
      {
        global: {
          headers: {
            apikey: 'service-key',
            Authorization: 'Bearer service-key'
          }
        }
      }
    );
    expect(insertCustomerMock).toHaveBeenCalledWith({ store_id: 'site', email: 'user@example.com' });
    expect(insertOrderMock).toHaveBeenCalledWith({
      customer_email: 'user@example.com',
      customer_id: 'cust-1',
      platform: 'webflow',
      store_id: 'site',
      raw_data: payload,
      tracking_number: null,
      label_url: null,
      problem_flag: false,
      flag_reason: null,
      updated_at: expect.any(String),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, site_id: 'site' });
  });
});

describe('missing env vars', () => {
  it('returns 500 when credentials are missing', async () => {
    (globalThis as any).Deno = {
      env: { get: () => undefined },
      serve: vi.fn()
    };
    vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
    const mod = await import('./webflow-order-handler/index.ts');
    const fn = mod.handleRequest;
    const res = await fn(new Request('https://example.com', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Missing Supabase credentials' });
    vi.resetModules();
    vi.restoreAllMocks();
    delete (globalThis as any).Deno;
  });
});
