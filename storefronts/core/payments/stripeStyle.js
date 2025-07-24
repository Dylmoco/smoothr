import { rgbToHex } from '../../../shared/utils/color.js';
import { loadGoogleFont } from '../../../shared/utils/fonts.js';

export function buildStripeElementStyle(targetEl, placeholderSelector, defaultPlaceholder) {
  const placeholderEl = targetEl.querySelector(placeholderSelector);
  const fieldStyle = window.getComputedStyle(targetEl);
  let placeholderStyle;
  if (placeholderEl) {
    placeholderStyle = window.getComputedStyle(placeholderEl);
  } else {
    const emailInput = document.querySelector('[data-smoothr-email]');
    if (emailInput) {
      placeholderStyle = window.getComputedStyle(emailInput, '::placeholder');
    } else {
      placeholderStyle = fieldStyle;
    }
  }
  const placeholderColorHex = rgbToHex(placeholderStyle.color);
  const fontFamilyClean = (placeholderStyle.fontFamily || fieldStyle.fontFamily)
    .split(',')[0]
    .trim()
    .replace(/"/g, '');
  loadGoogleFont(fontFamilyClean);
  const style = {
    base: {
      backgroundColor: 'transparent',
      color: fieldStyle.color,
      fontFamily: fieldStyle.fontFamily,
      fontSize: fieldStyle.fontSize,
      fontStyle: fieldStyle.fontStyle,
      fontWeight: fieldStyle.fontWeight,
      letterSpacing: fieldStyle.letterSpacing,
      lineHeight: fieldStyle.lineHeight,
      textAlign: fieldStyle.textAlign,
      textShadow: fieldStyle.textShadow,
      '::placeholder': {
        color: placeholderColorHex,
        fontFamily: placeholderStyle.fontFamily,
        fontSize: placeholderStyle.fontSize,
        fontStyle: placeholderStyle.fontStyle,
        fontWeight: placeholderStyle.fontWeight,
        letterSpacing: placeholderStyle.letterSpacing,
        lineHeight: placeholderStyle.lineHeight,
        textAlign: placeholderStyle.textAlign
      }
    },
    invalid: {
      color: '#fa755a'
    }
  };
  const debug = window.SMOOTHR_CONFIG?.debug;
  if (debug) console.log('[Smoothr Stripe] style built for', placeholderSelector);
  return style;
}
