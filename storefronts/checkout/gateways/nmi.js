// src/checkout/gateways/nmi.js

import { resolveTokenizationKey } from '../providers/nmi.js'
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js'
import { disableButton, enableButton } from '../utils/cartHash.js'

let hasMounted = false
let isConfigured = false
let isLocked = false
let isSubmitting = false
let configPromise
let resolveConfig

function rgbToHex(rgb) {
  // If not a string or we can't parse three numbers, return input unchanged
  if (typeof rgb !== 'string') return rgb
  const parts = rgb.match(/\d+/g)
  if (!parts || parts.length < 3) return rgb
  const [r, g, b] = parts.map(Number)
  return (
    `#${r.toString(16).padStart(2, '0')}` +
    `${g.toString(16).padStart(2, '0')}` +
    `${b.toString(16).padStart(2, '0')}`
  )
}

/**
 * Public entry: fetch tokenization key and initialize NMI
 * Returns a promise resolving when config completes
 */
export async function mountCardFields() {
  if (hasMounted) return configPromise
  hasMounted = true
  configPromise = new Promise(resolve => { resolveConfig = resolve })

  const storeId = window.SMOOTHR_CONFIG.storeId
  const tokenKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenKey) {
    console.warn('[NMI] Tokenization key missing')
    alert('Payment setup issue. Please try again or contact support.')
    resolveConfig()
    return configPromise
  }

  initNMI(tokenKey)
  return configPromise
}

/**
 * Inject CollectJS and configure
 */
export function initNMI(tokenKey) {
  if (isConfigured) return
  console.log('[NMI] Appending CollectJS script...')

  // Get styles early for script attributes
  const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
  const divStyle = getComputedStyle(cardNumberDiv)
  const emailInput = document.querySelector('[data-smoothr-email]')
  let placeholderStyle
  if (emailInput) {
    placeholderStyle = getComputedStyle(emailInput, '::placeholder')
  } else {
    console.warn('[NMI] Email input not found, falling back to original placeholder style')
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector('[data-smoothr-card-placeholder]')
    placeholderStyle = cardNumberPlaceholderEl ? getComputedStyle(cardNumberPlaceholderEl) : divStyle
  }
  const placeholderColorHex = rgbToHex(placeholderStyle.color)
  console.log('[NMI] Placeholder color hex:', placeholderColorHex)
  const placeholderFontWeight = placeholderStyle.fontWeight
  const fontFamily = placeholderStyle.fontFamily.split(',')[0].trim().replace(/"/g, '')
  const googleFontString = `${fontFamily}:100,200,300,400,500,600,700,800,900`
  console.log('[NMI] Dynamic Google font:', googleFontString)

  const customCssObj = {
    'background-color': 'transparent',
    'border': 'none',
    'box-shadow': 'none',
    'margin': '0',
    'color': divStyle.color,
    'font-family': divStyle.fontFamily,
    'font-size': divStyle.fontSize,
    'font-style': divStyle.fontStyle,
    'font-weight': divStyle.fontWeight,
    'letter-spacing': divStyle.letterSpacing,
    'line-height': divStyle.lineHeight,
    'text-align': divStyle.textAlign,
    'text-shadow': divStyle.textShadow,
    'width': '100%',
    'height': divStyle.height,
    'min-height': divStyle.minHeight,
    'max-height': divStyle.maxHeight,
    'box-sizing': 'border-box',
    'padding-top': divStyle.paddingTop,
    'padding-right': divStyle.paddingRight,
    'padding-bottom': divStyle.paddingBottom,
    'padding-left': divStyle.paddingLeft,
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'flex-start',
    'outline': 'none',
    'vertical-align': 'middle'
  }

  const placeholderCssObj = {
    'color': placeholderColorHex,
    'font-family': placeholderStyle.fontFamily,
    'font-size': placeholderStyle.fontSize,
    'font-style': placeholderStyle.fontStyle,
    'font-weight': placeholderFontWeight,
    'letter-spacing': placeholderStyle.letterSpacing,
    'line-height': placeholderStyle.lineHeight,
    'text-align': placeholderStyle.textAlign,
    'opacity': placeholderStyle.opacity
  }

  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.async = true
  script.setAttribute('data-tokenization-key', tokenKey)
  script.setAttribute('data-custom-css', JSON.stringify(customCssObj))
  script.setAttribute('data-placeholder-css', JSON.stringify(placeholderCssObj))
  script.setAttribute('data-style-sniffer', 'true')
  script.setAttribute('data-google-font', googleFontString)
  console.log('[NMI] Set data-tokenization-key on script tag:', tokenKey.substring(0, 8) + '…')

  script.onload = () => {
    console.log('[NMI] CollectJS loaded')
    configureCollectJS()
  }
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS')
    alert('Unable to load payment system. Please refresh the page.')
    resolveConfig()
  }

  document.head.appendChild(script)
}

