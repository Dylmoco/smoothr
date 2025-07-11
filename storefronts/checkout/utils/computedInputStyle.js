export default function computedInputStyle(container) {
  if (!container || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return { input: {}, '::placeholder': {} };
  }
  const temp = document.createElement('input');
  temp.type = 'text';
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  temp.style.pointerEvents = 'none';
  container.appendChild(temp);

  const cStyle = window.getComputedStyle(container);
  const iStyle = window.getComputedStyle(temp);
  const placeholder = window.getComputedStyle(temp, '::placeholder');

  const style = {
    input: {
      fontSize: cStyle.fontSize || iStyle.fontSize,
      fontFamily: cStyle.fontFamily || iStyle.fontFamily,
      color: cStyle.color || iStyle.color,
      backgroundColor: cStyle.backgroundColor || iStyle.backgroundColor,
      borderColor: cStyle.borderColor || iStyle.borderColor,
      borderWidth: cStyle.borderWidth || iStyle.borderWidth,
      borderStyle: cStyle.borderStyle || iStyle.borderStyle,
      padding: cStyle.padding || iStyle.padding,
      borderRadius: cStyle.borderRadius || iStyle.borderRadius,
      width: cStyle.width || iStyle.width,
      height: cStyle.height || iStyle.height,
      lineHeight: cStyle.lineHeight || iStyle.lineHeight,
      letterSpacing: cStyle.letterSpacing || iStyle.letterSpacing,
      textAlign: cStyle.textAlign || iStyle.textAlign,
      fontWeight: cStyle.fontWeight || iStyle.fontWeight,
      fontStyle: cStyle.fontStyle || iStyle.fontStyle
    },
    '::placeholder': {
      color: placeholder.color
    }
  };

  container.removeChild(temp);

  return style;
}
