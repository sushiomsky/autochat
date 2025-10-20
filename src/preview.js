/**
 * Message Preview & Dry-Run Mode
 * Test messages without actually sending them
 */

export class PreviewManager {
  constructor() {
    this.dryRunMode = false;
    this.previewHistory = [];
    this.maxHistory = 50;
  }

  /**
   * Enable/disable dry-run mode
   * @param {boolean} enabled - Enable state
   */
  setDryRunMode(enabled) {
    this.dryRunMode = enabled;
    chrome.storage.local.set({ dryRunMode: enabled });
  }

  /**
   * Check if dry-run mode is active
   * @returns {boolean}
   */
  isDryRunMode() {
    return this.dryRunMode;
  }

  /**
   * Preview a message with template variables processed
   * @param {string} message - Message template
   * @param {object} variables - Variable values
   * @returns {object} Preview result
   */
  previewMessage(message, variables = {}) {
    const processed = this.processTemplateVariables(message, variables);
    
    const preview = {
      original: message,
      processed: processed,
      length: processed.length,
      timestamp: new Date().toISOString(),
      variables: this.extractVariables(message),
      warnings: this.checkWarnings(processed)
    };

    // Add to history
    this.previewHistory.unshift(preview);
    if (this.previewHistory.length > this.maxHistory) {
      this.previewHistory.pop();
    }

    return preview;
  }

  /**
   * Process template variables in message
   * @param {string} text - Message with variables
   * @param {object} customVars - Custom variable values
   * @returns {string} Processed message
   */
  processTemplateVariables(text, customVars = {}) {
    const emojis = ['😊', '😎', '👍', '🎉', '✨', '🔥', '💪', '🌟', '😄', '🎯'];
    const now = new Date();

    let processed = text;

    // Custom variables first
    Object.keys(customVars).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, customVars[key]);
    });

    // Built-in variables
    processed = processed
      .replace(/\{time\}/g, now.toLocaleTimeString())
      .replace(/\{date\}/g, now.toLocaleDateString())
      .replace(/\{datetime\}/g, now.toLocaleString())
      .replace(/\{random_emoji\}/g, emojis[Math.floor(Math.random() * emojis.length)])
      .replace(/\{random_number\}/g, Math.floor(Math.random() * 100).toString())
      .replace(/\{timestamp\}/g, Date.now().toString())
      .replace(/\{day\}/g, now.toLocaleDateString('en-US', { weekday: 'long' }))
      .replace(/\{month\}/g, now.toLocaleDateString('en-US', { month: 'long' }))
      .replace(/\{year\}/g, now.getFullYear().toString());

    return processed;
  }

  /**
   * Extract variables from message template
   * @param {string} text - Message template
   * @returns {Array<string>} List of variables
   */
  extractVariables(text) {
    const regex = /\{([^}]+)\}/g;
    const variables = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)]; // Remove duplicates
  }

  /**
   * Check for potential issues in message
   * @param {string} text - Processed message
   * @returns {Array<object>} List of warnings
   */
  checkWarnings(text) {
    const warnings = [];

    // Check length
    if (text.length === 0) {
      warnings.push({
        type: 'empty',
        severity: 'error',
        message: 'Message is empty'
      });
    } else if (text.length > 2000) {
      warnings.push({
        type: 'length',
        severity: 'warning',
        message: `Message is very long (${text.length} characters). May be truncated.`
      });
    }

    // Check for unprocessed variables
    const unprocessed = text.match(/\{[^}]+\}/g);
    if (unprocessed) {
      warnings.push({
        type: 'variables',
        severity: 'warning',
        message: `Unprocessed variables: ${unprocessed.join(', ')}`
      });
    }

    // Check for common mistakes
    if (text.includes('undefined') || text.includes('null')) {
      warnings.push({
        type: 'value',
        severity: 'error',
        message: 'Message contains undefined or null values'
      });
    }

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    const repeated = Object.entries(wordCounts).filter(([_, count]) => count > 5);
    if (repeated.length > 0) {
      warnings.push({
        type: 'repetition',
        severity: 'info',
        message: `Word "${repeated[0][0]}" appears ${repeated[0][1]} times`
      });
    }

    return warnings;
  }

  /**
   * Simulate sending a message (dry-run)
   * @param {string} message - Message to simulate
   * @returns {object} Simulation result
   */
  simulateSend(message) {
    const preview = this.previewMessage(message);
    const delay = Math.random() * 2000 + 500; // Random delay 0.5-2.5s

    return {
      ...preview,
      wouldSend: !preview.warnings.some(w => w.severity === 'error'),
      simulatedDelay: Math.round(delay),
      dryRun: true,
      message: 'This is a simulation. No message was actually sent.'
    };
  }

  /**
   * Get preview history
   * @param {number} limit - Max number of items
   * @returns {Array<object>} Preview history
   */
  getHistory(limit = 10) {
    return this.previewHistory.slice(0, limit);
  }

  /**
   * Clear preview history
   */
  clearHistory() {
    this.previewHistory = [];
  }

  /**
   * Export preview history as JSON
   * @returns {string} JSON string
   */
  exportHistory() {
    return JSON.stringify({
      exported: new Date().toISOString(),
      count: this.previewHistory.length,
      previews: this.previewHistory
    }, null, 2);
  }

  /**
   * Batch preview multiple messages
   * @param {Array<string>} messages - Messages to preview
   * @returns {Array<object>} Preview results
   */
  batchPreview(messages) {
    return messages.map(msg => this.previewMessage(msg));
  }

  /**
   * Get statistics about previews
   * @returns {object} Statistics
   */
  getStats() {
    const total = this.previewHistory.length;
    const withWarnings = this.previewHistory.filter(p => p.warnings.length > 0).length;
    const avgLength = total > 0 
      ? Math.round(this.previewHistory.reduce((sum, p) => sum + p.length, 0) / total)
      : 0;

    return {
      total,
      withWarnings,
      avgLength,
      mostUsedVariables: this.getMostUsedVariables()
    };
  }

  /**
   * Get most frequently used variables
   * @returns {Array<object>} Variable usage stats
   */
  getMostUsedVariables() {
    const counts = {};
    
    this.previewHistory.forEach(preview => {
      preview.variables.forEach(variable => {
        counts[variable] = (counts[variable] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([variable, count]) => ({ variable, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Singleton instance
export const preview = new PreviewManager();
