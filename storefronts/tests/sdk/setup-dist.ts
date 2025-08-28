// JSDOM polyfills if needed
Object.defineProperty(window, 'crypto', {
  value: { getRandomValues: (arr: any) => crypto.getRandomValues(arr) },
  configurable: true,
});
