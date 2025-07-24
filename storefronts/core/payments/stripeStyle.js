export default function buildStripeElementStyle(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return { base: {}, '::placeholder': {} };
  }
  const cs = window.getComputedStyle(el);
  const placeholder = window.getComputedStyle(el, '::placeholder');
  const style = {
    base: {
      color: cs.color,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontStyle: cs.fontStyle,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      textAlign: cs.textAlign,
      textShadow: cs.textShadow,
      borderColor: cs.borderColor,
      borderWidth: cs.borderWidth,
      borderStyle: cs.borderStyle,
      borderRadius: cs.borderRadius,
      padding: cs.padding
    },
    '::placeholder': {
      color: placeholder.color,
      fontFamily: placeholder.fontFamily,
      fontSize: placeholder.fontSize,
      fontStyle: placeholder.fontStyle,
      fontWeight: placeholder.fontWeight,
      letterSpacing: placeholder.letterSpacing,
      textAlign: placeholder.textAlign
    }
  };

  delete style.base.borderColor;
  delete style.base.borderWidth;
  delete style.base.borderStyle;
  delete style.base.borderRadius;
  delete style.base.padding;

  const allowed = [
    'color',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontWeight',
    'letterSpacing',
    'textAlign',
    'textShadow'
  ];
  Object.keys(style.base).forEach(key => {
    if (!allowed.includes(key)) delete style.base[key];
  });
  Object.keys(style['::placeholder']).forEach(key => {
    if (!allowed.includes(key)) delete style['::placeholder'][key];
  });

  return style;
}
