export function getResetRoute() {
  // Detect platform from loader or adapter
  const platform =
    (window.Smoothr && window.Smoothr.platform && window.Smoothr.platform.id) ||
    document.querySelector('#smoothr-sdk')?.getAttribute('platform') ||
    '';
  // Webflow has top-level pages (no nested /auth/*)
  if (String(platform).toLowerCase() === 'webflow') return '/reset-password';
  // default for others
  return '/auth/reset';
}
