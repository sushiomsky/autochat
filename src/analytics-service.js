/**
 * AnalyticsService
 * Handles storage, tracking, and aggregation of usage data.
 * Uses chrome.storage.local for persistence.
 */
const AnalyticsServiceClass = class {
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

    /**
     * Predictive Analytics: Find best send times based on historical success
     */
    async predictBestSendTimes() {
        const stats = await this.getStats('30d');
        const hourlySuccess = Array(24).fill(0).map(() => ({ sent: 0, failed: 0 }));

        // Aggregate success rates by hour
        const dailyData = await this._getStorage(this.STORAGE_KEYS.DAILY) || {};
        Object.values(dailyData).forEach(day => {
            if (day.hourlyDistribution) {
                day.hourlyDistribution.forEach((count, hour) => {
                    hourlySuccess[hour].sent += count;
                });
            }
        });

        // Calculate success rate per hour and sort
        const hourlyRates = hourlySuccess.map((data, hour) => {
            const total = data.sent + data.failed;
            const rate = total > 0 ? (data.sent / total) : 0;
            return { hour, rate, count: data.sent };
        });

        // Filter out hours with no data and sort by rate
        const validHours = hourlyRates
            .filter(h => h.count > 0)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5)
            .map(h => h.hour);

        return validHours.length > 0 ? validHours : [9, 12, 14, 18, 20]; // Default if no data
    }

    /**
     * Calculate optimal interval based on success patterns
     */
    async calculateOptimalInterval() {
        const logs = await this._getStorage(this.STORAGE_KEYS.LOGS) || [];

        if (logs.length < 10) {
            return { min: 60, max: 120, confidence: 'low' };
        }

        // Analyze intervals between successful sends
        const sentEvents = logs.filter(e => e.type === 'message_sent');
        const intervals = [];

        for (let i = 1; i < sentEvents.length; i++) {
            const interval = (sentEvents[i].timestamp - sentEvents[i - 1].timestamp) / 1000; // seconds
            if (interval > 0 && interval < 600) { // Only consider intervals < 10 min
                intervals.push(interval);
            }
        }

        if (intervals.length === 0) {
            return { min: 60, max: 120, confidence: 'low' };
        }

        // Calculate median and standard deviation
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        // Suggest range around median
        const min = Math.max(30, Math.floor(median * 0.8));
        const max = Math.ceil(median * 1.2);

        return {
            min,
            max,
            median: Math.floor(median),
            mean: Math.floor(mean),
            confidence: intervals.length > 50 ? 'high' : intervals.length > 20 ? 'medium' : 'low'
        };
    }

    /**
     * Generate AI recommendations based on analytics
     */
    async generateRecommendations() {
        const stats = await this.getStats('7d');
        const bestTimes = await this.predictBestSendTimes();
        const optimalInterval = await this.calculateOptimalInterval();
        const recommendations = [];

        // Success rate recommendation
        if (stats.summary.successRate < 80) {
            recommendations.push({
                type: 'warning',
                title: 'Low Success Rate',
                message: `Your success rate is ${stats.summary.successRate}%. Consider adjusting your intervals or checking site selectors.`,
                action: 'Review Settings'
            });
        } else if (stats.summary.successRate > 95) {
            recommendations.push({
                type: 'success',
                title: 'Excellent Performance',
                message: `Your success rate is ${stats.summary.successRate}%! Great job!`,
                action: null
            });
        }

        // Best times recommendation
        if (bestTimes.length > 0) {
            const timeStr = bestTimes.map(h => {
                const d = new Date();
                d.setHours(h);
                return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
            }).join(', ');

            recommendations.push({
                type: 'info',
                title: 'Optimal Send Times',
                message: `Based on your history, the best times to send are: ${timeStr}`,
                action: 'Set Active Hours'
            });
        }

        // Interval recommendation
        if (optimalInterval.confidence !== 'low') {
            recommendations.push({
                type: 'info',
                title: 'Suggested Interval',
                message: `Optimal interval: ${optimalInterval.min}-${optimalInterval.max} seconds (${optimalInterval.confidence} confidence)`,
                action: 'Update Intervals'
            });
        }

        // Activity recommendation
        if (stats.summary.activeDays < 3) {
            recommendations.push({
                type: 'tip',
                title: 'Increase Activity',
                message: 'You\'ve been active for only a few days. More data will improve recommendations.',
                action: null
            });
        }

        return recommendations;
    }

    /**
     * Export analytics data as JSON
     */
    async exportJSON() {
        const stats = await this.getStats('all');
        const dailyData = await this._getStorage(this.STORAGE_KEYS.DAILY) || {};
        const hourlyData = await this._getStorage(this.STORAGE_KEYS.HOURLY) || {};

        return {
            exportDate: new Date().toISOString(),
            version: '5.0',
            summary: stats.summary,
            timeSeries: stats.timeSeries,
            hourlyHeatmap: stats.hourlyHeatmap,
            rawData: {
                daily: dailyData,
                hourly: hourlyData
            }
        };
    }

    /**
     * Export analytics data as CSV
     */
    async exportCSV() {
        const stats = await this.getStats('all');
        const logs = await this._getStorage(this.STORAGE_KEYS.LOGS) || [];

        let csv = 'Date,Messages Sent,Messages Failed,Success Rate\n';
        stats.timeSeries.forEach(entry => {
            const total = entry.sent + entry.failed;
            const rate = total > 0 ? Math.round((entry.sent / total) * 100) : 0;
            csv += `${entry.label},${entry.sent},${entry.failed},${rate}%\n`;
        });

        if (logs.length > 0) {
            csv += '\nTimestamp,Type,Details\n';
            logs.forEach(l => {
                const date = new Date(l.timestamp).toISOString();
                const details = l.data ? JSON.stringify(l.data).replace(/,/g, ';') : '';
                csv += `${date},${l.type},${details}\n`;
            });
        }

        return csv;
    }

    /**
     * Get chart-ready data for visualization
     */
    async getChartData(range = '7d') {
        const stats = await this.getStats(range);

        return {
            // Line chart: Message trends
            trendChart: {
                labels: stats.timeSeries.map(d => d.label),
                sent: stats.timeSeries.map(d => d.sent),
                failed: stats.timeSeries.map(d => d.failed)
            },
            // Bar chart: Hourly distribution
            hourlyChart: stats.hourlyHeatmap, // Array(24)
            // Pie chart: Success vs Failure
            successChart: {
                labels: ['Successful', 'Failed'],
                data: [stats.summary.totalSent, stats.summary.totalFailed],
                colors: ['#10b981', '#ef4444']
            }
        };
    }

    /**
     * Generate smart recommendations
     */
    async generateRecommendations() {
        const stats = await this.getStats('7d');
        const recs = [];

        // 1. High Failure Rate
        if (stats.summary.totalSent > 50 && stats.summary.successRate < 80) {
            recs.push({
                type: 'warning',
                title: 'High Failure Rate Detected',
                message: `Your success rate is only ${stats.summary.successRate}%. Consider increasing message intervals.`,
                action: 'Adjust Interval'
            });
        }

        // 2. Optimal Time
        const peakHour = stats.hourlyHeatmap.indexOf(Math.max(...stats.hourlyHeatmap));
        recs.push({
            type: 'tip',
            title: 'Peak Performance Time',
            message: `Your most active hour is ${peakHour}:00. Scheduling during this time matches your behavior.`
        });

        // 3. Success Milestone
        if (stats.summary.totalSent > 1000) {
            recs.push({
                type: 'success',
                title: 'Automation Master',
                message: 'You have sent over 1,000 messages! Your setup is running smoothly.'
            });
        }

        return recs;
    }

    // --- Helpers ---

    _generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    _formatTime(ts) {
        const date = new Date(ts);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    // --- Storage Wrappers ---

    async _getStorage(key) {
        const res = await chrome.storage.local.get([key]);
        return res[key];
    }

    async _setStorage(key, value) {
        await chrome.storage.local.set({ [key]: value });
    }
};

// Export singleton - wrapped in IIFE
(function () {
    const analyticsService = new AnalyticsServiceClass();
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.AnalyticsService = analyticsService;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = analyticsService;
    }
})();
