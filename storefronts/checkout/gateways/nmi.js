// src/checkout/gateways/nmi.js

import { resolveTokenizationKey } from '../providers/nmi.js'
import { handleSuccessRedirect }   from '../utils/handleSuccessRedirect.js'

let hasMounted   = false
let isConfigured = false
let isLocked     = false

/**
 * Public entry: fetch your tokenization key then kick off the init logic.
 */
export async function mountCardFields() {
  if (hasMounted) return
  hasMounted = true

  const storeId =
    typeof window !== 'undefined' && window.Smoothr
      ? window.Smoothr.store_id
      : undefined

  const tokenizationKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenizationKey) {
    console.warn('[NMI] Tokenization key missing')
    return
  }

  initNMI(tokenizationKey)
}

/**
 * Load NMI’s Collect.js and configure.
 */
export function initNMI(tokenizationKey) {
  console.log('[NMI] Attempting to mount NMI fields...')
  if (isConfigured) {
    console.log('[NMI] already configured, skipping')
    return
  }

  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.setAttribute('data-tokenization-key', tokenizationKey)
  console.log(
    '[NMI] Set data-tokenization-key on script tag:',
    tokenizationKey.substring(0, 8) + '…'
  )
  // original async behavior
  script.async = true
  document.head.appendChild(script)

  script.onload = () => {
    console.log('[NMI] CollectJS script loaded.')
    configureCollectJS()
  }
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS script.')
  }
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
    // Get styles from the placeholder div
    const cardNumberDiv = document.querySelector('[data-smoothr-card-number]');
    const divStyle = getComputedStyle(cardNumberDiv);

    const customCss = {
      'background-color': 'transparent',
      'border': 'none',
      'box-shadow': 'none',
      'padding': '0',
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
      'height': '100%'
    };

    CollectJS.configure({
      variant: 'inline',
      paymentSelector: '[data-smoothr-pay]',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]' },
        ccexp:    { selector: '[data-smoothr-card-expiry]' },
        cvv:      { selector: '[data-smoothr-card-cvc]' }
      },
      customCss: customCss,
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available, ready to tokenize')
      },
      callback(response) {
        console.log('[NMI] Tokenization response:', response)
        if (!response.token) {
          console.log('[NMI] Failed:', response.reason)
          isLocked = false
          return
        }

        console.log('[NMI] Success, token:', response.token)
        console.log(
          '[NMI] Sending POST with store_id:',
          window.SMOOTHR_CONFIG.storeId
        )

        // Gather form + cart data
        const firstName   = document.querySelector('[data-smoothr-first-name]')?.value  || ''
        const lastName    = document.querySelector('[data-smoothr-last-name]')?.value   || ''
        const email       = document.querySelector('[data-smoothr-email]')?.value       || ''
        const shipLine1   = document.querySelector('[data-smoothr-ship-line1]')?.value  || ''
        const shipLine2   = document.querySelector('[data-smoothr-ship-line2]')?.value  || ''
        const shipCity    = document.querySelector('[data-smoothr-ship-city]')?.value   || ''
        const shipState   = document.querySelector('[data-smoothr-ship-state]')?.value  || ''
        const shipPostal  = document.querySelector('[data-smoothr-ship-postal]')?.value || ''
        const shipCountry = document.querySelector('[data-smoothr-ship-country]')?.value|| ''

        const amountEl = document.querySelector('[data-smoothr-total]')
        const amount   = amountEl
          ? Math.round(parseFloat(amountEl.textContent.replace(/[^0-9.]/g, '')) * 100)
          : 0

        const currency = window.SMOOTHR_CONFIG.baseCurrency || 'GBP'

        const cartData  = window.Smoothr.cart.getCart() || {}
        const cartItems = Array.isArray(cartData.items) ? cartData.items : []
        const cart = cartItems.map(item => ({
          product_id: item.id   || 'unknown',
          name:       item.name,
          quantity:   item.quantity,
          price:      Math.round((item.price ?? 0) * 100)
        }))
        if (cart.length === 0) {
          console.error('[NMI] Cart is empty')
          isLocked = false
          return
        }

        // Send to your backend
        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_token: response.token,
            store_id:      window.SMOOTHR_CONFIG.storeId,
            first_name:    firstName,
            last_name:     lastName,
            email:         email,
            shipping: {
              name: `${firstName} ${lastName}`.trim(),
              address: {
                line1:       shipLine1,
                line2:       shipLine2,
                city:        shipCity,
                state:       shipState,
                postal_code: shipPostal,
                country:     shipCountry
              }
            },
            cart,
            total:    amount,
            currency: currency
          })
        })
          .then(res =>
            res.json().then(data => {
              console.log('[NMI] Backend response:', data)
              handleSuccessRedirect(res, data)
              isLocked = false
            })
          )
          .catch(error => {
            console.error('[NMI] POST error:', error)
            isLocked = false
          })
      }
    })

    isConfigured = true
    console.log('[NMI] CollectJS configured successfully')
  } catch (error) {
    console.error('[NMI] Error configuring CollectJS:', error)
    isLocked = false
  }
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