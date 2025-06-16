// ⚠️ Deployed via Codex because Cloudflare Pages Function could not reach exchangerate.host. This function is now the canonical Smoothr rate source.
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { handleRequest } from './handler.ts'

serve((req: Request) => {
  const token = Deno.env.get('OPENEXCHANGERATES_TOKEN') || ''
  return handleRequest(req, token, fetch)
})
