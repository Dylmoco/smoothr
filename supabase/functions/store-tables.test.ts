import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let supabase: any
let createClientMock: any
let settingsBuilder: any
let integrationsBuilder: any

async function loadClient() {

  supabase = (await import('../../shared/supabase/client.ts')).supabase

}

describe('store tables queries', () => {
  beforeEach(async () => {
    settingsBuilder = {
      select: vi.fn(() => settingsBuilder),
      eq: vi.fn(() => settingsBuilder),
      single: vi.fn(),
    }
    integrationsBuilder = {
      select: vi.fn(() => integrationsBuilder),
      eq: vi.fn(() => integrationsBuilder),
      maybeSingle: vi.fn(),
    }
    createClientMock = vi.fn(() => ({
      from: (table: string) =>
        table === 'v_public_store' ? settingsBuilder : integrationsBuilder,
    }))
    vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
    await loadClient()
  })

  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('returns settings and integrations data', async () => {
    const storeId = 'store-123'
    const settingsRow = { base_currency: 'USD', public_settings: { mode: 'test' } }
    const integrationRow = { id: 'i1', store_id: storeId }

    settingsBuilder.single.mockResolvedValue({ data: settingsRow, error: null })
    integrationsBuilder.maybeSingle.mockResolvedValue({ data: integrationRow, error: null })

    const { data: settings, error: settingsError } = await supabase
      .from('v_public_store')
      .select('base_currency, public_settings')
      .eq('store_id', storeId)
      .single()

    const { data: integration, error: integrationError } = await supabase
      .from('store_integrations')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle()

    expect(settings).toEqual(settingsRow)
    expect(settingsError).toBeNull()
    expect(integration).toEqual(integrationRow)
    expect(integrationError).toBeNull()
  })
})
