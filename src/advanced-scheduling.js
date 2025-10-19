/**
 * Advanced Scheduling - Pro Feature
 * Allows scheduling messages for specific dates/times with recurring options
 */

import { hasFeature, FEATURES } from './licensing.js';
import { checkFeatureAccess } from './licensing-ui.js';

/**
 * Schedule entry structure
 * @typedef {Object} Schedule
 * @property {string} id - Unique identifier
 * @property {string} message - Message to send
 * @property {Date} scheduledTime - When to send
 * @property {boolean} recurring - Is this a recurring schedule
 * @property {string} recurrence - Type: 'daily', 'weekly', 'monthly'
 * @property {boolean} active - Is schedule active
 * @property {Date} created - When schedule was created
 */

class AdvancedScheduler {
  constructor() {
    this.schedules = [];
    this.checkInterval = null;
  }

  /**
   * Initialize scheduler
   */
  async init() {
    await this.loadSchedules();
    this.startChecking();
  }

  /**
   * Add new schedule
   * @param {string} message - Message to schedule
   * @param {Date} scheduledTime - When to send
   * @param {Object} options - Additional options
   * @returns {Schedule} - Created schedule
   */
  addSchedule(message, scheduledTime, options = {}) {
    // Check pro access
    if (!checkFeatureAccess(
      FEATURES.ADVANCED_SCHEDULING,
      'Advanced Scheduling',
      'Schedule messages for specific dates and times with recurring options.'
    )) {
      throw new Error('Pro feature required');
    }

    const schedule = {
      id: this.generateId(),
      message,
      scheduledTime,
      recurring: options.recurring || false,
      recurrence: options.recurrence || 'none',
      active: true,
      created: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.schedules.push(schedule);
    this.saveSchedules();

    return schedule;
  }

  /**
   * Remove schedule
   * @param {string} scheduleId - Schedule ID
   */
  removeSchedule(scheduleId) {
    this.schedules = this.schedules.filter(s => s.id !== scheduleId);
    this.saveSchedules();
  }

  /**
   * Update schedule
   * @param {string} scheduleId - Schedule ID
   * @param {Object} updates - Fields to update
   */
  updateSchedule(scheduleId, updates) {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
      this.saveSchedules();
    }
  }

  /**
   * Get all schedules
   * @returns {Array<Schedule>} - All schedules
   */
  getSchedules() {
    return this.schedules;
  }

  /**
   * Get upcoming schedules
   * @param {number} limit - Max number to return
   * @returns {Array<Schedule>} - Upcoming schedules
   */
  getUpcoming(limit = 5) {
    const now = new Date();
    return this.schedules
      .filter(s => s.active && new Date(s.scheduledTime) > now)
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
      .slice(0, limit);
  }

  /**
   * Start checking for due schedules
   */
  startChecking() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkDueSchedules();
    }, 60000);

    // Also check immediately
    this.checkDueSchedules();
  }

  /**
   * Stop checking for due schedules
   */
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for schedules that are due
   */
  async checkDueSchedules() {
    const now = new Date();

    for (const schedule of this.schedules) {
      if (!schedule.active) continue;

      const scheduledTime = new Date(schedule.scheduledTime);

      // Check if schedule is due (within 1 minute window)
      if (scheduledTime <= now && scheduledTime > new Date(now - 60000)) {
        await this.executeSchedule(schedule);
      }
    }
  }

  /**
   * Execute a scheduled message
   * @param {Schedule} schedule - Schedule to execute
   */
  async executeSchedule(schedule) {
    try {
      // Send message via content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'sendMessage',
          text: schedule.message
        });

        console.log('[Scheduler] Executed schedule:', schedule.id);

        // Handle recurring schedules
        if (schedule.recurring) {
          this.scheduleNext(schedule);
        } else {
          // Deactivate one-time schedule
          schedule.active = false;
          this.saveSchedules();
        }
      }
    } catch (error) {
      console.error('[Scheduler] Failed to execute schedule:', error);
    }
  }

  /**
   * Schedule next occurrence for recurring schedule
   * @param {Schedule} schedule - Recurring schedule
   */
  scheduleNext(schedule) {
    const current = new Date(schedule.scheduledTime);
    let next;

    switch (schedule.recurrence) {
      case 'daily':
        next = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        break;

      case 'weekly':
        next = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;

      case 'monthly':
        next = new Date(current);
        next.setMonth(next.getMonth() + 1);
        break;

      default:
        return;
    }

    schedule.scheduledTime = next;
    this.saveSchedules();
  }

  /**
   * Save schedules to storage
   */
  async saveSchedules() {
    await chrome.storage.local.set({
      advancedSchedules: this.schedules
    });
  }

  /**
   * Load schedules from storage
   */
  async loadSchedules() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['advancedSchedules'], (data) => {
        this.schedules = data.advancedSchedules || [];
        
        // Convert date strings back to Date objects
        this.schedules = this.schedules.map(s => ({
          ...s,
          scheduledTime: new Date(s.scheduledTime),
          created: new Date(s.created)
        }));
        
        resolve();
      });
    });
  }

  /**
   * Generate unique ID
   * @returns {string} - Unique ID
   */
  generateId() {
    return 'schedule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Clear all inactive schedules
   */
  clearInactive() {
    this.schedules = this.schedules.filter(s => s.active);
    this.saveSchedules();
  }

  /**
   * Export schedules as JSON
   * @returns {string} - JSON string
   */
  exportSchedules() {
    return JSON.stringify(this.schedules, null, 2);
  }

  /**
   * Import schedules from JSON
   * @param {string} json - JSON string
   * @returns {number} - Number of schedules imported
   */
  importSchedules(json) {
    try {
      const imported = JSON.parse(json);
      
      // Validate and add schedules
      let count = 0;
      for (const schedule of imported) {
        if (schedule.message && schedule.scheduledTime) {
          schedule.scheduledTime = new Date(schedule.scheduledTime);
          schedule.created = new Date(schedule.created || Date.now());
          schedule.id = this.generateId(); // Generate new IDs
          
          this.schedules.push(schedule);
          count++;
        }
      }
      
      this.saveSchedules();
      return count;
    } catch (error) {
      console.error('[Scheduler] Import failed:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const advancedScheduler = new AdvancedScheduler();

/**
 * Helper function to create a quick schedule
 * @param {string} message - Message to send
 * @param {Date} time - When to send
 * @returns {Schedule} - Created schedule
 */
export function quickSchedule(message, time) {
  return advancedScheduler.addSchedule(message, time);
}

/**
 * Helper function to create recurring schedule
 * @param {string} message - Message to send
 * @param {Date} startTime - First occurrence
 * @param {string} recurrence - Type: daily/weekly/monthly
 * @returns {Schedule} - Created schedule
 */
export function recurringSchedule(message, startTime, recurrence) {
  return advancedScheduler.addSchedule(message, startTime, {
    recurring: true,
    recurrence
  });
}
