export async function computeCartHash(cart, total, email) {
  const normalized = [...cart]
    .map(item => ({ id: item.product_id, qty: item.quantity }))
    .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  const input = `${email}-${total}-${JSON.stringify(normalized)}`;
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function disableButton(btn) {
  if (btn && 'disabled' in btn) btn.disabled = true;
}

export function enableButton(btn) {
  if (btn && 'disabled' in btn) btn.disabled = false;
}
