update_file storefronts/checkout/gateways/nmi.js << 'EOF'
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

// Ensure hidden month/year inputs exist under the expiry container
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
  tokenizationKey = await resolveTokenizationKey()
  if (!tokenizationKey) {
    console.warn('[NMI] Tokenization key missing')
    return
  }
  hasMounted = true

  // Wait for your placeholder elements to exist
  const numEl = await waitForElement('[data-smoothr-card-number]')
  const expEl = await waitForElement('[data-smoothr-card-expiry]')
  const cvvEl = await waitForElement('[data-smoothr-card-cvc]')
  if (!numEl || !expEl || !cvvEl) {
    console.warn('[NMI] Missing card placeholder elements')
    return
  }

  // Attach the key so Collect.js can bootstrap iframes
  [numEl, expEl, cvvEl].forEach(el =>
    el.setAttribute('data-tokenization-key', tokenizationKey)
  )

  // Set up hidden expiry inputs & listener
  syncHiddenExpiryFields(expEl, '', '')
  expEl.addEventListener('keyup', e => {
    const [mon, yr] = parseExpiry(e.target.value)
    if (mon && yr) syncHiddenExpiryFields(expEl, mon, yr)
    else
      expEl
        .querySelectorAll(
          'input[data-collect="expMonth"],input[data-collect="expYear"]'
        )
        .forEach(i => i.remove())
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

  // Configure Collect.js for inline fields (no built-in click handler)
  window.CollectJS.configure({
    variant: 'inline',
    fields: {
      ccnumber: { selector: '[data-smoothr-card-number]' },
      ccexp: { selector: '[data-smoothr-card-expiry]' },
      cvv: { selector: '[data-smoothr-card-cvc]' }
    }
  })
}

/** Returns true once the Collect.js fields & iframes are in place */
export function isMounted() {
  return (
    !!window.CollectJS &&
    !!document.querySelector('input[data-collect="cardNumber"]') &&
    !!document.querySelector('input[data-collect="cvv"]') &&
    !!document.querySelector('input[data-collect="expMonth"]') &&
    !!document.querySelector('input[data-collect="expYear"]') &&
    !!document.querySelector('[data-smoothr-card-number] iframe') &&
    !!document.querySelector('[data-smoothr-card-expiry] iframe') &&
    !!document.querySelector('[data-smoothr-card-cvc] iframe')
  )
}

/** Signals readiness of the fields for tokenization */
export function ready() {
  return isMounted()
}

/**
 * Tokenizes the card. Called by the shared checkout click-handler.
 * Returns { payment_method: { payment_token } } or { error, payment_method: null }.
 */
export async function createPaymentMethod() {
  if (!ready()) {
    return { error: { message: 'Collect.js not ready' }, payment_method: null }
  }

  // Pull expiry from hidden fields
  const mon = document.querySelector('input[data-collect="expMonth"]').value
  const yr = document.querySelector('input[data-collect="expYear"]').value

  return new Promise(resolve => {
    window.CollectJS.tokenize({ expMonth: mon, expYear: yr }, response => {
      if (response && response.token) {
        resolve({ error: null, payment_method: { payment_token: response.token } })
      } else {
        resolve({
          error: { message: response.error || 'Tokenization failed' },
          payment_method: null
        })
      }
    })
  })
}

// Default export for the gatewayDispatcher
export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
}

// Expose legacy hook if any adapter expects it
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  window.Smoothr.mountNMIFields = mountCardFields
}
EOF
