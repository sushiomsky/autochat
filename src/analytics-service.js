/**
 * AnalyticsService
 * Handles storage, tracking, and aggregation of usage data.
 * Uses chrome.storage.local for persistence.
 */
class AnalyticsService {
    constructor() {
        this.STORAGE_KEYS = {
            DAILY: 'analytics_daily',
            HOURLY: 'analytics_hourly',
            LOGS: 'analytics_logs',
            META: 'analytics_meta'
        };

        // Retention policies
        this.RETENTION = {
            LOGS_MAX_COUNT: 1000,         // Keep last 1000 events interactions
            LOGS_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
            HOURLY_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
    }

    /**
     * Initialize the service
     */
    async init() {
        // Perform any cleanup or migration if needed
        await this.pruneOldData();
    }

    /**
     * Record a new event
     * @param {string} type - 'message_sent', 'message_failed', 'session_start', etc.
     * @param {Object} data - Additional metadata
     */
    async recordEvent(type, data = {}) {
        const timestamp = Date.now();
        const event = {
            id: this._generateId(),
            timestamp,
            type,
            data
        };

        // Update aggregated stats immediately for real-time responsiveness
        await this._updateAggregates(event);

        // Append to logs
        await this._appendLog(event);
    }

    /**
     * Get stats for a specific range
     * @param {string} range - '24h', '7d', '30d', 'all'
     */
    async getStats(range = '7d') {
        const dailyData = await this._getStorage(this.STORAGE_KEYS.DAILY) || {};
        const hourlyData = await this._getStorage(this.STORAGE_KEYS.HOURLY) || {};

        // Prepare return structure
        const stats = {
            summary: {
                totalSent: 0,
                totalFailed: 0,
                successRate: 0,
                activeDays: 0
            },
            timeSeries: [], // [ { date/time, sent, failed } ]
            hourlyHeatmap: Array(24).fill(0) // Distribution 0-23h (accumulated)
        };

        const now = Date.now();
        let startTime = 0;

        switch (range) {
            case '24h':
                startTime = now - (24 * 60 * 60 * 1000);

                // Use hourly data for 24h view
                Object.entries(hourlyData).forEach(([key, data]) => {
                    // Key format: YYYY-MM-DD-HH
                    // We can reconstruct timestamp roughly or store it
                    if (data.timestamp >= startTime) {
                        stats.timeSeries.push({
                            label: this._formatTime(data.timestamp),
                            timestamp: data.timestamp,
                            sent: data.sent || 0,
                            failed: data.failed || 0
                        });

                        stats.summary.totalSent += (data.sent || 0);
                        stats.summary.totalFailed += (data.failed || 0);

                        // Populate heatmap
                        const hour = new Date(data.timestamp).getHours();
                        stats.hourlyHeatmap[hour] += (data.sent || 0);
                    }
                });
                break;

            case '7d':
            case '30d':
            case 'all':
                const days = range === '7d' ? 7 : (range === '30d' ? 30 : 36500);
                startTime = now - (days * 24 * 60 * 60 * 1000);

                Object.entries(dailyData).forEach(([dateStr, data]) => {
                    if (data.timestamp >= startTime) {
                        stats.timeSeries.push({
                            label: dateStr,
                            timestamp: data.timestamp,
                            sent: data.sent || 0,
                            failed: data.failed || 0
                        });

                        stats.summary.totalSent += (data.sent || 0);
                        stats.summary.totalFailed += (data.failed || 0);
                        stats.summary.activeDays++;
                    }

                    // Add to heatmap (accumulate all historical data for typical activity patterns)
                    if (data.hourlyDistribution) {
                        data.hourlyDistribution.forEach((count, i) => {
                            stats.hourlyHeatmap[i] += count;
                        });
                    }
                });
                break;
        }

        // Calculate success rate
        const total = stats.summary.totalSent + stats.summary.totalFailed;
        stats.summary.successRate = total > 0
            ? Math.round((stats.summary.totalSent / total) * 100)
            : 0;

        // Sort timeSeries by timestamp
        stats.timeSeries.sort((a, b) => a.timestamp - b.timestamp);

        return stats;
    }

    /**
     * Get team-wide performance stats (simulated for Pro)
     */
    async getTeamStats() {
        const localStats = await this.getStats('24h');

        // Simulate a team of 4 members
        const teamTotal = localStats.summary.totalSent * 3.5 + 850;
        const teamGoal = 5000;

        return {
            totalSent: Math.floor(teamTotal),
            goal: teamGoal,
            progress: Math.min(100, Math.floor((teamTotal / teamGoal) * 100)),
            activeMembers: 3
        };
    }

    async _appendLog(event) {
        const logs = await this._getStorage(this.STORAGE_KEYS.LOGS) || [];
        logs.push(event);

        // Simple pruning: keep last N
        if (logs.length > this.RETENTION.LOGS_MAX_COUNT) {
            logs.splice(0, logs.length - this.RETENTION.LOGS_MAX_COUNT);
        }

        await this._setStorage(this.STORAGE_KEYS.LOGS, logs);
    }

    async _updateAggregates(event) {
        const now = new Date(event.timestamp);
        const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const hourKey = `${dateKey}-${String(now.getHours()).padStart(2, '0')}`; // YYYY-MM-DD-HH

        // 1. Update Hourly
        const hourlyAll = await this._getStorage(this.STORAGE_KEYS.HOURLY) || {};
        if (!hourlyAll[hourKey]) {
            hourlyAll[hourKey] = { timestamp: event.timestamp, sent: 0, failed: 0 };
        }

        if (event.type === 'message_sent') hourlyAll[hourKey].sent++;
        if (event.type === 'message_failed') hourlyAll[hourKey].failed++;

        await this._setStorage(this.STORAGE_KEYS.HOURLY, hourlyAll);

        // 2. Update Daily
        const dailyAll = await this._getStorage(this.STORAGE_KEYS.DAILY) || {};
        if (!dailyAll[dateKey]) {
            dailyAll[dateKey] = {
                timestamp: event.timestamp,
                sent: 0,
                failed: 0,
                hourlyDistribution: Array(24).fill(0)
            };
        }

        if (event.type === 'message_sent') dailyAll[dateKey].sent++;
        if (event.type === 'message_failed') dailyAll[dateKey].failed++;

        // Update hourly distribution within the day
        const hour = now.getHours();
        if (!dailyAll[dateKey].hourlyDistribution) dailyAll[dateKey].hourlyDistribution = Array(24).fill(0);
        dailyAll[dateKey].hourlyDistribution[hour]++;

        await this._setStorage(this.STORAGE_KEYS.DAILY, dailyAll);
    }

    async pruneOldData() {
        const now = Date.now();

        // Prune hourly data
        const hourlyAll = await this._getStorage(this.STORAGE_KEYS.HOURLY) || {};
        let changed = false;
        Object.keys(hourlyAll).forEach(key => {
            if (now - hourlyAll[key].timestamp > this.RETENTION.HOURLY_MAX_AGE_MS) {
                delete hourlyAll[key];
                changed = true;
            }
        });

        if (changed) {
            await this._setStorage(this.STORAGE_KEYS.HOURLY, hourlyAll);
        }
    }

    // Helper: Wrapper for chrome.storage.local.get
    _getStorage(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        });
    }

    // Helper: Wrapper for chrome.storage.local.set
    _setStorage(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => {
                resolve();
            });
        });
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    _formatTime(timestamp) {
        const d = new Date(timestamp);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
}

// Export singleton
// Export singleton
const analyticsService = new AnalyticsService();
// If using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = analyticsService;
} else {
    // Browser/Service Worker environment
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.AnalyticsService = analyticsService;
}
