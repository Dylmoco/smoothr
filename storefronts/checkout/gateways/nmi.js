import { resolveTokenizationKey } from '../providers/nmi.js'
import waitForElement from '../utils/waitForElement.js'

let tokenizationKey
let hasMounted = false

// Parse MM/YY or M/YY into ["MM","YYYY"]
function parseExpiry(val) {
  const m = val.trim().match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/)
  if (!m) return [null, null]
  let [, mon, yr] = m
  if (mon.length === 1) mon = '0' + mon
  if (yr.length === 2) yr = '20' + yr
  return [mon, yr]
}

// Inject or update the hidden expiry fields
function syncHiddenExpiryFields(container, mon, yr) {
  let mm = container.querySelector('input[data-collect="expMonth"]')
  let yy = container.querySelector('input[data-collect="expYear"]')
  if (!mm) {
    mm = document.createElement('input')
    mm.type = 'hidden'
    mm.setAttribute('data-collect', 'expMonth')
    container.appendChild(mm)
  }
  if (!yy) {
    yy = document.createElement('input')
    yy.type = 'hidden'
    yy.setAttribute('data-collect', 'expYear')
    container.appendChild(yy)
  }
  mm.value = mon
  yy.value = yr
}

/**
 * Mounts the NMI Collect.js fields into your placeholders.
 */
export async function mountCardFields() {
  if (hasMounted) return
  // pass in your store ID so resolveTokenizationKey can lookup correctly
  const storeId =
    typeof window !== 'undefined' && window.Smoothr
      ? window.Smoothr.store_id
      : undefined

  tokenizationKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenizationKey) {
    console.warn('[NMI] Tokenization key missing')
    return
  }
  hasMounted = true

  // Wait for placeholders
  const numEl = await waitForElement('[data-smoothr-card-number]')
  const expEl = await waitForElement('[data-smoothr-card-expiry]')
  const cvvEl = await waitForElement('[data-smoothr-card-cvc]')
  const postalEl = await waitForElement('[data-smoothr-bill-postal]')
  if (!numEl || !expEl || !cvvEl || !postalEl) {
    console.warn('[NMI] Missing card or billing placeholder elements')
    return
  }

  // Attach the key so Collect.js can bootstrap iframes
  ;[numEl, expEl, cvvEl].forEach(el =>
    el.setAttribute('data-tokenization-key', tokenizationKey)
  )

  // Visible card-number input
  const numInput = numEl.querySelector('input') || document.createElement('input')
  numInput.setAttribute('data-collect', 'cardNumber')
  if (!numInput.isConnected) numEl.appendChild(numInput)

  // Visible CVC input
  const cvvInput = cvvEl.querySelector('input') || document.createElement('input')
  cvvInput.setAttribute('data-collect', 'cvv')
  if (!cvvInput.isConnected) cvvEl.appendChild(cvvInput)

  // Visible billing-postal input
  const postalInput =
    postalEl.querySelector('input') || document.createElement('input')
  postalInput.setAttribute('data-collect', 'postal')
  if (!postalInput.isConnected) postalEl.appendChild(postalInput)

  // Expiry listener: only inject hidden month/year when valid
  const expiryInput = expEl.querySelector('input')
  expiryInput.addEventListener('keyup', e => {
    const [mon, yr] = parseExpiry(e.target.value)
    if (mon && yr) {
      syncHiddenExpiryFields(expEl, mon, yr)
    } else {
      expEl
        .querySelectorAll(
          'input[data-collect="expMonth"],input[data-collect="expYear"]'
        )
        .forEach(i => i.remove())
    }
  })

  // Load Collect.js if needed
  if (!window.CollectJS) {
    const script = document.createElement('script')
    script.src = 'https://secure.nmi.com/token/Collect.js'
    script.setAttribute('data-tokenization-key', tokenizationKey)
    script.async = true
    document.head.appendChild(script)
    await new Promise(resolve => script.addEventListener('load', resolve))
  }

  // Configure inline fields
  window.CollectJS.configure({
    variant: 'inline',
    fields: {
      ccnumber: { selector: '[data-smoothr-card-number] input' },
      ccexp: { selector: '[data-smoothr-card-expiry] input' },
      cvv: { selector: '[data-smoothr-card-cvc] input' }
    }
  })
}

// Legacy alias
export const mountNMI = mountCardFields

/** Returns true once the hidden expiry & visible inputs are in place */
export function isMounted() {
  return (
    !!document.querySelector('input[data-collect="cardNumber"]') &&
    !!document.querySelector('input[data-collect="cvv"]') &&
    !!document.querySelector('input[data-collect="expMonth"]') &&
    !!document.querySelector('input[data-collect="expYear"]')
  )
}

/** Signals readiness for tokenization */
export function ready() {
  return isMounted()
}

/**
 * Tokenizes the card.
 * Returns { payment_method: { payment_token } } or { error, payment_method: null }.
 */
export async function createPaymentMethod() {
  console.log('[NMI] createPaymentMethod started')
  // guard if Collect.js hasn't loaded or hasn't exposed tokenize()
  if (!window.CollectJS || typeof window.CollectJS.tokenize !== 'function') {
    console.log('[NMI] Collect.js not ready')
    return { error: { message: 'Collect.js not ready' }, payment_method: null }
  }

  // grab month/year from the hidden inputs
  const mon = document.querySelector('input[data-collect="expMonth"]')?.value
  const yr = document.querySelector('input[data-collect="expYear"]')?.value

  return new Promise(resolve => {
    window.CollectJS.tokenize({ expMonth: mon, expYear: yr }, response => {
      console.log('[NMI] tokenize response', response)
      if (response && response.token) {
        resolve({ error: null, payment_method: { payment_token: response.token } })
      } else {
        resolve({
          error: { message: response?.error || 'Tokenization failed' },
          payment_method: null
        })
      }
    })
  })
}

// Default export for your gateway dispatcher
export default {
  mountCardFields,
  mountNMI,
  isMounted,
  ready,
  createPaymentMethod
}

// Expose legacy hook
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  window.Smoothr.mountNMIFields = mountCardFields
}
