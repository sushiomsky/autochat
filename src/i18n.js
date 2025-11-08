/**
 * i18n.js - Internationalization module
 * Provides localization support using Chrome Extension i18n API
 */

class I18n {
  constructor() {
    this.currentLocale = chrome.i18n.getUILanguage();
    this.defaultLocale = 'en';
    this.supportedLocales = ['en', 'ur'];
    
    // Load user preference
    chrome.storage.local.get(['locale'], (data) => {
      if (data.locale && this.supportedLocales.includes(data.locale)) {
        this.currentLocale = data.locale;
      }
    });
  }

  /**
   * Get localized message
   * @param {string} key - Message key
   * @param {Array<string>} substitutions - Optional substitutions
   * @returns {string} Localized message
   */
  getMessage(key, substitutions = []) {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * Set locale
   * @param {string} locale - Locale code
   */
  setLocale(locale) {
    if (this.supportedLocales.includes(locale)) {
      this.currentLocale = locale;
      chrome.storage.local.set({ locale });
      return true;
    }
    return false;
  }

  /**
   * Check if locale is RTL (Right-to-Left)
   * @param {string} locale - Locale code (optional, uses current if not provided)
   * @returns {boolean} True if RTL
   */
  isRTL(locale = null) {
    const checkLocale = locale || this.currentLocale;
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.includes(checkLocale);
  }

  /**
   * Get all supported locales with names
   * @returns {Array<Object>} Array of locale objects
   */
  getSupportedLocales() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
    ];
  }

  /**
   * Localize DOM elements with data-i18n attribute
   * @param {HTMLElement} root - Root element (defaults to document.body)
   */
  localizePage(root = document.body) {
    // Set document direction for RTL languages
    if (this.isRTL()) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl');
    }

    // Localize elements with data-i18n attribute
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const substitutions = element.getAttribute('data-i18n-subs');
      const subs = substitutions ? JSON.parse(substitutions) : [];
      
      element.textContent = this.getMessage(key, subs);
    });

    // Localize placeholders
    const placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.getMessage(key);
    });

    // Localize titles
    const titles = root.querySelectorAll('[data-i18n-title]');
    titles.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.getMessage(key);
    });

    // Localize aria-labels
    const ariaLabels = root.querySelectorAll('[data-i18n-aria]');
    ariaLabels.forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.getMessage(key));
    });
  }

  /**
   * Format number according to locale
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    return new Intl.NumberFormat(this.currentLocale).format(num);
  }

  /**
   * Format date according to locale
   * @param {Date} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Get localized direction
   * @returns {string} 'rtl' or 'ltr'
   */
  getDirection() {
    return this.isRTL() ? 'rtl' : 'ltr';
  }
}

// Create singleton instance
const i18n = new I18n();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
