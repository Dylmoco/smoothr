// ⚠️ Deployed via Codex because Cloudflare Pages Function could not reach exchangerate.host. This function is now the canonical Smoothr rate source.
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type'
}

const FALLBACK = {
  base: 'GBP',
  rates: {
    USD: 1.25,
    EUR: 1.17,
    GBP: 1,
  },
};

serve(async (req: Request) => {
  const url = new URL(req.url)
  const base = (url.searchParams.get('base') || 'GBP').toUpperCase()
  const symbols = (url.searchParams.get('symbols') || 'USD,EUR,GBP').toUpperCase()

  try {
    const apiUrl = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols}`
    const res = await fetch(apiUrl, { redirect: 'manual' })
    console.log('📡 Fetching live rates from', apiUrl)
    console.log('🌐 Response status:', res.status)
    const rawText = await res.text()
    console.log('🧾 Raw response body:', rawText)

    const data = JSON.parse(rawText)
    if (!res.ok) {
      console.error('Exchange fetch status', res.status)
      console.error('Exchange fetch body', rawText)
      throw new Error('Fetch failed')
    }

    if (!data.rates || typeof data.rates.USD !== 'number') {
      console.error('Invalid rates payload', data)
      throw new Error('Invalid rates structure')
    }

    const payload = { base: data.base, date: data.date, rates: data.rates }
    return new Response(JSON.stringify(payload), { headers: CORS_HEADERS })
  } catch (e) {
    console.error('❌ Fetch or JSON error:', e);
    const fallbackPayload = { ...FALLBACK, date: new Date().toISOString() };
    return new Response(JSON.stringify(fallbackPayload), { headers: CORS_HEADERS });
  }
})
