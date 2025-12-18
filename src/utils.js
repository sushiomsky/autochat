/**
 * Utility functions for AutoChat Enhanced
 */

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
export function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate JSON structure
 * @param {object} data - Data to validate
 * @param {Array<string>} requiredKeys - Required keys
 * @returns {boolean} - True if valid
 */
export function validateSettings(data, requiredKeys = []) {
  if (typeof data !== 'object' || data === null) return false;
  return requiredKeys.every((key) => key in data);
}

/**
 * Deep clone object
 * @param {object} obj - Object to clone
 * @returns {object} - Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get current timestamp in readable format
 * @returns {string} - Formatted timestamp
 */
export function getTimestamp() {
  return new Date().toLocaleString();
}

/**
 * Calculate average messages per day
 * @param {number} total - Total messages
 * @param {number} days - Number of days
 * @returns {number} - Average per day
 */
export function calculateAverage(total, days) {
  return days > 0 ? Math.round(total / days) : 0;
}

/**
 * Export data as JSON file
 * @param {object} data - Data to export
 * @param {string} filename - Filename
 */
export function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import JSON file
 * @returns {Promise<object>} - Parsed JSON data
 */
export function importJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (err) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Rate limiter class to prevent abuse
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Unique identifier for the action
   * @returns {boolean} - True if allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter((timestamp) => now - timestamp < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  /**
   * Reset attempts for a key
   * @param {string} key - Unique identifier
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Get remaining attempts
   * @param {string} key - Unique identifier
   * @returns {number} - Remaining attempts
   */
  getRemainingAttempts(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter((timestamp) => now - timestamp < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Get time until next attempt allowed (in ms)
   * @param {string} key - Unique identifier
   * @returns {number} - Milliseconds until next attempt
   */
  getTimeUntilReset(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;

    const oldestAttempt = Math.min(...userAttempts);
    return Math.max(0, this.windowMs - (now - oldestAttempt));
  }
}
