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
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Public entry: fetch your tokenization key then initialize NMI
 * Returns a promise that resolves when configuration completes
 */
export async function mountCardFields() {
  if (hasMounted) return configPromise
  hasMounted = true
  configPromise = new Promise(resolve => { resolveConfig = resolve })

  const storeId = window?.Smoothr?.store_id
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
 * Append Collect.js script and configure fields once loaded
 */
export function initNMI(tokenizationKey) {
  if (isConfigured) return
  console.log('[NMI] Appending CollectJS script...')

  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.async = true
  script.setAttribute('data-tokenization-key', tokenizationKey)
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

function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    return setTimeout(configureCollectJS, 500)
  }
  isLocked = true

  try {
    // CollectJS field configuration
    CollectJS.configure({
      variant: 'inline',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]' },
        ccexp:   { selector: '[data-smoothr-card-expiry]' },
        cvv:     { selector: '[data-smoothr-card-cvc]' }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available')
      },
      callback(response) {
        const buttons = document.querySelectorAll('[data-smoothr-pay]')
        if (!response.token) {
          console.error('[NMI] Tokenization failed', response.reason)
          alert('Payment failed: ' + (response.reason||''))
          resetSubmission(buttons)
          return
        }
        console.log('[NMI] Token:', response.token)
        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ payment_token: response.token, store_id: window.SMOOTHR_CONFIG.storeId /*...*/ })
        })
          .then(res => res.json().then(data => {
            handleSuccessRedirect(res, data)
            resetSubmission(buttons)
          }))
          .catch(err => {
            console.error('[NMI] POST error', err)
            alert('Payment error')
            resetSubmission(buttons)
          })
      }
    })

    // Guarded click handler
    const buttons = document.querySelectorAll('[data-smoothr-pay]')
    const tokenFn = CollectJS.tokenize || CollectJS.requestToken || null
    buttons.forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault()
        if (isSubmitting) return
        isSubmitting = true
        buttons.forEach(disableButton)
        if (tokenFn) tokenFn()
        else resetSubmission(buttons)
      })
    })

    isConfigured = true
    resolveConfig()
    console.log('[NMI] Config complete')
  } catch(e) {
    console.error('[NMI] Config error', e)
    alert('Setup error')
    resetSubmission(document.querySelectorAll('[data-smoothr-pay]'))
    resolveConfig()
  }
}

function resetSubmission(btns) {
  isLocked = false; isSubmitting = false;
  btns.forEach(enableButton)
}

// Legacy alias & readiness
export const mountNMI = mountCardFields
export function isMounted() { return isConfigured }
export function ready() { return isConfigured }
export async function createPaymentMethod() {
  return { error:{message:'use CollectJS callback'}, payment_method:null }
}
export default { mountCardFields, isMounted, ready, createPaymentMethod }

// Auto-mount on DOM ready
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr||{}
  if (document.readyState==='complete') mountCardFields()
  else document.addEventListener('DOMContentLoaded', mountCardFields)
}
