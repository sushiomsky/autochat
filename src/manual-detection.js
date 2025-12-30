/* manual-detection.js — Manual Message Detection
   Detects when user manually sends a message and adjusts timers accordingly
*/

class ManualMessageDetector {
  constructor() {
    this.inputObserver = null;
    this.lastInputValue = '';
    this.isMonitoring = false;
    this.onManualSendCallback = null;
    this.detectionTimeout = null;
    this.recentAutomatedMessages = new Set(); // Track automated messages
  }

  /**
   * Start monitoring for manual sends
   * @param {string} inputSelector - CSS selector for input field
   * @param {Function} onManualSend - Callback when manual send detected
   */
  startMonitoring(inputSelector, onManualSend) {
    if (this.isMonitoring) {

      return;
    }

    const inputElement = document.querySelector(inputSelector);
    if (!inputElement) {
      console.warn('[ManualDetector] Input element not found:', inputSelector);
      return;
    }

    this.isMonitoring = true;
    this.inputSelector = inputSelector;
    this.onManualSendCallback = onManualSend;
    this.lastInputValue = this.getInputValue(inputElement);

    // Method 1: Monitor input value changes
    this.inputObserver = new MutationObserver((mutations) => {
      this.checkForManualSend();
    });

    // Observe the input element
    if (inputElement.contentEditable === 'true' ||
      inputElement.getAttribute('contenteditable') === 'true') {
      // ContentEditable element
      this.inputObserver.observe(inputElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } else {
      // Regular input/textarea - observe parent for value changes via attributes
      const parent = inputElement.parentElement;
      if (parent) {
        this.inputObserver.observe(parent, {
          childList: true,
          subtree: true
        });
      }
    }

    // Method 2: Listen for input events
    this.inputEventHandler = () => {
      this.scheduleCheck();
    };

    // Method 3: Listen for Enter key
    this.keydownHandler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Schedule check after Enter press
        this.scheduleCheck(500);
      }
    };

    // Method 4: Listen for click events (send button)
    this.clickHandler = () => {
      this.scheduleCheck(500);
    };

    inputElement.addEventListener('input', this.inputEventHandler);
    inputElement.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('click', this.clickHandler, true);


  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    if (this.inputObserver) {
      this.inputObserver.disconnect();
      this.inputObserver = null;
    }

    if (this.detectionTimeout) {
      clearTimeout(this.detectionTimeout);
      this.detectionTimeout = null;
    }

    const inputElement = document.querySelector(this.inputSelector);
    if (inputElement) {
      inputElement.removeEventListener('input', this.inputEventHandler);
      inputElement.removeEventListener('keydown', this.keydownHandler);
    }
    document.removeEventListener('click', this.clickHandler, true);

    this.isMonitoring = false;

  }

  /**
   * Schedule a check for manual send (debounced)
   */
  scheduleCheck(delay = 100) {
    if (this.detectionTimeout) {
      clearTimeout(this.detectionTimeout);
    }

    this.detectionTimeout = setTimeout(() => {
      this.checkForManualSend();
    }, delay);
  }

  /**
   * Check if a manual send occurred
   */
  checkForManualSend() {
    const inputElement = document.querySelector(this.inputSelector);
    if (!inputElement) return;

    const currentValue = this.getInputValue(inputElement);
    const previousValue = this.lastInputValue;

    // Check if input was cleared (likely sent)
    if (previousValue.length > 0 && currentValue.length === 0) {
      // Check if this was NOT an automated message
      if (!this.recentAutomatedMessages.has(previousValue.trim())) {


        if (this.onManualSendCallback) {
          this.onManualSendCallback({
            text: previousValue,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    this.lastInputValue = currentValue;
  }

  /**
   * Get input value from element
   */
  getInputValue(element) {
    if (!element) return '';

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return element.value || '';
    }

    if (element.contentEditable === 'true' ||
      element.getAttribute('contenteditable') === 'true') {
      return element.textContent || '';
    }

    return '';
  }

  /**
   * Mark a message as automated (to avoid false positives)
   * @param {string} message - The automated message text
   */
  markAsAutomated(message) {
    const trimmed = message.trim();
    this.recentAutomatedMessages.add(trimmed);

    // Clean up old entries after 10 seconds
    setTimeout(() => {
      this.recentAutomatedMessages.delete(trimmed);
    }, 10000);
  }

  /**
   * Update the input selector
   */
  updateInputSelector(newSelector) {
    const wasMonitoring = this.isMonitoring;
    const callback = this.onManualSendCallback;

    if (wasMonitoring) {
      this.stopMonitoring();
    }

    this.inputSelector = newSelector;

    if (wasMonitoring && callback) {
      this.startMonitoring(newSelector, callback);
    }
  }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ManualMessageDetector;
}
