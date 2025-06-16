import { describe, it, expect, vi } from 'vitest'
import { handleRequest, FALLBACK } from '../handler'

describe('handleRequest', () => {
  it('parses valid OpenExchangeRates response', async () => {
    const mockRes = {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        timestamp: 2,
        rates: { USD: 2, EUR: 1, GBP: 1 }
      })
    }
    const fetchFn = vi.fn(async () => mockRes as any)
    const req = new Request('https://example.com')
    const res = await handleRequest(req, 'token', fetchFn)
    const body = await res.json()
    expect(body.base).toBe('GBP')
    expect(body.rates).toEqual({ USD: 2/1, EUR: 1/1, GBP: 1 })
    expect(body.date).toBe(new Date(2 * 1000).toISOString())
  })

  it('falls back when fetch throws', async () => {
    const fetchFn = vi.fn(async () => { throw new Error('fail') })
    const req = new Request('https://example.com')
    const res = await handleRequest(req, 'token', fetchFn)
    const body = await res.json()
    expect(body.base).toBe(FALLBACK.base)
    expect(body.rates).toEqual(FALLBACK.rates)
  })
})
