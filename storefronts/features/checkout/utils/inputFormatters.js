export default function bindCardInputs() {
  const numberInput =
    document.querySelector('[data-smoothr-card-number] input') ||
    document.querySelector('[data-smoothr-card-number]');
  const expiryInput =
    document.querySelector('[data-smoothr-card-expiry] input') ||
    document.querySelector('[data-smoothr-card-expiry]');
  const cvcInput =
    document.querySelector('[data-smoothr-card-cvc] input') ||
    document.querySelector('[data-smoothr-card-cvc]');

  if (numberInput && typeof numberInput.addEventListener === 'function') {
    numberInput.addEventListener('input', () => {
      let val = numberInput.value.replace(/\D/g, '').slice(0, 16);
      val = val.replace(/(.{4})/g, '$1 ').trim();
      numberInput.value = val;
    });
  }

  if (expiryInput && typeof expiryInput.addEventListener === 'function') {
    expiryInput.addEventListener('input', () => {
      let val = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
      expiryInput.value = val;
    });
  }

  if (cvcInput && typeof cvcInput.addEventListener === 'function') {
    cvcInput.addEventListener('input', () => {
      cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }
}
