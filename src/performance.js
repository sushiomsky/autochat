/**
 * Performance Monitoring Module
 * Tracks extension performance metrics for optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      messagesSent: [],
      typingSpeed: [],
      sendDuration: [],
      memoryUsage: [],
      errors: [],
    };
    this.startTime = Date.now();
  }

  /**
   * Record message send performance
   * @param {number} duration - Time taken to send message (ms)
   * @param {boolean} success - Whether send was successful
   */
  recordMessageSend(duration, success) {
    this.metrics.messagesSent.push({
      timestamp: Date.now(),
      duration,
      success,
    });

    // Keep only last 100 entries
    if (this.metrics.messagesSent.length > 100) {
      this.metrics.messagesSent.shift();
    }
  }

  /**
   * Record typing simulation speed
   * @param {number} wpm - Words per minute
   */
  recordTypingSpeed(wpm) {
    this.metrics.typingSpeed.push({
      timestamp: Date.now(),
      wpm,
    });

    if (this.metrics.typingSpeed.length > 50) {
      this.metrics.typingSpeed.shift();
    }
  }

  /**
   * Record error occurrence
   * @param {string} errorType - Type of error
   * @param {string} message - Error message
   */
  recordError(errorType, message) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      type: errorType,
      message,
    });

    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }
  }

  /**
   * Record memory usage (if available)
   */
  async recordMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      });

      if (this.metrics.memoryUsage.length > 20) {
        this.metrics.memoryUsage.shift();
      }
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate message send stats
    const successfulSends = this.metrics.messagesSent.filter((m) => m.success);
    const failedSends = this.metrics.messagesSent.filter((m) => !m.success);
    const avgSendDuration =
      successfulSends.length > 0
        ? successfulSends.reduce((sum, m) => sum + m.duration, 0) / successfulSends.length
        : 0;

    // Calculate typing speed stats
    const avgTypingSpeed =
      this.metrics.typingSpeed.length > 0
        ? this.metrics.typingSpeed.reduce((sum, t) => sum + t.wpm, 0) /
          this.metrics.typingSpeed.length
        : 0;

    // Calculate error rate
    const recentErrors = this.metrics.errors.filter((e) => now - e.timestamp < 3600000); // Last hour

    // Memory stats
    const latestMemory =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
        : null;

    return {
      uptime,
      messages: {
        total: this.metrics.messagesSent.length,
        successful: successfulSends.length,
        failed: failedSends.length,
        successRate:
          this.metrics.messagesSent.length > 0
            ? (successfulSends.length / this.metrics.messagesSent.length) * 100
            : 0,
        avgDuration: avgSendDuration,
      },
      typing: {
        avgSpeed: avgTypingSpeed,
        samples: this.metrics.typingSpeed.length,
      },
      errors: {
        total: this.metrics.errors.length,
        recentCount: recentErrors.length,
        byType: this.getErrorsByType(),
      },
      memory: latestMemory
        ? {
            usedMB: (latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(2),
            totalMB: (latestMemory.totalJSHeapSize / 1024 / 1024).toFixed(2),
            limitMB: (latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
            usagePercent: (
              (latestMemory.usedJSHeapSize / latestMemory.jsHeapSizeLimit) *
              100
            ).toFixed(2),
          }
        : null,
    };
  }

  /**
   * Get errors grouped by type
   * @returns {Object} Errors by type
   */
  getErrorsByType() {
    const byType = {};
    this.metrics.errors.forEach((error) => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });
    return byType;
  }

  /**
   * Get performance recommendations
   * @returns {Array<string>} List of recommendations
   */
  getRecommendations() {
    const stats = this.getStats();
    const recommendations = [];

    // Check success rate
    if (stats.messages.successRate < 90 && stats.messages.total > 10) {
      recommendations.push(
        '⚠️ Message success rate is below 90%. Check input field configuration.'
      );
    }

    // Check typing speed
    if (stats.typing.avgSpeed < 30) {
      recommendations.push('💡 Typing speed is slow. Consider increasing typing simulation speed.');
    } else if (stats.typing.avgSpeed > 100) {
      recommendations.push(
        '⚠️ Typing speed is very fast. May appear robotic. Consider slowing down.'
      );
    }

    // Check error frequency
    if (stats.errors.recentCount > 10) {
      recommendations.push(
        '⚠️ High error rate detected. Review recent errors and adjust settings.'
      );
    }

    // Check memory usage
    if (stats.memory && parseFloat(stats.memory.usagePercent) > 80) {
      recommendations.push(
        '⚠️ High memory usage detected. Consider reducing message history or restarting extension.'
      );
    }

    // Check send duration
    if (stats.messages.avgDuration > 5000) {
      recommendations.push(
        '💡 Average send time is high. Check typing simulation settings or network latency.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is optimal! No issues detected.');
    }

    return recommendations;
  }

  /**
   * Export metrics for analysis
   * @returns {Object} All metrics data
   */
  exportMetrics() {
    return {
      startTime: this.startTime,
      exportTime: Date.now(),
      metrics: this.metrics,
      stats: this.getStats(),
      recommendations: this.getRecommendations(),
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {
      messagesSent: [],
      typingSpeed: [],
      sendDuration: [],
      memoryUsage: [],
      errors: [],
    };
    this.startTime = Date.now();
  }

  /**
   * Save metrics to storage
   */
  async saveToStorage() {
    try {
      await chrome.storage.local.set({
        performanceMetrics: this.exportMetrics(),
      });
    } catch (error) {
      console.error('[Performance] Failed to save metrics:', error);
    }
  }

  /**
   * Load metrics from storage
   */
  async loadFromStorage() {
    try {
      const data = await chrome.storage.local.get(['performanceMetrics']);
      if (data.performanceMetrics) {
        this.metrics = data.performanceMetrics.metrics || this.metrics;
        this.startTime = data.performanceMetrics.startTime || this.startTime;
      }
    } catch (error) {
      console.error('[Performance] Failed to load metrics:', error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}
