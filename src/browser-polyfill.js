/**
 * Browser API Polyfill
 * Ensures compatibility between Chrome and Firefox
 */

// Use browser namespace if available (Firefox), otherwise use chrome (Chrome)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Export unified API
if (typeof window !== 'undefined') {
  window.browserAPI = browserAPI;
}

// For Node.js environments (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = browserAPI;
}
