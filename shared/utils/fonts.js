export function loadGoogleFont(fontFamily) {
  if (
    !fontFamily ||
    document.querySelector(`link[href*="fonts.googleapis.com/css2?family=${fontFamily}"]`)
  )
    return;
  const googleFontString = `${fontFamily}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${googleFontString}`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}
