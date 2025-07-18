// src/checkout/gateways/nmi.js

import { resolveTokenizationKey } from '../providers/nmi.js'
import { handleSuccessRedirect }   from '../utils/handleSuccessRedirect.js'

let hasMounted   = false
let isConfigured = false
let isLocked     = false

function rgbToHex(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

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
    alert('Payment setup issue. Please try again or contact support.')
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

  // Get styles early for script attributes
  const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
  const divStyle = getComputedStyle(cardNumberDiv)

  const emailInput = document.querySelector('[data-smoothr-email]')
  let placeholderStyle;
  if (emailInput) {
    placeholderStyle = getComputedStyle(emailInput, '::placeholder')
    // Log the pulled styles for debugging
    console.log('[NMI] Placeholder color:', placeholderStyle.color)
    console.log('[NMI] Placeholder font-family:', placeholderStyle.fontFamily)
    console.log('[NMI] Placeholder font-size:', placeholderStyle.fontSize)
    console.log('[NMI] Placeholder opacity:', placeholderStyle.opacity)
    console.log('[NMI] Placeholder font-weight:', placeholderStyle.fontWeight)
  } else {
    console.warn('[NMI] Email input not found, falling back to original placeholder style')
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector(
      '[data-smoothr-card-placeholder]'
    )
    placeholderStyle = cardNumberPlaceholderEl ? getComputedStyle(cardNumberPlaceholderEl) : divStyle
  }

  // Convert to hex and use raw font-weight
  const placeholderColorHex = rgbToHex(placeholderStyle.color)
  console.log('[NMI] Placeholder color hex:', placeholderColorHex)
  const placeholderFontWeight = placeholderStyle.fontWeight

  // Extract main font name for dynamic loading (e.g., "Montserrat" from "Montserrat, sans-serif")
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
  script.setAttribute('data-tokenization-key', tokenizationKey)
  script.setAttribute('data-custom-css', JSON.stringify(customCssObj))
  script.setAttribute('data-placeholder-css', JSON.stringify(placeholderCssObj))
  script.setAttribute('data-style-sniffer', 'true')
  script.setAttribute('data-google-font', googleFontString)
  console.log(
    '[NMI] Set data-tokenization-key on script tag:',
    tokenizationKey.substring(0, 8) + '…'
  )
  // original async behavior
  script.async = true

  script.onload = () => {
    console.log('[NMI] CollectJS script loaded.')
    configureCollectJS()
  }
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS script.')
    alert('Unable to load payment system. Please refresh the page.')
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
    // Get styles from the placeholder div
    const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
    const divStyle = getComputedStyle(cardNumberDiv)

    // Get placeholder info from Webflow elements with custom attributes
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector(
      '[data-smoothr-card-placeholder]'
    )
    const expiryPlaceholderEl = document.querySelector(
      '[data-smoothr-card-expiry] [data-smoothr-expiry-placeholder]'
    )
    const cvcPlaceholderEl = document.querySelector(
      '[data-smoothr-card-cvc] [data-smoothr-cvv-placeholder]'
    )

    const cardNumberPlaceholderText = cardNumberPlaceholderEl
      ? cardNumberPlaceholderEl.textContent.trim()
      : 'Card Number'
    const expiryPlaceholderText = expiryPlaceholderEl
      ? expiryPlaceholderEl.textContent.trim()
      : 'MM/YY'
    const cvcPlaceholderText = cvcPlaceholderEl
      ? cvcPlaceholderEl.textContent.trim()
      : 'CVC'

    CollectJS.configure({
      variant: 'inline',
      paymentSelector: '[data-smoothr-pay]',
      fields: {
        ccnumber: { 
          selector:    '[data-smoothr-card-number]',
          placeholder: cardNumberPlaceholderText
        },
        ccexp: { 
          selector:    '[data-smoothr-card-expiry]',
          placeholder: expiryPlaceholderText
        },
        cvv: { 
          selector:    '[data-smoothr-card-cvc]',
          placeholder: cvcPlaceholderText
        }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available, ready to tokenize')
        // Style the iframes directly and force height
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
        // Hide your Webflow placeholder DIVs
        ;[cardNumberPlaceholderEl, expiryPlaceholderEl, cvcPlaceholderEl].forEach(
          el => el && (el.style.display = 'none')
        )
      },
      callback(response) {
        console.log('[NMI] Tokenization response:', response)
        if (!response.token) {
          console.log('[NMI] Failed:', response.reason)
          alert('Payment failed: ' + (response.reason || 'Unknown error. Try again.'))
          isLocked = false
          return
        }

        console.log('[NMI] Success, token:', response.token)
        console.log(
          '[NMI] Sending POST with store_id:',
          window.SMOOTHR_CONFIG.storeId
        )

        // Gather form + cart data
        const firstName   = document.querySelector('[data-smoothr-first-name]')?.value   || ''
        const lastName    = document.querySelector('[data-smoothr-last-name]')?.value    || ''
        const email       = document.querySelector('[data-smoothr-email]')?.value        || ''
        const shipLine1   = document.querySelector('[data-smoothr-ship-line1]')?.value   || ''
        const shipLine2   = document.querySelector('[data-smoothr-ship-line2]')?.value   || ''
        const shipCity    = document.querySelector('[data-smoothr-ship-city]')?.value    || ''
        const shipState   = document.querySelector('[data-smoothr-ship-state]')?.value   || ''
        const shipPostal  = document.querySelector('[data-smoothr-ship-postal]')?.value  || ''
        const shipCountry = document.querySelector('[data-smoothr-ship-country]')?.value || ''

        // Check if billing same as shipping
        const sameBillingElem = document.querySelector('[data-smoothr-billing-same-as-shipping]:checked')
        const sameBilling = !!sameBillingElem

        let billLine1   = sameBilling ? shipLine1   : document.querySelector('[data-smoothr-bill-line1]')?.value   || ''
        let billLine2   = sameBilling ? shipLine2   : document.querySelector('[data-smoothr-bill-line2]')?.value   || ''
        let billCity    = sameBilling ? shipCity    : document.querySelector('[data-smoothr-bill-city]')?.value    || ''
        let billState   = sameBilling ? shipState   : document.querySelector('[data-smoothr-bill-state]')?.value   || ''
        let billPostal  = sameBilling ? shipPostal  : document.querySelector('[data-smoothr-bill-postal]')?.value  || ''
        let billCountry = sameBilling ? shipCountry : document.querySelector('[data-smoothr-bill-country]')?.value || ''

        const amountEl = document.querySelector('[data-smoothr-total]')
        let amount = 0
        if (amountEl) {
          const cleanText = amountEl.textContent.trim().replace(/[^0-9.]/g, '')
          const parsed = parseFloat(cleanText)
          if (!isNaN(parsed)) {
            amount = Math.round(parsed * 100)
          } else {
            console.error('[NMI] Invalid total amount')
            alert('Issue with order total. Please refresh.')
            isLocked = false
            return
          }
        } else {
          console.error('[NMI] Total element missing')
          alert('Order total not found. Please try again.')
          isLocked = false
          return
        }

        const currency = window.SMOOTHR_CONFIG.baseCurrency || 'GBP'

        const cartData  = window.Smoothr.cart.getCart() || {}
        const cartItems = Array.isArray(cartData.items) ? cartData.items : []
        const cart = cartItems.map(item => ({
          product_id: item.id   || 'unknown',
          name:       item.name,
          quantity:   item.quantity,
          price:      Math.round(item.price ?? 0)  // Removed *100, assuming prices already in cents
        }))
        if (cart.length === 0) {
          console.error('[NMI] Cart is empty')
          alert('Your cart is empty. Add items to proceed.')
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
            billing: {
              name: `${firstName} ${lastName}`.trim(),
              address: {
                line1:       billLine1,
                line2:       billLine2,
                city:        billCity,
                state:       billState,
                postal_code: billPostal,
                country:     billCountry
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
            alert('Payment processing error. Please try again.')
            isLocked = false
          })
      }
    })

    isConfigured = true
    console.log('[NMI] CollectJS configured successfully')
  } catch (error) {
    console.error('[NMI] Error configuring CollectJS:', error)
    alert('Setup error. Refresh the page or contact support.')
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