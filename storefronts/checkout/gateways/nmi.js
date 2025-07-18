// src/checkout/gateways/nmi.js

import { resolveTokenizationKey } from '../providers/nmi.js'
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js'
import { disableButton, enableButton } from '../utils/cartHash.js'

let hasMounted = false
let isConfigured = false
let isLocked = false
let isSubmitting = false

// mountCardFields returns a promise that resolves once configureCollectJS has run
let mountPromise
let mountResolve

export async function mountCardFields() {
  if (hasMounted) return mountPromise
  hasMounted = true
  mountPromise = new Promise(r => { mountResolve = r })

  const storeId = window?.Smoothr?.store_id
  const tokenKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenKey) {
    console.warn('[NMI] Tokenization key missing')
    alert('Payment setup issue. Please try again or contact support.')
    mountResolve()
    return mountPromise
  }

  initNMI(tokenKey)
  return mountPromise
}

function initNMI(tokenKey) {
  if (isConfigured) return

  console.log('[NMI] Appending CollectJS script…')
  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.async = true
  script.setAttribute('data-tokenization-key', tokenKey)
  script.onload = () => configureCollectJS()
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS')
    alert('Unable to load payment system. Please refresh the page.')
    resetSubmission()
    mountResolve()
  }
  document.head.appendChild(script)
}

function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    return setTimeout(configureCollectJS, 300)
  }
  isLocked = true

  try {
    CollectJS.configure({
      variant: 'inline',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]' },
        ccexp:    { selector: '[data-smoothr-card-expiry]' },
        cvv:      { selector: '[data-smoothr-card-cvc]' }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available')
      },
      callback(response) {
        const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
        if (!response.token) {
          console.error('[NMI] Tokenization failed:', response.reason)
          alert('Please check your payment details and try again.')
          resetSubmission(buttons)
          return
        }
        console.log('[NMI] Token:', response.token)
        // TODO: collect full form/cart payload here
        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_token: response.token,
            store_id: window.SMOOTHR_CONFIG.storeId,
            /* …other fields… */
          })
        })
          .then(res => res.json().then(data => {
            handleSuccessRedirect(res, data)
            resetSubmission(buttons)
          }))
          .catch(err => {
            console.error('[NMI] POST error', err)
            alert('Please check your payment details and try again.')
            resetSubmission(buttons)
          })
      }
    })

    // guard against all possible CollectJS methods
    const tokenFn =
      CollectJS.tokenize ||
      CollectJS.tokenizePayment ||
      CollectJS.requestToken ||
      CollectJS.startPayment ||
      CollectJS.requestPaymentToken ||
      null

    const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
    buttons.forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault()
        if (isSubmitting) return false
        isSubmitting = true
        buttons.forEach(disableButton)

        if (tokenFn) {
          // call with the CollectJS context if needed
          try {
            tokenFn.call(CollectJS)
          } catch (e) {
            console.error('[NMI] token function threw', e)
            resetSubmission(buttons)
          }
        } else {
          console.error('[NMI] No CollectJS tokenization method found', Object.keys(CollectJS))
          alert('Payment system error. Please refresh.')
          resetSubmission(buttons)
        }
        return false
      })
    })

    isConfigured = true
    console.log('[NMI] Config complete')
    mountResolve()
  } catch (e) {
    console.error('[NMI] Config error', e)
    alert('Setup error. Refresh the page or contact support.')
    resetSubmission(Array.from(document.querySelectorAll('[data-smoothr-pay]')))
    mountResolve()
  }
}

function resetSubmission(buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))) {
  isLocked = false
  isSubmitting = false
  buttons.forEach(enableButton)
}

// legacy adapters
export function isMounted() { return isConfigured }
export function ready()     { return isConfigured }
export const mountNMI       = mountCardFields
export async function createPaymentMethod() {
  return { error:{message:'use CollectJS callback'}, payment_method: null }
}
export default { mountCardFields, isMounted, ready, createPaymentMethod }

// auto‐mount on DOM ready
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  if (document.readyState === 'complete') mountCardFields()
  else document.addEventListener('DOMContentLoaded', mountCardFields)
}