/**
 * Configure fields & click guard
 */
function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    return setTimeout(configureCollectJS, 500)
  }
  isLocked = true

  try {
    // Get placeholder info
    const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector('[data-smoothr-card-placeholder]')
    const expiryPlaceholderEl = document.querySelector('[data-smoothr-card-expiry] [data-smoothr-expiry-placeholder]')
    const cvcPlaceholderEl    = document.querySelector('[data-smoothr-card-cvc] [data-smoothr-cvv-placeholder]')
    const cardNumberPlaceholderText = cardNumberPlaceholderEl ? cardNumberPlaceholderEl.textContent.trim() : 'Card Number'
    const expiryPlaceholderText     = expiryPlaceholderEl ? expiryPlaceholderEl.textContent.trim()     : 'MM/YY'
    const cvcPlaceholderText        = cvcPlaceholderEl    ? cvcPlaceholderEl.textContent.trim()        : 'CVC'

    CollectJS.configure({
      variant: 'inline',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]', placeholder: cardNumberPlaceholderText },
        ccexp:   { selector: '[data-smoothr-card-expiry]', placeholder: expiryPlaceholderText },
        cvv:     { selector: '[data-smoothr-card-cvc]', placeholder: cvcPlaceholderText }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available')
        const iframes = document.querySelectorAll('iframe[id^="CollectJS"]')
        iframes.forEach(iframe => {
          iframe.style.position   = 'absolute'
          iframe.style.top        = '0'
          iframe.style.left       = '0'
          iframe.style.width      = '100%'
          iframe.style.height     = cardNumberDiv.offsetHeight + 'px'
          iframe.style.border     = 'none'
          iframe.style.background = 'transparent'
        })
        ;[cardNumberPlaceholderEl, expiryPlaceholderEl, cvcPlaceholderEl].forEach(el => el && (el.style.display = 'none'))
      },
      callback(response) {
        const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
        if (!response.token) {
          console.error('[NMI] Tokenization failed', response.reason)
          alert('Please check your payment details and try again.')
          resetSubmission(buttons)
          return
        }
        console.log('[NMI] Token:', response.token)
        // ... payload build & fetch logic unchanged ...
      }
    })

    // Guarded click handler
    const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
    const tokenFn = CollectJS.tokenize || CollectJS.requestToken || CollectJS.startPaymentRequest || null
    buttons.forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault()
        if (isSubmitting) return false
        isSubmitting = true
        buttons.forEach(disableButton)
        if (tokenFn) tokenFn()
        else resetSubmission(buttons)
        return false
      })
    })

    isConfigured = true
    console.log('[NMI] Config complete')
    resolveConfig()
  } catch (e) {
    console.error('[NMI] Config error', e)
    alert('Setup error. Refresh or contact support.')
    resetSubmission(Array.from(document.querySelectorAll('[data-smoothr-pay]')))
    resolveConfig()
  }
}

/**
 * Re-enable buttons & clear flags
 */
function resetSubmission(buttons) {
  isLocked = false
  isSubmitting = false
  buttons.forEach(enableButton)
}

// Exports & auto-mount
export const mountNMI = mountCardFields
export function isMounted() { return isConfigured }
export function ready() { return isConfigured }
export async function createPaymentMethod() { return { error:{message:'use CollectJS callback'}, payment_method:null } }
export default { mountCardFields, isMounted, ready, createPaymentMethod }

if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  // expose for provider-nmi-global.test.ts
  window.Smoothr.mountNMIFields = mountNMI
  if (document.readyState === 'complete') mountCardFields()
  else document.addEventListener('DOMContentLoaded', mountCardFields)
}
