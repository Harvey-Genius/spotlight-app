// Detect whether we're running inside a Chrome extension context
// Use protocol check as the primary detection — it's the most reliable
export const isExtension =
  typeof window !== 'undefined' &&
  window.location.protocol === 'chrome-extension:'

export const isPopup = isExtension
