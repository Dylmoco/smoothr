export async function initCheckout(...args) {
  const mod = await import('../../checkout/checkout.js');
  return mod.initCheckout(...args);
}
