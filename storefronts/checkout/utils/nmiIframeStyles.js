export function rgbToHex(rgb) {
  if (typeof rgb !== 'string') return rgb;
  const parts = rgb.match(/\d+/g);
  if (!parts || parts.length < 3) return rgb;
  const [r, g, b] = parts.map(Number);
  return (
    `#${r.toString(16).padStart(2, '0')}` +
    `${g.toString(16).padStart(2, '0')}` +
    `${b.toString(16).padStart(2, '0')}`
  );
}

export function getNmiStyles() {
  const cardNumberDiv = document.querySelector('[data-smoothr-card-number]');
  const divStyle = getComputedStyle(cardNumberDiv);
  const emailInput = document.querySelector('[data-smoothr-email]');
  let placeholderStyle;
  if (emailInput) {
    placeholderStyle = getComputedStyle(emailInput, '::placeholder');
  } else {
    console.warn(
      '[NMI] Email input not found, falling back to original placeholder style'
    );
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector(
      '[data-smoothr-card-placeholder]'
    );
    placeholderStyle = cardNumberPlaceholderEl
      ? getComputedStyle(cardNumberPlaceholderEl)
      : divStyle;
  }
  const placeholderColorHex = rgbToHex(placeholderStyle.color);
  console.log('[NMI] Placeholder color hex:', placeholderColorHex);
  const placeholderFontWeight = placeholderStyle.fontWeight;
  const fontFamily = placeholderStyle.fontFamily
    .split(',')[0]
    .trim()
    .replace(/"/g, '');
  const googleFontString = `${fontFamily}:100,200,300,400,500,600,700,800,900`;
  console.log('[NMI] Dynamic Google font:', googleFontString);

  const customCssObj = {
    'background-color': 'transparent',
    border: 'none',
    'box-shadow': 'none',
    margin: '0',
    color: divStyle.color,
    'font-family': divStyle.fontFamily,
    'font-size': divStyle.fontSize,
    'font-style': divStyle.fontStyle,
    'font-weight': divStyle.fontWeight,
    'letter-spacing': divStyle.letterSpacing,
    'line-height': divStyle.lineHeight,
    'text-align': divStyle.textAlign,
    'text-shadow': divStyle.textShadow,
    width: '100%',
    height: divStyle.height,
    'min-height': divStyle.minHeight,
    'max-height': divStyle.maxHeight,
    'box-sizing': 'border-box',
    'padding-top': divStyle.paddingTop,
    'padding-right': divStyle.paddingRight,
    'padding-bottom': divStyle.paddingBottom,
    'padding-left': divStyle.paddingLeft,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'flex-start',
    outline: 'none',
    'vertical-align': 'middle'
  };

  const placeholderCssObj = {
    color: placeholderColorHex,
    'font-family': placeholderStyle.fontFamily,
    'font-size': placeholderStyle.fontSize,
    'font-style': placeholderStyle.fontStyle,
    'font-weight': placeholderFontWeight,
    'letter-spacing': placeholderStyle.letterSpacing,
    'line-height': placeholderStyle.lineHeight,
    'text-align': placeholderStyle.textAlign,
    opacity: placeholderStyle.opacity
  };

  return { customCssObj, placeholderCssObj, googleFontString };
}

export default function styleNmiIframes(cardNumberDiv, placeholders = []) {
  const iframes = document.querySelectorAll('iframe[id^="CollectJS"]');

  const emailEl = document.querySelector('[data-smoothr-email]');
  let focusBorder = '';
  let focusBoxShadow = '';
  let focusRadius = '';

  if (emailEl && typeof window.getComputedStyle === 'function') {
    const previous = document.activeElement;
    try {
      emailEl.focus();
      const cs = window.getComputedStyle(emailEl);
      focusBorder = cs.border;
      focusBoxShadow = cs.boxShadow;
      focusRadius = cs.borderRadius;
    } catch (_) {
      // noop
    } finally {
      previous?.focus?.();
      if (previous !== emailEl) emailEl.blur();
    }
  }

  iframes.forEach(iframe => {
    const container = iframe.parentElement;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = cardNumberDiv.offsetHeight + 'px';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';

    if (container && window.getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    iframe.addEventListener('focus', () => {
      if (container) {
        container.style.border = focusBorder || '1px solid transparent';
        container.style.boxShadow = focusBoxShadow || 'none';
        container.style.borderRadius = focusRadius || '';
      }
    });

    iframe.addEventListener('blur', () => {
      if (container) {
        container.style.border = 'none';
        container.style.boxShadow = 'none';
      }
    });
  });

  placeholders.forEach(el => el && (el.style.display = 'none'));
}
