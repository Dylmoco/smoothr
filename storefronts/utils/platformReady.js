export async function platformReady() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
}
