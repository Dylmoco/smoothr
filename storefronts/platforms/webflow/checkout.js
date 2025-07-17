export async function initCheckout() {
  const mod = await import('../../checkout/checkout.js');
  await mod.initCheckout();
}

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
});
