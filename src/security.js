/**
 * Security utilities for AutoChat Enhanced
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;

  // Remove any existing HTML tags except allowed ones
  return div.innerHTML;
}

/**
 * Validate message content
 * @param {string} message - Message to validate
 * @returns {object} - Validation result
 */
export function validateMessage(message) {
  const errors = [];

  if (typeof message !== 'string') {
    errors.push('Message must be a string');
  }

  if (message.length === 0) {
    errors.push('Message cannot be empty');
  }

  if (message.length > 5000) {
    errors.push('Message too long (max 5000 characters)');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      errors.push('Message contains suspicious content');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitizeHTML(message),
  };
}

/**
 * Validate settings object structure
 * @param {object} settings - Settings to validate
 * @returns {object} - Validation result
 */
export function validateSettings(settings) {
  const errors = [];
  const validSettings = {};

  // Validate message list
  if ('messageList' in settings) {
    if (typeof settings.messageList !== 'string') {
      errors.push('messageList must be a string');
    } else {
      validSettings.messageList = settings.messageList;
    }
  }

  // Validate send mode
  if ('sendMode' in settings) {
    if (!['random', 'sequential'].includes(settings.sendMode)) {
      errors.push('sendMode must be "random" or "sequential"');
    } else {
      validSettings.sendMode = settings.sendMode;
    }
  }

  // Validate intervals
  if ('minInterval' in settings) {
    const val = parseInt(settings.minInterval);
    if (isNaN(val) || val < 1 || val > 3600) {
      errors.push('minInterval must be between 1 and 3600');
    } else {
      validSettings.minInterval = val;
    }
  }

  if ('maxInterval' in settings) {
    const val = parseInt(settings.maxInterval);
    if (isNaN(val) || val < 1 || val > 3600) {
      errors.push('maxInterval must be between 1 and 3600');
    } else {
      validSettings.maxInterval = val;
    }
  }

  // Validate daily limit
  if ('dailyLimit' in settings) {
    const val = parseInt(settings.dailyLimit);
    if (isNaN(val) || val < 0 || val > 10000) {
      errors.push('dailyLimit must be between 0 and 10000');
    } else {
      validSettings.dailyLimit = val;
    }
  }

  // Validate boolean settings
  const booleanSettings = [
    'typingSimulation',
    'variableDelays',
    'antiRepetition',
    'templateVariables',
    'activeHours',
  ];

  for (const key of booleanSettings) {
    if (key in settings) {
      if (typeof settings[key] !== 'boolean') {
        errors.push(`${key} must be a boolean`);
      } else {
        validSettings[key] = settings[key];
      }
    }
  }

  // Validate active hours
  if ('activeHoursStart' in settings) {
    const val = parseInt(settings.activeHoursStart);
    if (isNaN(val) || val < 0 || val > 23) {
      errors.push('activeHoursStart must be between 0 and 23');
    } else {
      validSettings.activeHoursStart = val;
    }
  }

  if ('activeHoursEnd' in settings) {
    const val = parseInt(settings.activeHoursEnd);
    if (isNaN(val) || val < 0 || val > 23) {
      errors.push('activeHoursEnd must be between 0 and 23');
    } else {
      validSettings.activeHoursEnd = val;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validated: validSettings,
  };
}

/**
 * Rate limiter to prevent abuse
 */
export class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  /**
   * Check if action is allowed
   * @returns {boolean} - True if allowed
   */
  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.timeWindow);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   * @returns {number} - Number of remaining requests
   */
  getRemaining() {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Reset the rate limiter
   */
  reset() {
    this.requests = [];
  }
}

/**
 * Content Security Policy validator
 * @param {string} content - Content to validate
 * @returns {boolean} - True if safe
 */
export function validateCSP(content) {
  // Check for inline scripts
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
}
