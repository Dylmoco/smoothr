import computedInputStyle from './computedInputStyle.js';

let iframeStylesApplied = false;

export function applyAcceptIframeStyles() {
  if (iframeStylesApplied || typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const frames = [
      ['[data-smoothr-card-number] input', 'iframe[data-accept-id][name=cardNumber]'],
      ['[data-smoothr-card-expiry] input', 'iframe[data-accept-id][name=expiry]'],
      ['[data-smoothr-card-cvc] input', 'iframe[data-accept-id][name=cvv]']
    ];
    let styled = 0;
    frames.forEach(([inputSel, frameSel]) => {
      const input = document.querySelector(inputSel);
      const frame = document.querySelector(frameSel);
      if (input && frame && !frame.dataset.smoothrStyled) {
        const cs = window.getComputedStyle(input);
        for (const prop of cs) {
          frame.style[prop] = cs.getPropertyValue(prop);
        }
        frame.dataset.smoothrStyled = 'true';
        console.log(`[Smoothr AuthorizeNet] Applied inline styles to ${frameSel}`);
      }
      if (frame?.dataset.smoothrStyled) styled++;
    });
    if (styled === frames.length || ++attempts >= 20) {
      iframeStylesApplied = styled === frames.length;
      clearInterval(interval);
    }
  }, 100);
}

export function getAuthorizeNetStyles(num, exp, cvc) {
  const numStyle = computedInputStyle(num);
  const expStyle = computedInputStyle(exp);
  const cvcStyle = computedInputStyle(cvc);

  const numInput = num?.querySelector('input');
  const expInput = exp?.querySelector('input');
  const cvcInput = cvc?.querySelector('input');

  if (numInput) Object.assign(numInput.style, numStyle.input);
  if (expInput) Object.assign(expInput.style, expStyle.input);
  if (cvcInput) Object.assign(cvcInput.style, cvcStyle.input);

  console.log('[Authorize.Net] cardNumber style', numStyle);
  console.log('[Authorize.Net] cardExpiry style', expStyle);
  console.log('[Authorize.Net] cardCVC style', cvcStyle);

  return { numStyle, expStyle, cvcStyle };
}
