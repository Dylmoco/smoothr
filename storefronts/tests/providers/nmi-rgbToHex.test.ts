import { describe, it, expect, vi } from 'vitest'
import { rgbToHex } from '../../features/checkout/utils/nmiIframeStyles.js'

(vi as any).setTimeout?.(15000)

describe('rgbToHex', () => {
  it('returns hex strings unchanged', () => {
    expect(rgbToHex('#ff00ff')).toBe('#ff00ff')
  })

  it('converts rgb strings to hex', () => {
    expect(rgbToHex('rgb(255, 0, 255)')).toBe('#ff00ff')
  })

  it('returns black for invalid strings', () => {
    expect(rgbToHex('weird')).toBe('#000000')
  })
})
