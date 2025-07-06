import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let supabase: any
let createClientMock: any
let settingsBuilder: any
let integrationsBuilder: any

async function loadClient() {
  supabase = (await import('../supabaseClient.js')).default
}

describe('store tables queries', () => {
  beforeEach(async () => {
    settingsBuilder = {
      select: vi.fn(() => settingsBuilder),
      eq: vi.fn(() => settingsBuilder),
      maybeSingle: vi.fn(),
    }
    integrationsBuilder = {
      select: vi.fn(() => integrationsBuilder),
      eq: vi.fn(() => integrationsBuilder),
      maybeSingle: vi.fn(),
    }
    createClientMock = vi.fn(() => ({
      from: (table: string) =>
        table === 'store_settings' ? settingsBuilder : integrationsBuilder,
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
    const settingsRow = { id: 's1', store_id: storeId }
    const integrationRow = { id: 'i1', store_id: storeId }

    settingsBuilder.maybeSingle.mockResolvedValue({ data: settingsRow, error: null })
    integrationsBuilder.maybeSingle.mockResolvedValue({ data: integrationRow, error: null })

    const { data: settings, error: settingsError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle()

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
