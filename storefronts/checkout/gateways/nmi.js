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
  const match = rgb.match(/\d+/g)
  if (!match || match.length < 3) return rgb
  const [r, g, b] = match.map(Number)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`
}

/**
 * Public entry: fetch your tokenization key then kick off the init logic.
 * Returns a promise that resolves once fields are configured.
 */
export async function mountCardFields() {
  if (hasMounted) return configPromise
  hasMounted = true
  configPromise = new Promise(resolve => { resolveConfig = resolve })

  const storeId =
    typeof window !== 'undefined' && window.Smoothr
      ? window.Smoothr.store_id
      : undefined

  const tokenizationKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenizationKey) {
    console.warn('[NMI] Tokenization key missing')
    alert('Payment setup issue. Please try again or contact support.')
    resolveConfig()
    return configPromise
  }

  initNMI(tokenizationKey)
  return configPromise
}

/**
 * Load NMI’s Collect.js and configure.
 */
export function initNMI(tokenizationKey) {
  console.log('[NMI] Attempting to mount NMI fields...')
  if (isConfigured) return

  // ...existing style-sniffing code...
  // (unchanged placeholder/style extraction logic)

  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.setAttribute('data-tokenization-key', tokenizationKey)
  script.async = true
  script.onload = () => {
    console.log('[NMI] CollectJS script loaded.')
    configureCollectJS()
  }
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS script.')
    alert('Unable to load payment system. Please refresh the page.')
    resolveConfig()
  }

  document.head.appendChild(script)
}

function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    console.error(
      '[NMI] CollectJS not ready or locked, delaying configuration.'
    )
    return setTimeout(configureCollectJS, 500)
  }
  isLocked = true

  try {
    // ...existing field placeholder and styling code...

    CollectJS.configure({
      variant: 'inline',
      fields: {/* unchanged */},
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available, ready to tokenize')
        // ...existing iframe styling and placeholder hide...
      },
      callback(response) {
        const payButtons = document.querySelectorAll('[data-smoothr-pay]')
        if (!response.token) {
          console.log('[NMI] Failed:', response.reason)
          alert('Payment failed: ' + (response.reason || 'Unknown error. Try again.'))
          resetSubmission(payButtons)
          return
        }
        console.log('[NMI] Success, token:', response.token)
        console.log(
          '[NMI] Sending POST with store_id:',
          window.SMOOTHR_CONFIG.storeId
        )
        // ...existing data gathering and fetch logic...
          .then(res =>
            res.json().then(data => {
              console.log('[NMI] Backend response:', data)
              handleSuccessRedirect(res, data)
              resetSubmission(payButtons)
            })
          )
          .catch(error => {
            console.error('[NMI] POST error:', error)
            alert('Payment processing error. Please try again.')
            resetSubmission(payButtons)
          })
      }
    })

    // Attach a single guarded click handler
    const payButtons = document.querySelectorAll('[data-smoothr-pay]')
    // dynamically pick the token function on CollectJS
    const tokenFn =
      typeof CollectJS.tokenize === 'function'
        ? CollectJS.tokenize
        : typeof CollectJS.tokenizePayment === 'function'
        ? CollectJS.tokenizePayment
        : typeof CollectJS.requestToken === 'function'
        ? CollectJS.requestToken
        : null

    payButtons.forEach(btn => {
      const handler = ev => {
        ev.preventDefault()
        if (isSubmitting) return false
        isSubmitting = true
        payButtons.forEach(disableButton)
        if (tokenFn) {
          tokenFn()
        } else {
          console.error('[NMI] No CollectJS tokenization method found', Object.keys(CollectJS))
          resetSubmission(payButtons)
        }
        return false
      }
      btn.addEventListener('click', handler)
    })

    isConfigured = true
    console.log('[NMI] CollectJS configured successfully')
    if (resolveConfig) resolveConfig()
  } catch (error) {
    console.error('[NMI] Error configuring CollectJS:', error)
    alert('Setup error. Refresh the page or contact support.')
    resetSubmission(document.querySelectorAll('[data-smoothr-pay]'))
    if (resolveConfig) resolveConfig()
  }
}

function resetSubmission(buttons) {
  isLocked = false
  isSubmitting = false
  buttons.forEach(enableButton)
}

// Legacy alias
export const mountNMI = mountCardFields

// Gateway readiness checks
export function isMounted() {
  return isConfigured
}
export function ready() {
  return isConfigured
}
// unused with CollectJS callback
export async function createPaymentMethod() {
  return { error: { message: 'use CollectJS callback' }, payment_method: null }
}

// Default export
export default {
  mountCardFields,
  mountNMI,
  isMounted,
  ready,
  createPaymentMethod
}

// Expose global hook & auto-mount
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  window.Smoothr.mountNMIFields = mountCardFields

  if (document.readyState === 'complete') {
    mountCardFields()
  } else {
    document.addEventListener('DOMContentLoaded', mountCardFields)
  }
}
