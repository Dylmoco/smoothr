import { describe, it, expect } from 'vitest'
import { supabase } from '../../shared/supabase/client.ts'

describe('supabase client headers', () => {
  it('includes default authorization headers', () => {
    const key = process.env.SUPABASE_ANON_KEY
    expect((supabase as any).headers).toEqual(
      expect.objectContaining({
        apikey: key,
        Authorization: `Bearer ${key}`,
      })
    )
  })
})
