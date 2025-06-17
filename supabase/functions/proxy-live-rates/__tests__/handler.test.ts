import { describe, it, expect, vi } from 'vitest'
import { handleRequest, FALLBACK } from '../handler'

describe('handleRequest', () => {
  it('parses valid OpenExchangeRates response', async () => {
    const mockRes = {
      ok: true,
      status: 200,
      json: async () => ({
        timestamp: 2,
        rates: { USD: 2, EUR: 1, GBP: 1 }
      })
    }
    const fetchFn = vi.fn(async () => mockRes as any)
    const req = new Request('https://example.com')
    const res = await handleRequest(req, fetchFn)
    const body = await res.json()
    expect(body.base).toBe('GBP')
    expect(body.rates).toEqual({ USD: 2/1, EUR: 1/1, GBP: 1 })
    expect(body.date).toBe(new Date(2 * 1000).toISOString())
  })

  it('requests OER with required headers', async () => {
    const mockRes = {
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1, EUR: 1, GBP: 1 } })
    }
    const fetchFn = vi.fn(async (url: string, opts: any) => {
      expect(opts.method).toBe('GET')
      expect(opts.headers.Accept).toBe('application/json')
      expect(opts.headers['User-Agent']).toBe('SmoothrProxy/1.0')
      expect(opts.headers.Authorization).toBeUndefined()
      expect(opts.redirect).toBeUndefined()
      return mockRes as any
    })
    const req = new Request('https://example.com')
    await handleRequest(req, fetchFn)
    expect(fetchFn).toHaveBeenCalled()
  })

  it('falls back when fetch throws', async () => {
    const fetchFn = vi.fn(async () => { throw new Error('fail') })
    const req = new Request('https://example.com')
    const res = await handleRequest(req, fetchFn)
    const body = await res.json()
    expect(body.base).toBe(FALLBACK.base)
    expect(body.rates).toEqual(FALLBACK.rates)
  })
})
