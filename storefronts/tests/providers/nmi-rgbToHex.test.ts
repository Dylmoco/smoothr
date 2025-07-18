import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let initNMI: any
let appendSpy: any
let scriptEl: any

async function setup(color: string) {
  vi.resetModules()
  document.body.innerHTML = ''
  document.head.innerHTML = ''

  const cardNumberDiv = document.createElement('div')
  cardNumberDiv.setAttribute('data-smoothr-card-number', '')
  document.body.appendChild(cardNumberDiv)

  const emailInput = document.createElement('input')
  emailInput.setAttribute('data-smoothr-email', '')
  document.body.appendChild(emailInput)

  const style = {
    color,
    fontFamily: 'Arial',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '400',
    letterSpacing: '0px',
    lineHeight: 'normal',
    textAlign: 'left',
    opacity: '1',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    height: '10px',
    minHeight: '10px',
    maxHeight: '10px',
    textShadow: 'none',
    width: '10px',
    boxSizing: 'border-box'
  } as any
  vi.spyOn(window, 'getComputedStyle').mockImplementation((_el: any, pseudo?: string) => {
    return style
  })

  appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(el => {
    if ((el as HTMLElement).tagName === 'SCRIPT') {
      scriptEl = el
    }
    return el
  })

  window.SMOOTHR_CONFIG = { storeId: 'store-1', active_payment_gateway: 'nmi' } as any

  const mod = await import('../../checkout/gateways/nmi.js')
  initNMI = mod.initNMI

  await initNMI('tok_key')
}

afterEach(() => {
  vi.restoreAllMocks()
  scriptEl = null
})

describe('rgbToHex handling', () => {
  it('accepts hex color strings', async () => {
    await setup('#ff00ff')
    const placeholderCss = JSON.parse((scriptEl as HTMLElement).getAttribute('data-placeholder-css') || '{}')
    expect(placeholderCss.color).toBe('#ff00ff')
    appendSpy.mockRestore()
  })

  it('returns original string for unexpected formats', async () => {
    await setup('weird')
    const placeholderCss = JSON.parse((scriptEl as HTMLElement).getAttribute('data-placeholder-css') || '{}')
    expect(placeholderCss.color).toBe('weird')
    appendSpy.mockRestore()
  })
})
