// src/checkout/gateways/nmiGateway.js

import { resolveTokenizationKey } from '../providers/nmiProvider.js'
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js'
import { disableButton, enableButton } from '../utils/cartHash.js'
import styleNmiIframes, { getNmiStyles } from '../utils/nmiIframeStyles.js'
import { getConfig } from '../../config/globalConfig.js'
import loadScriptOnce from '../../../utils/loadScriptOnce.js'

let hasMounted = false
let isConfigured = false
let isLocked = false
let isSubmitting = false
let configPromise
let resolveConfig
let rejectConfig

/**
 * Public entry: fetch tokenization key and initialize NMI
 * Returns a promise resolving when config completes
 */
export async function mountCardFields() {
  if (hasMounted) return configPromise
  hasMounted = true
  configPromise = new Promise((resolve, reject) => {
    resolveConfig = resolve
    rejectConfig = reject
  })

  const storeId = getConfig().storeId
  const tokenKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenKey) {
    console.warn('[NMI] Tokenization key missing')
    alert('Payment setup issue. Please try again or contact support.')
    rejectConfig(new Error('Tokenization key missing'))
    return configPromise
  }

  initNMI(tokenKey)
  return configPromise
}

export async function mountCheckout(config) {
  if (hasMounted) return configPromise
  return mountCardFields(config)
}

/**
 * Inject CollectJS and configure
 */
export async function initNMI(tokenKey) {
  if (isConfigured) return
  const debug = !!getConfig().debug
  console.log('[NMI] Appending CollectJS script...')

  // Get styles early for script attributes
  const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
  const { customCssObj, placeholderCssObj, googleFontString } = getNmiStyles()

  const attrs = {
    id: 'collectjs-script',
    'data-tokenization-key': tokenKey,
    'data-custom-css': JSON.stringify(customCssObj),
    'data-placeholder-css': JSON.stringify(placeholderCssObj),
    'data-style-sniffer': 'true',
    'data-google-font': googleFontString
  }
  console.log('[NMI] Set data-tokenization-key on script tag:', tokenKey.substring(0, 8) + '…')

  try {
    await loadScriptOnce('https://secure.nmi.com/token/Collect.js', { attrs })
    console.log('[NMI] CollectJS loaded')
    await waitForCollectJS()
    configureCollectJS()
  } catch (e) {
    debug && console.error('[NMI] Failed to load CollectJS', e)
    alert('Unable to load payment system. Please refresh the page.')
    rejectConfig(e)
  }
}

function waitForCollectJS(timeout = 15000) {
  let waited = 0
  return new Promise((resolve, reject) => {
    function check() {
      if (window.CollectJS) return resolve()
      if (waited >= timeout)
        return reject(new Error('CollectJS failed to load'))
      waited += 100
      setTimeout(check, 100)
    }
    check()
  })
}

/**
 * Configure fields & click guard
 */
function configureCollectJS() {
  if (isLocked) {
    return
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
        styleNmiIframes(cardNumberDiv, [
          cardNumberPlaceholderEl,
          expiryPlaceholderEl,
          cvcPlaceholderEl
        ])
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
    rejectConfig(e)
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

// Exports
export const mountNMI = mountCheckout
export function isMounted() { return isConfigured }
export function ready() { return configPromise }
export async function createPaymentMethod() { return { error:{message:'use CollectJS callback'}, payment_method:null } }
export default { mountCardFields, mountCheckout, isMounted, ready, createPaymentMethod }

if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  // expose for provider-nmi-global.test.ts
  window.Smoothr.mountNMIFields = mountNMI
}
