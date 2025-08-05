// Placeholder Webflow adapter for Smoothr SDK.
// Provides no-op lifecycle hooks that can be expanded with platform-specific logic.

export async function platformReady() {}
export async function domReady() {}
export function observeDOMChanges() {}

export default { platformReady, domReady, observeDOMChanges };
