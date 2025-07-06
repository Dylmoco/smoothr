import { describe, it, expect } from 'vitest'
import supabase, { DEFAULT_SUPABASE_KEY } from '../supabaseClient.js'

describe('supabase client headers', () => {
  it('includes default authorization headers', () => {
    expect((supabase as any).headers).toEqual(
      expect.objectContaining({
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
      })
    )
  })
})
