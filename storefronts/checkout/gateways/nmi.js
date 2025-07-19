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

  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.async = true
  script.setAttribute('data-tokenization-key', tokenKey)
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
        const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
        if (!response.token) {
          console.error('[NMI] Tokenization failed', response.reason)
          alert('Please check your payment details and try again.')
          resetSubmission(buttons)
          return
        }
        console.log('[NMI] Token:', response.token)

        // Build full payload
        const firstName = document.querySelector('[data-smoothr-first-name]')?.value || ''
        const lastName  = document.querySelector('[data-smoothr-last-name]')?.value || ''
        const email     = document.querySelector('[data-smoothr-email]')?.value || ''
        const shipLine1 = document.querySelector('[data-smoothr-ship-line1]')?.value || ''
        const shipLine2 = document.querySelector('[data-smoothr-ship-line2]')?.value || ''
        const shipCity  = document.querySelector('[data-smoothr-ship-city]')?.value || ''
        const shipState = document.querySelector('[data-smoothr-ship-state]')?.value || ''
        const shipPostal= document.querySelector('[data-smoothr-ship-postal]')?.value || ''
        const shipCountry = document.querySelector('[data-smoothr-ship-country]')?.value || ''
        const sameBilling = !!document.querySelector('[data-smoothr-billing-same-as-shipping]:checked')
        let billLine1   = sameBilling ? shipLine1 : document.querySelector('[data-smoothr-bill-line1]')?.value || ''
        let billLine2   = sameBilling ? shipLine2 : document.querySelector('[data-smoothr-bill-line2]')?.value || ''
        let billCity    = sameBilling ? shipCity  : document.querySelector('[data-smoothr-bill-city]')?.value || ''
        let billState   = sameBilling ? shipState : document.querySelector('[data-smoothr-bill-state]')?.value || ''
        let billPostal  = sameBilling ? shipPostal: document.querySelector('[data-smoothr-bill-postal]')?.value || ''
        let billCountry = sameBilling ? shipCountry: document.querySelector('[data-smoothr-bill-country]')?.value || ''
        const cartData = window.Smoothr.cart.getCart() || { items: [] }
        const items = Array.isArray(cartData.items) ? cartData.items : []
        const total = Math.round((window.Smoothr.cart.getTotal() || 0) * 100)
        const currency = window.SMOOTHR_CONFIG.baseCurrency || 'USD'

        const payload = {
          payment_token: response.token,
          store_id: window.SMOOTHR_CONFIG.storeId,
          first_name: firstName,
          last_name: lastName,
          email,
          shipping: {
            name: `${firstName} ${lastName}`.trim(),
            address: { line1: shipLine1, line2: shipLine2, city: shipCity, state: shipState, postal_code: shipPostal, country: shipCountry }
          },
          billing: {
            name: `${firstName} ${lastName}`.trim(),
            address: { line1: billLine1, line2: billLine2, city: billCity, state: billState, postal_code: billPostal, country: billCountry }
          },
          cart: items.map(item => ({ product_id: item.id, name: item.name, quantity: item.quantity, price: Math.round((item.price || 0) * 100) })),
          total,
          currency
        }

        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json().then(data => {
            handleSuccessRedirect(res, data)
            resetSubmission(buttons)
          }))
          .catch(err => {
            console.error('[NMI] POST error', err)
            alert('Payment processing error. Please try again.')
            resetSubmission(buttons)
          })
      }
    })

    // Guarded click handler picks up correct token method
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
  if (document.readyState === 'complete') mountCardFields()
  else document.addEventListener('DOMContentLoaded', mountCardFields)
}