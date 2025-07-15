export function handleSuccessRedirect(res, data) {
  if (res.ok && data.success) {
    Smoothr?.cart?.clearCart?.();
    window.location.href = '/checkout-success';
  }
}
